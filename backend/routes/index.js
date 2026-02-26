const routerx = require('express-promise-router');
const paymentRouter = require('./paymentRouter');
const paymentRouterV2 = require('./paymentRouterV2');
const authRouter = require('./authRouter');
const Router = routerx();

Router.use('/api/v0/payment', paymentRouter);
Router.use('/api/v0/payments', paymentRouterV2); // New unified payment system
Router.use('/api/auth', authRouter);

module.exports = Router;