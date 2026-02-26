const axios = require('axios');
const crypto = require('crypto');

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

/**
 * Axios instance for NOWPayments API calls
 */
const nowpaymentsAxios = axios.create({
    baseURL: NOWPAYMENTS_API_URL,
    timeout: 30000,
    headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
});

/**
 * Create a payment order via NOWPayments API
 * @param {Object} params - Payment parameters
 * @param {number} params.price_amount - Amount in the price currency
 * @param {string} params.price_currency - Price currency (USD, EUR, etc.)
 * @param {string} params.pay_currency - Payment currency (USDTTRC20, USDTERC20, BTC, ETH, etc.)
 * @param {string} params.ipn_callback_url - IPN callback URL for payment confirmation
 * @param {string} params.order_id - Unique order ID
 * @param {string} params.order_description - Order description
 * @returns {Promise<Object>} Payment order with payment_id and payment address
 */
async function createPayment(params) {
    try {
        console.log('📊 Creating NOWPayments order:', {
            price_amount: params.price_amount,
            price_currency: params.price_currency,
            pay_currency: params.pay_currency,
            order_id: params.order_id
        });

        const response = await nowpaymentsAxios.post('/payment', {
            price_amount: parseFloat(params.price_amount),
            price_currency: params.price_currency,
            pay_currency: params.pay_currency,
            ipn_callback_url: params.ipn_callback_url,
            order_id: params.order_id,
            order_description: params.order_description || 'Casino deposit'
        });

        if (response.status === 201 && response.data) {
            console.log('✅ NOWPayments order created with full data:', response.data);

            return {
                status: true,
                data: {
                    payment_id: response.data.payment_id,
                    pay_address: response.data.pay_address,
                    pay_amount: response.data.pay_amount,
                    pay_currency: response.data.pay_currency,
                    price_amount: response.data.price_amount,
                    price_currency: response.data.price_currency,
                    order_id: response.data.order_id,
                    order_description: response.data.order_description,
                    created_at: response.data.created_at,
                    expire_at: response.data.expire_at || new Date(Date.now() + 86400000), // Fallback to 24 hours if not provided
                    status: response.data.status
                }
            };
        }

        return {
            status: false,
            message: 'Failed to create payment order',
            error: response.data
        };
    } catch (error) {
        console.error('❌ NOWPayments API error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        return {
            status: false,
            message: error.response?.data?.message || error.message,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Get payment status from NOWPayments
 * @param {string} paymentId - NOWPayments payment ID
 * @returns {Promise<Object>} Payment status details
 */
async function getPaymentStatus(paymentId) {
    try {
        const response = await nowpaymentsAxios.get(`/payment/${paymentId}`);

        if (response.status === 200 && response.data) {
            console.log('✅ Payment status retrieved:', {
                payment_id: response.data.payment_id,
                status: response.data.status,
                pay_address: response.data.pay_address
            });

            return {
                status: true,
                data: {
                    payment_id: response.data.payment_id,
                    status: response.data.status,
                    pay_address: response.data.pay_address,
                    pay_amount: response.data.pay_amount,
                    pay_currency: response.data.pay_currency,
                    price_amount: response.data.price_amount,
                    price_currency: response.data.price_currency,
                    actually_paid: response.data.actually_paid,
                    actually_paid_at: response.data.actually_paid_at,
                    created_at: response.data.created_at,
                    expire_at: response.data.expire_at,
                    order_id: response.data.order_id,
                    is_fixed_rate: response.data.is_fixed_rate,
                    is_fee_paid_by_user: response.data.is_fee_paid_by_user
                }
            };
        }

        return {
            status: false,
            message: 'Failed to retrieve payment status',
            error: response.data
        };
    } catch (error) {
        console.error('❌ Failed to get payment status:', error.message);

        return {
            status: false,
            message: error.response?.data?.message || error.message,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Verify NOWPayments IPN webhook signature
 * Uses HMAC-SHA512 signature verification
 * @param {Object} body - Request body from IPN
 * @param {string} signature - X-NOWPAYMENTS-SIG header value
 * @returns {boolean} True if signature is valid
 */
function verifyIPNSignature(body, signature) {
    if (!signature || !IPN_SECRET) {
        console.warn('⚠️ Missing signature or IPN_SECRET for verification');
        return false;
    }

    try {
        // NOWPayments signature is HMAC-SHA512 of the body string
        const hash = crypto
            .createHmac('sha512', IPN_SECRET)
            .update(JSON.stringify(body), 'utf-8')
            .digest('hex');

        const isValid = hash === signature;

        if (isValid) {
            console.log('✅ IPN signature verified successfully');
        } else {
            console.warn('⚠️ IPN signature verification failed');
            console.log('Expected:', signature);
            console.log('Got:', hash);
        }

        return isValid;
    } catch (error) {
        console.error('❌ Error verifying IPN signature:', error.message);
        return false;
    }
}

/**
 * Get list of available currencies from NOWPayments
 * @returns {Promise<Object>} List of supported currencies
 */
async function getAvailableCurrencies() {
    try {
        const response = await nowpaymentsAxios.get('/currencies');

        if (response.status === 200 && response.data) {
            return {
                status: true,
                data: response.data.currencies || []
            };
        }

        return {
            status: false,
            message: 'Failed to retrieve currencies',
            error: response.data
        };
    } catch (error) {
        console.error('❌ Failed to get currencies:', error.message);

        return {
            status: false,
            message: error.message,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Get estimated price for payment conversion
 * @param {Object} params - Conversion parameters
 * @param {string} params.amount - Amount in pay_currency
 * @param {string} params.pay_currency - Payment currency (e.g., 'USDTTRC20')
 * @param {string} params.price_currency - Price currency (e.g., 'USD')
 * @returns {Promise<Object>} Estimated price
 */
async function getEstimatedPrice(params) {
    try {
        const query = new URLSearchParams({
            amount: params.amount,
            pay_currency: params.pay_currency,
            price_currency: params.price_currency
        }).toString();

        const response = await nowpaymentsAxios.get(`/estimate?${query}`);

        if (response.status === 200 && response.data) {
            return {
                status: true,
                data: {
                    pay_amount: response.data.pay_amount,
                    pay_currency: response.data.pay_currency,
                    price_amount: response.data.price_amount,
                    price_currency: response.data.price_currency,
                    estimated_at: response.data.estimated_at
                }
            };
        }

        return {
            status: false,
            message: 'Failed to estimate price',
            error: response.data
        };
    } catch (error) {
        console.error('❌ Failed to estimate price:', error.message);

        return {
            status: false,
            message: error.message,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Create a payout (withdrawal) via NOWPayments
 * @param {Object} params - Payout parameters
 * @param {string} params.currency - Payout currency (eg 'USDTTRC20')
 * @param {number} params.amount - Amount to payout
 * @param {string} params.address - Destination address
 * @param {string} params.external_id - External id for reconciliation (eg withdrawal id)
 * @returns {Promise<Object>} Payout creation result
 */
async function createPayout(params) {
    try {
        console.log('📤 Creating NOWPayments payout:', params);

        const body = {
            currency: params.currency,
            amount: Number(params.amount),
            address: params.address,
            external_id: params.external_id
        };

        const response = await nowpaymentsAxios.post('/payout', body);

        if ((response.status === 200 || response.status === 201) && response.data) {
            console.log('✅ NOWPayments payout created:', response.data);
            return {
                status: true,
                data: response.data
            };
        }

        return {
            status: false,
            message: 'Failed to create payout',
            error: response.data
        };
    } catch (error) {
        console.error('❌ NOWPayments payout error:', error.response?.data || error.message);
        return {
            status: false,
            message: error.response?.data?.message || error.message,
            error: error.response?.data || error.message
        };
    }
}

module.exports = {
    createPayment,
    getPaymentStatus,
    verifyIPNSignature,
    getAvailableCurrencies,
    getEstimatedPrice
    , createPayout
};
