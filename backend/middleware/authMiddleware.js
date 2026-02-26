// Auth middleware - validates JWT token and attaches user to request
const JWT = require('jsonwebtoken');
const config = require('../config');
const models = require('../models');

/**
 * Verify JWT token from request body or headers
 * Sets req.user and req.userId if valid
 */
module.exports = async (req, res, next) => {
    try {
        // Extract token from header (Authorization: Bearer {token}) or body (token field)
        let token = req.headers.authorization?.replace('Bearer ', '');
        if (!token && req.body) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(401).json({ status: false, message: 'Missing authentication token' });
        }

        // Verify JWT
        JWT.verify(token, config.JWT.secret, async (err, decoded) => {
            if (err) {
                console.warn('❌ JWT verification failed:', err.message);
                return res.status(401).json({ status: false, message: 'Invalid or expired token' });
            }

            // Find user by token in database
            try {
                const user = await models.userModel.findOne({ userToken: token });
                if (!user) {
                    return res.status(401).json({ status: false, message: 'User not found' });
                }

                // Attach user and userId to request
                req.user = user;
                req.userId = user._id.toString();
                next();
            } catch (dbErr) {
                console.error('❌ User lookup error:', dbErr.message);
                return res.status(500).json({ status: false, message: 'Authentication failed' });
            }
        });
    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        return res.status(500).json({ status: false, message: 'Authentication error' });
    }
};
