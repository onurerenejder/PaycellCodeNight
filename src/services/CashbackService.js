/**
 * Cashback Service
 * Handles cashback calculations and rules
 * Follows Single Responsibility Principle
 */

const Transaction = require('../domain/Transaction');
const { v4: uuidv4 } = require('uuid');

class CashbackService {
    constructor(database, walletRepository, transactionRepository) {
        this.db = database;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Calculate and apply cashback for a payment
     * @param {string} userId - User ID
     * @param {string} merchantId - Merchant ID
     * @param {number} amount - Payment amount
     * @param {string} paymentTxId - Payment transaction ID
     * @returns {Promise<Object>} Cashback result
     */
    async calculateAndApplyCashback(userId, merchantId, amount, paymentTxId) {
        try {
            // Get merchant category
            const merchant = await this.db.get(
                'SELECT * FROM merchants WHERE merchant_id = ?',
                [merchantId]
            );

            if (!merchant) {
                return { cashbackAmount: 0, applied: false };
            }

            // Get applicable cashback rules
            const rules = await this.getApplicableCashbackRules(
                userId,
                merchant.category,
                paymentTxId
            );

            if (rules.length === 0) {
                return { cashbackAmount: 0, applied: false, message: 'Geçerli cashback kampanyası yok' };
            }

            let totalCashback = 0;
            const appliedRules = [];

            for (const rule of rules) {
                const cashbackAmount = await this.calculateCashbackAmount(
                    userId,
                    rule,
                    amount,
                    merchant.category
                );

                if (cashbackAmount > 0) {
                    // Create cashback transaction
                    const cashbackTxId = `TX_CB_${uuidv4().substring(0, 8)}`;
                    const cashbackTx = new Transaction(
                        cashbackTxId,
                        userId,
                        cashbackAmount,
                        'TRY',
                        'cashback',
                        'ok',
                        merchantId,
                        {
                            rule_id: rule.rule_id,
                            original_tx_id: paymentTxId,
                            description: this.getCashbackDescription(rule, merchant)
                        }
                    );

                    // Save transaction and update wallet
                    await this.transactionRepository.create(cashbackTx);
                    await this.db.run(
                        'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?',
                        [cashbackAmount, new Date().toISOString(), userId]
                    );

                    totalCashback += cashbackAmount;
                    appliedRules.push({
                        ruleId: rule.rule_id,
                        amount: cashbackAmount,
                        description: this.getCashbackDescription(rule, merchant)
                    });
                }
            }

            return {
                cashbackAmount: totalCashback,
                applied: totalCashback > 0,
                appliedRules,
                message: totalCashback > 0
                    ? `${totalCashback.toFixed(2)} TL cashback kazandınız!`
                    : 'Cashback uygulanamadı'
            };

        } catch (error) {
            console.error('Calculate cashback error:', error);
            return { cashbackAmount: 0, applied: false, message: 'Cashback hesaplanamadı' };
        }
    }

    /**
     * Get applicable cashback rules
     * @param {string} userId - User ID
     * @param {string} category - Merchant category
     * @param {string} paymentTxId - Payment transaction ID
     * @returns {Promise<Array>} Applicable rules
     */
    async getApplicableCashbackRules(userId, category, paymentTxId) {
        try {
            const now = new Date().toISOString().substring(0, 10); // YYYY-MM-DD

            const sql = `
                SELECT * FROM cashback_rules
                WHERE active = 1
                AND (category = ? OR category = 'any')
                AND (starts_at IS NULL OR starts_at <= ?)
                AND (ends_at IS NULL OR ends_at >= ?)
            `;

            let rules = await this.db.query(sql, [category, now, now]);

            // Filter first-time-only rules
            const filteredRules = [];
            for (const rule of rules) {
                if (rule.first_time_only) {
                    // Check if user has received this cashback before
                    const hasPrevious = await this.db.get(
                        `SELECT COUNT(*) as count FROM transactions 
                         WHERE user_id = ? 
                         AND type = 'cashback' 
                         AND json_extract(meta, '$.rule_id') = ?`,
                        [userId, rule.rule_id]
                    );

                    if (hasPrevious.count === 0) {
                        filteredRules.push(rule);
                    }
                } else {
                    filteredRules.push(rule);
                }
            }

            return filteredRules;

        } catch (error) {
            console.error('Get applicable cashback rules error:', error);
            return [];
        }
    }

    /**
     * Calculate cashback amount based on rule
     * @param {string} userId - User ID
     * @param {Object} rule - Cashback rule
     * @param {number} amount - Payment amount
     * @param {string} category - Merchant category
     * @returns {Promise<number>} Cashback amount
     */
    async calculateCashbackAmount(userId, rule, amount, category) {
        try {
            let cashbackAmount = 0;

            if (rule.rule_type === 'percent') {
                // Percentage-based cashback
                cashbackAmount = amount * rule.rate;

                // Apply cap if set
                if (rule.cap && cashbackAmount > rule.cap) {
                    cashbackAmount = rule.cap;
                }
            } else if (rule.rule_type === 'flat') {
                // Flat amount cashback
                cashbackAmount = rule.flat_amount;
            }

            return Math.round(cashbackAmount * 100) / 100; // Round to 2 decimals

        } catch (error) {
            console.error('Calculate cashback amount error:', error);
            return 0;
        }
    }

    /**
     * Get cashback description
     * @param {Object} rule - Cashback rule
     * @param {Object} merchant - Merchant info
     * @returns {string} Description
     */
    getCashbackDescription(rule, merchant) {
        if (rule.rule_type === 'percent') {
            const percentage = (rule.rate * 100).toFixed(0);
            return `${merchant.name} - %${percentage} Cashback`;
        } else if (rule.rule_type === 'flat') {
            if (rule.first_time_only) {
                return `İlk QR Ödeme Bonusu - ${rule.flat_amount} TL`;
            }
            return `${merchant.name} - ${rule.flat_amount} TL Cashback`;
        }
        return 'Cashback';
    }

    /**
     * Get active cashback campaigns
     * @returns {Promise<Object>} Active campaigns
     */
    async getActiveCampaigns() {
        try {
            const now = new Date().toISOString().substring(0, 10);

            const sql = `
                SELECT * FROM cashback_rules
                WHERE active = 1
                AND (starts_at IS NULL OR starts_at <= ?)
                AND (ends_at IS NULL OR ends_at >= ?)
                ORDER BY rule_type, category
            `;

            const rules = await this.db.query(sql, [now, now]);

            return {
                success: true,
                data: {
                    campaigns: rules.map(r => ({
                        ruleId: r.rule_id,
                        type: r.rule_type,
                        category: r.category,
                        rate: r.rate,
                        flatAmount: r.flat_amount,
                        cap: r.cap,
                        firstTimeOnly: r.first_time_only,
                        startsAt: r.starts_at,
                        endsAt: r.ends_at,
                        description: this.getCampaignDescription(r)
                    }))
                }
            };

        } catch (error) {
            console.error('Get active campaigns error:', error);
            return {
                success: false,
                message: 'Kampanyalar alınamadı'
            };
        }
    }

    /**
     * Get campaign description
     * @param {Object} rule - Cashback rule
     * @returns {string} Campaign description
     */
    getCampaignDescription(rule) {
        if (rule.rule_type === 'percent') {
            const percentage = (rule.rate * 100).toFixed(0);
            const categoryText = rule.category === 'any' ? 'tüm kategorilerde' : `${rule.category} kategorisinde`;
            const capText = rule.cap ? ` (max ${rule.cap} TL)` : '';
            return `${categoryText} %${percentage} iade${capText}`;
        } else if (rule.rule_type === 'flat') {
            if (rule.first_time_only) {
                return `İlk QR ödemenize ${rule.flat_amount} TL bonus`;
            }
            return `${rule.flat_amount} TL sabit iade`;
        }
        return 'Kampanya';
    }
}

module.exports = CashbackService;

