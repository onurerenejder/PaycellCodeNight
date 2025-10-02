/**
 * Budget Service
 * Handles budget management operations
 * Follows Single Responsibility Principle
 */

class BudgetService {
    constructor(database, walletRepository) {
        this.db = database;
        this.walletRepository = walletRepository;
    }

    /**
     * Get user's budgets for a specific month
     * @param {string} userId - User ID
     * @param {string} month - Month in YYYY-MM format
     * @returns {Promise<Object>} Budget information
     */
    async getUserBudgets(userId, month) {
        try {
            const sql = `
                SELECT * FROM budgets 
                WHERE user_id = ? AND month = ?
                ORDER BY category
            `;
            const budgets = await this.db.query(sql, [userId, month]);

            // Calculate real spent amounts from transactions
            const budgetsWithRealData = await Promise.all(budgets.map(async (b) => {
                const realSpent = await this.calculateCategorySpending(userId, month, b.category);

                return {
                    category: b.category,
                    limitAmount: b.limit_amount,
                    spentAmount: realSpent,
                    remaining: b.limit_amount - realSpent,
                    percentage: (realSpent / b.limit_amount * 100).toFixed(1),
                    status: this.getBudgetStatus(realSpent, b.limit_amount)
                };
            }));

            return {
                success: true,
                data: {
                    month,
                    budgets: budgetsWithRealData
                }
            };

        } catch (error) {
            console.error('Get user budgets error:', error);
            return {
                success: false,
                message: 'Bütçeler alınamadı'
            };
        }
    }

    /**
     * Calculate spending for a category in a given month
     * @param {string} userId - User ID
     * @param {string} month - Month in YYYY-MM format
     * @param {string} category - Category name
     * @returns {Promise<number>} Total spent amount
     */
    async calculateCategorySpending(userId, month, category) {
        try {
            // Get merchant IDs for this category
            const merchantsSql = `
                SELECT merchant_id FROM merchants 
                WHERE LOWER(category) = LOWER(?)
            `;
            const merchants = await this.db.query(merchantsSql, [category]);

            if (merchants.length === 0) {
                return 0;
            }

            const merchantIds = merchants.map(m => m.merchant_id);
            const placeholders = merchantIds.map(() => '?').join(',');

            // Calculate total spending for these merchants in this month
            const spendingSql = `
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = ?
                AND type = 'payment'
                AND status = 'ok'
                AND merchant_id IN (${placeholders})
                AND strftime('%Y-%m', created_at) = ?
            `;

            const result = await this.db.get(spendingSql, [userId, ...merchantIds, month]);
            return result.total || 0;

        } catch (error) {
            console.error('Calculate category spending error:', error);
            return 0;
        }
    }

    /**
     * Create or update a budget
     * @param {string} userId - User ID
     * @param {string} month - Month in YYYY-MM format
     * @param {string} category - Budget category
     * @param {number} limitAmount - Budget limit
     * @returns {Promise<Object>} Operation result
     */
    async setBudget(userId, month, category, limitAmount) {
        try {
            if (!userId || !month || !category) {
                return {
                    success: false,
                    message: 'Tüm alanlar gereklidir'
                };
            }

            if (typeof limitAmount !== 'number' || limitAmount <= 0) {
                return {
                    success: false,
                    message: 'Geçerli bir bütçe limiti giriniz'
                };
            }

            // Validate category
            const validCategories = ['cafe', 'market', 'ulaşım', 'eğlence', 'sağlık', 'diğer'];
            if (!validCategories.includes(category.toLowerCase())) {
                return {
                    success: false,
                    message: 'Geçersiz kategori'
                };
            }

            // Check if budget exists
            const existingBudget = await this.db.get(
                'SELECT * FROM budgets WHERE user_id = ? AND month = ? AND category = ?',
                [userId, month, category]
            );

            if (existingBudget) {
                // Update existing budget
                await this.db.run(
                    `UPDATE budgets 
                     SET limit_amount = ?, updated_at = ? 
                     WHERE user_id = ? AND month = ? AND category = ?`,
                    [limitAmount, new Date().toISOString(), userId, month, category]
                );

                return {
                    success: true,
                    message: 'Bütçe güncellendi'
                };
            } else {
                // Create new budget
                await this.db.run(
                    `INSERT INTO budgets (user_id, month, category, limit_amount, spent_amount, created_at, updated_at)
                     VALUES (?, ?, ?, ?, 0, ?, ?)`,
                    [userId, month, category, limitAmount, new Date().toISOString(), new Date().toISOString()]
                );

                return {
                    success: true,
                    message: 'Bütçe oluşturuldu'
                };
            }

        } catch (error) {
            console.error('Set budget error:', error);
            return {
                success: false,
                message: 'Bütçe kaydedilemedi'
            };
        }
    }

    /**
     * Delete a budget
     * @param {string} userId - User ID
     * @param {string} month - Month in YYYY-MM format
     * @param {string} category - Budget category
     * @returns {Promise<Object>} Operation result
     */
    async deleteBudget(userId, month, category) {
        try {
            await this.db.run(
                'DELETE FROM budgets WHERE user_id = ? AND month = ? AND category = ?',
                [userId, month, category]
            );

            return {
                success: true,
                message: 'Bütçe silindi'
            };

        } catch (error) {
            console.error('Delete budget error:', error);
            return {
                success: false,
                message: 'Bütçe silinemedi'
            };
        }
    }

    /**
     * Get budget status
     * @param {number} spent - Spent amount
     * @param {number} limit - Limit amount
     * @returns {string} Status (good, warning, danger)
     */
    getBudgetStatus(spent, limit) {
        const percentage = (spent / limit) * 100;

        // Default thresholds - can be customized in frontend
        if (percentage >= 95) return 'danger';
        if (percentage >= 80) return 'warning';
        return 'good';
    }

    /**
     * Get all months with budgets for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Months list
     */
    async getUserBudgetMonths(userId) {
        try {
            const sql = `
                SELECT DISTINCT month 
                FROM budgets 
                WHERE user_id = ?
                ORDER BY month DESC
            `;
            const months = await this.db.query(sql, [userId]);

            return {
                success: true,
                data: {
                    months: months.map(m => m.month)
                }
            };

        } catch (error) {
            console.error('Get budget months error:', error);
            return {
                success: false,
                message: 'Bütçe ayları alınamadı'
            };
        }
    }

    /**
     * Get budget summary for current month
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Budget summary
     */
    async getBudgetSummary(userId) {
        try {
            const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
            const result = await this.getUserBudgets(userId, currentMonth);

            if (result.success) {
                const budgets = result.data.budgets;

                // Get wallet balance as total budget (user's available money)
                const wallet = await this.walletRepository.findByUserId(userId);
                const totalBudget = wallet ? wallet.balance : 0;

                // Calculate total spent from real transactions
                const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

                // Remaining is wallet balance minus what we've spent
                const totalRemaining = totalBudget - totalSpent;

                // Get total spending for the month (all categories)
                const totalMonthSpendingSql = `
                    SELECT COALESCE(SUM(amount), 0) as total
                    FROM transactions
                    WHERE user_id = ?
                    AND type = 'payment'
                    AND status = 'ok'
                    AND strftime('%Y-%m', created_at) = ?
                `;
                const monthSpending = await this.db.get(totalMonthSpendingSql, [userId, currentMonth]);

                return {
                    success: true,
                    data: {
                        month: currentMonth,
                        totalBudget,           // From wallet balance
                        totalSpent,            // From real transactions
                        totalRemaining,        // wallet balance - spent
                        percentage: totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(1) : 0,
                        totalMonthSpending: monthSpending.total || 0,
                        budgets: budgets
                    }
                };
            }

            return result;

        } catch (error) {
            console.error('Get budget summary error:', error);
            return {
                success: false,
                message: 'Bütçe özeti alınamadı'
            };
        }
    }
}

module.exports = BudgetService;

