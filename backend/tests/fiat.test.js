const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// keep mock state across tests so they can be configured per-test
jest.mock('axios');

// force demo mode for easier testing (bypasses real Flutterwave calls)
jest.mock('../config', () => ({ DEMO_MODE: true }));

// stub individual model modules used by the controller
jest.mock('../models/UserModel', () => ({
  findById: jest.fn()
}));
jest.mock('../models/FlutterwaveTransactionModel', () => {
  return jest.fn().mockImplementation(data => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'mocked-id' })
  }));
});
jest.mock('../models/UnifiedPaymentModel', () => {
  return jest.fn().mockImplementation(data => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'mocked-id' })
  }));
});


// SocketManager may be called during some flows; stub it to avoid side effects
jest.mock('../socket/Manager', () => ({
  userDepositSuccess: jest.fn(),
}));

const UserModel = require('../models/UserModel');
const FlutterwaveTransactionModel = require('../models/FlutterwaveTransactionModel');
const UnifiedPaymentModel = require('../models/UnifiedPaymentModel');
const axios = require('axios');

const paymentRouter = require('../routes/paymentRouterV2');

describe('Fiat payment routes (demo mode)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api', paymentRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/fiat/deposit', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/fiat/deposit').send({});
      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toMatch(/Missing required fields/);
    });

    it('should return 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/fiat/deposit')
        .send({ userId: 'u1', amount: 10, currency: 'USD', paymentMethod: 'card' });
      expect(res.status).toBe(404);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toMatch(/User not found/);
    });

    it('should default paymentMethod when omitted', async () => {
      const fakeUser = {
        _id: 'u2',
        email: 'foo@example.com',
        demoBalance: { data: [] },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      UserModel.findById.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post('/api/fiat/deposit')
        .send({ userId: 'u2', amount: 50, currency: 'USD' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(fakeUser.save).toHaveBeenCalled();
      const entry = fakeUser.demoBalance.data.find(b => b.currency === 'USD');
      expect(entry.balance).toBe(50);
      // should still receive a link
      expect(res.body.paymentLink || res.body.data?.paymentLink).toBeDefined();
    });

    it('should process demo deposit and credit demoBalance', async () => {
      const fakeUser = {
        _id: 'u1',
        email: 'test@example.com',
        demoBalance: { data: [] },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      UserModel.findById.mockResolvedValue(fakeUser);

      // also make axios.verify call succeed when controller hits it
      const mockTx = { id: 'tx123', status: 'successful', amount: 75, charge: 0 };
      axios.get.mockResolvedValue({ data: { status: 'success', data: mockTx } });

      const res = await request(app)
        .post('/api/fiat/deposit')
        .send({
          userId: 'u1',
          amount: 75,
          currency: 'USD',
          paymentMethod: 'card',
          email: 'test@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toMatch(/Demo payment processed/);
      expect(fakeUser.save).toHaveBeenCalled();

      // should return a paymentLink even in demo mode for UI redirect
      expect(res.body.paymentLink || res.body.data?.paymentLink).toBeDefined();

      // in demo mode we don't call verifyPayment; backend returns link only
      const reference = res.body.data?.reference || res.body.transactionId;
      expect(reference).toBeDefined();

      // demo balance should be updated
      const entry = fakeUser.demoBalance.data.find(b => b.currency === 'USD');
      expect(entry).toBeDefined();
      expect(entry.balance).toBe(75);
    });
  });

  describe('POST /api/fiat/withdraw', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/fiat/withdraw').send({});
      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toMatch(/Missing required fields/);
    });

    it('should return 404 when user is not found', async () => {
      UserModel.findById.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/fiat/withdraw')
        .send({
          userId: 'u1',
          amount: 10,
          currency: 'USD',
          bankName: 'MyBank',
          accountNumber: '1234',
          accountHolder: 'Joe'
        });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toMatch(/User not found/);
    });

    it('should reject when demo balance is insufficient', async () => {
      const fakeUser = {
        _id: 'u1',
        email: 'test@example.com',
        demoBalance: 20,
        balance: 100,
        save: jest.fn()
      };
      UserModel.findById.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post('/api/fiat/withdraw')
        .send({
          userId: 'u1',
          amount: 50,
          currency: 'USD',
          bankName: 'MyBank',
          accountNumber: '1234',
          accountHolder: 'Joe',
          isDemo: true
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toMatch(/Insufficient demo balance/);
    });

    it('should process demo withdrawal and deduct demoBalance', async () => {
      const fakeUser = {
        _id: 'u1',
        email: 'test@example.com',
        demoBalance: 200,
        balance: 500,
        save: jest.fn().mockResolvedValue(true)
      };
      UserModel.findById.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post('/api/fiat/withdraw')
        .send({
          userId: 'u1',
          amount: 150,
          currency: 'USD',
          bankName: 'MyBank',
          accountNumber: '1234',
          accountHolder: 'Joe',
          isDemo: true
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toMatch(/Demo withdrawal processed successfully/);
      expect(fakeUser.save).toHaveBeenCalled();
      expect(fakeUser.demoBalance).toBe(50); // 200 - 150
    });
  });
});
