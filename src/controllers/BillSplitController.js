/**
 * Bill Split Controller
 * Handles bill splitting HTTP requests
 * Follows Single Responsibility Principle
 */

class BillSplitController {
    constructor(billSplitService) {
        this.billSplitService = billSplitService;
    }

    /**
     * Create equal bill split
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createEqualSplit(req, res) {
        try {
            const payerUserId = req.session?.userId;
            const { originalTxId, debtorUserIds } = req.body;

            if (!payerUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!originalTxId || !Array.isArray(debtorUserIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'Orijinal işlem ID\'si ve borçlu kullanıcı listesi gereklidir'
                });
            }

            const result = await this.billSplitService.createEqualSplit(
                payerUserId,
                originalTxId,
                debtorUserIds
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Equal split controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Create weighted bill split
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createWeightedSplit(req, res) {
        try {
            const payerUserId = req.session?.userId;
            const { originalTxId, debtorWeights } = req.body;

            if (!payerUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!originalTxId || !Array.isArray(debtorWeights)) {
                return res.status(400).json({
                    success: false,
                    message: 'Orijinal işlem ID\'si ve ağırlıklı kullanıcı listesi gereklidir'
                });
            }

            // Validate debtorWeights format
            const validFormat = debtorWeights.every(item =>
                item.userId && typeof item.weight === 'number' && item.weight > 0
            );

            if (!validFormat) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz ağırlık formatı. Her kullanıcı için userId ve pozitif weight değeri gereklidir'
                });
            }

            const result = await this.billSplitService.createWeightedSplit(
                payerUserId,
                originalTxId,
                debtorWeights
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Weighted split controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Settle a bill split (pay back)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async settleSplit(req, res) {
        try {
            const payingUserId = req.session?.userId;
            const { splitId } = req.params;

            if (!payingUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!splitId) {
                return res.status(400).json({
                    success: false,
                    message: 'Fatura bölünme ID\'si gereklidir'
                });
            }

            const result = await this.billSplitService.settleBillSplit(
                parseInt(splitId),
                payingUserId
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Settle split controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Cancel a bill split
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async cancelSplit(req, res) {
        try {
            const userId = req.session?.userId;
            const { splitId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!splitId) {
                return res.status(400).json({
                    success: false,
                    message: 'Fatura bölünme ID\'si gereklidir'
                });
            }

            const result = await this.billSplitService.cancelBillSplit(
                parseInt(splitId),
                userId
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Cancel split controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get user's bill split summary
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSplitSummary(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.billSplitService.getUserSplitSummary(userId);

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get split summary controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get user's bill splits with filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserSplits(req, res) {
        try {
            const userId = req.session?.userId;
            const { status, role } = req.query;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const filters = {};
            if (status) filters.status = status;
            if (role) filters.role = role;

            const result = await this.billSplitService.getUserSplits(userId, filters);

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get user splits controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get detailed bill split information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSplitDetails(req, res) {
        try {
            const userId = req.session?.userId;
            const { splitId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            if (!splitId) {
                return res.status(400).json({
                    success: false,
                    message: 'Fatura bölünme ID\'si gereklidir'
                });
            }

            const result = await this.billSplitService.getSplitDetails(parseInt(splitId));

            if (result.success) {
                // Check if user is authorized to view this split
                const split = result.data;
                if (split.payer_user_id !== userId && split.debtor_user_id !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bu fatura bölünmesini görme yetkiniz yok'
                    });
                }
            }

            const statusCode = result.success ? 200 : 404;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get split details controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

module.exports = BillSplitController;
