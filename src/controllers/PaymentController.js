/**
 * Payment Controller
 * Handles payment and transfer HTTP requests
 * Follows Single Responsibility Principle
 */

class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Transfer money between users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async transferMoney(req, res) {
        try {
            const fromUserId = req.session?.userId;
            const { toUserId, amount } = req.body;

            if (!fromUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!toUserId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Alıcı kullanıcı ID\'si ve tutar gereklidir'
                });
            }

            const result = await this.paymentService.transferMoney(
                fromUserId,
                toUserId,
                parseFloat(amount)
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Transfer controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Process payment to merchant
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async processPayment(req, res) {
        try {
            const userId = req.session?.userId;
            const { merchantId, amount } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!merchantId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'İşyeri ID\'si ve tutar gereklidir'
                });
            }

            const result = await this.paymentService.processPayment(
                userId,
                merchantId,
                parseFloat(amount)
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Payment controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Top up user wallet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async topUpWallet(req, res) {
        try {
            const userId = req.session?.userId;
            const { amount } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçerli bir tutar giriniz'
                });
            }

            const result = await this.paymentService.topUpWallet(
                userId,
                parseFloat(amount)
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Top-up controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get wallet balance
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getBalance(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.paymentService.getWalletBalance(userId);

            const statusCode = result.success ? 200 : 404;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get balance controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get transaction history
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getTransactionHistory(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 20;

            const result = await this.paymentService.getTransactionHistory(
                userId,
                page,
                pageSize
            );

            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get transaction history controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Process payment with QR code
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async paymentWithQR(req, res) {
        try {
            const userId = req.session?.userId;
            const { qrData } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!qrData) {
                return res.status(400).json({
                    success: false,
                    message: 'QR kod verisi gereklidir'
                });
            }

            const result = await this.paymentService.processQRPayment(userId, qrData);

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('QR payment controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get QR code information by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getQRInfo(req, res) {
        try {
            const { qrId } = req.query;

            if (!qrId) {
                return res.status(400).json({
                    success: false,
                    message: 'QR ID gereklidir'
                });
            }

            const qrInfo = this.paymentService.getQRCodeById(qrId);

            if (!qrInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'QR kod bulunamadı'
                });
            }

            return res.status(200).json({
                success: true,
                data: qrInfo
            });

        } catch (error) {
            console.error('Get QR info controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

module.exports = PaymentController;
