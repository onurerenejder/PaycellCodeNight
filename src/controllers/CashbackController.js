/**
 * Cashback Controller
 * Handles cashback HTTP requests
 * Follows Single Responsibility Principle
 */

class CashbackController {
    constructor(cashbackService) {
        this.cashbackService = cashbackService;
    }

    /**
     * Get active cashback campaigns
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getActiveCampaigns(req, res) {
        try {
            const result = await this.cashbackService.getActiveCampaigns();
            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get campaigns controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

module.exports = CashbackController;

