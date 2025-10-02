/**
 * Budget Controller
 * Handles budget HTTP requests
 * Follows Single Responsibility Principle
 */

class BudgetController {
    constructor(budgetService) {
        this.budgetService = budgetService;
    }

    /**
     * Get user's budgets
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserBudgets(req, res) {
        try {
            const userId = req.session?.userId;
            const { month } = req.query;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            // Default to current month if not specified
            const targetMonth = month || new Date().toISOString().substring(0, 7);

            const result = await this.budgetService.getUserBudgets(userId, targetMonth);
            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get user budgets controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get all months with budgets
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getBudgetMonths(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.budgetService.getUserBudgetMonths(userId);
            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get budget months controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Set or update a budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async setBudget(req, res) {
        try {
            const userId = req.session?.userId;
            const { month, category, limitAmount } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.budgetService.setBudget(
                userId,
                month,
                category,
                parseFloat(limitAmount)
            );

            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Set budget controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Delete a budget
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteBudget(req, res) {
        try {
            const userId = req.session?.userId;
            const { month, category } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.budgetService.deleteBudget(userId, month, category);
            const statusCode = result.success ? 200 : 400;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Delete budget controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get budget summary
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getBudgetSummary(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const result = await this.budgetService.getBudgetSummary(userId);
            const statusCode = result.success ? 200 : 500;
            return res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get budget summary controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

module.exports = BudgetController;

