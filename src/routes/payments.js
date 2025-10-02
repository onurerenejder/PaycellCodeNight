/**
 * Payment Routes
 * Defines payment and transfer API endpoints
 * Follows RESTful principles
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createPaymentRoutes(paymentController) {
    const router = express.Router();

    // Get QR code information by ID (no auth required for demo)
    router.get('/qr-info', paymentController.getQRInfo.bind(paymentController));

    // Apply authentication middleware to all other routes
    router.use(authMiddleware);

    // Transfer money between users
    router.post('/transfer', paymentController.transferMoney.bind(paymentController));

    // Process payment to merchant
    router.post('/payment', paymentController.processPayment.bind(paymentController));

    // Top up wallet
    router.post('/topup', paymentController.topUpWallet.bind(paymentController));

    // Get wallet balance
    router.get('/balance', paymentController.getBalance.bind(paymentController));

    // Get transaction history
    router.get('/history', paymentController.getTransactionHistory.bind(paymentController));

    // Process payment with QR code
    router.post('/qr-payment', paymentController.paymentWithQR.bind(paymentController));

    return router;
}

module.exports = createPaymentRoutes;
