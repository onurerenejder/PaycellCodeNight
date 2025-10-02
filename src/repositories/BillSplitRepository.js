/**
 * Bill Split Repository
 * Handles bill split data access operations
 * Follows Dependency Inversion Principle
 */

const BaseRepository = require('./BaseRepository');
const BillSplit = require('../domain/BillSplit');

class BillSplitRepository extends BaseRepository {
    constructor(database) {
        super(database);
    }

    /**
     * Find bill split by ID
     * @param {number} splitId - Split ID
     * @returns {Promise<BillSplit|null>} BillSplit instance or null
     */
    async findById(splitId) {
        const row = await super.findById('bill_splits', 'split_id', splitId);
        return row ? BillSplit.fromRow(row) : null;
    }

    /**
     * Get bill splits by transaction ID
     * @param {string} txId - Transaction ID
     * @returns {Promise<Array<BillSplit>>} Array of bill splits
     */
    async findByTransactionId(txId) {
        const sql = 'SELECT * FROM bill_splits WHERE tx_id = ? ORDER BY created_at';
        const rows = await this.db.query(sql, [txId]);
        return rows.map(row => BillSplit.fromRow(row));
    }

    /**
     * Get bill splits where user is the payer
     * @param {string} payerUserId - Payer user ID
     * @param {string} status - Optional status filter
     * @returns {Promise<Array<BillSplit>>} Array of bill splits
     */
    async findByPayerId(payerUserId, status = null) {
        let sql = 'SELECT * FROM bill_splits WHERE payer_user_id = ?';
        const params = [payerUserId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const rows = await this.db.query(sql, params);
        return rows.map(row => BillSplit.fromRow(row));
    }

    /**
     * Get bill splits where user is the debtor
     * @param {string} debtorUserId - Debtor user ID
     * @param {string} status - Optional status filter
     * @returns {Promise<Array<BillSplit>>} Array of bill splits
     */
    async findByDebtorId(debtorUserId, status = null) {
        let sql = 'SELECT * FROM bill_splits WHERE debtor_user_id = ?';
        const params = [debtorUserId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const rows = await this.db.query(sql, params);
        return rows.map(row => BillSplit.fromRow(row));
    }

    /**
     * Get all bill splits for a user (as payer or debtor)
     * @param {string} userId - User ID
     * @param {string} status - Optional status filter
     * @returns {Promise<Array<Object>>} Array of bill splits with user details
     */
    async findByUserId(userId, status = null) {
        let sql = `
            SELECT bs.*, 
                   u_payer.name as payer_name,
                   u_debtor.name as debtor_name,
                   t.merchant_id,
                   m.name as merchant_name
            FROM bill_splits bs
            LEFT JOIN users u_payer ON bs.payer_user_id = u_payer.user_id
            LEFT JOIN users u_debtor ON bs.debtor_user_id = u_debtor.user_id
            LEFT JOIN transactions t ON bs.tx_id = t.tx_id
            LEFT JOIN merchants m ON t.merchant_id = m.merchant_id
            WHERE (bs.payer_user_id = ? OR bs.debtor_user_id = ?)
        `;
        const params = [userId, userId];

        if (status) {
            sql += ' AND bs.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY bs.created_at DESC';

        return await this.db.query(sql, params);
    }

    /**
     * Create a new bill split
     * @param {BillSplit} billSplit - BillSplit instance
     * @returns {Promise<Object>} Insert result
     */
    async create(billSplit) {
        const data = billSplit.toObject();
        delete data.split_id; // Auto-increment field
        return await super.insert('bill_splits', data);
    }

    /**
     * Create multiple bill splits in a transaction
     * @param {Array<BillSplit>} billSplits - Array of BillSplit instances
     * @returns {Promise<Array>} Array of insert results
     */
    async createMultiple(billSplits) {
        const operations = billSplits.map(split => {
            const data = split.toObject();
            delete data.split_id; // Auto-increment field

            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => data[col]);

            return {
                sql: `INSERT INTO bill_splits (${columns.join(', ')}) VALUES (${placeholders})`,
                params: values
            };
        });

        return await this.transaction(operations);
    }

    /**
     * Update bill split status
     * @param {number} splitId - Split ID
     * @param {string} status - New status
     * @param {Date} settledAt - Settlement date (for 'settled' status)
     * @returns {Promise<Object>} Update result
     */
    async updateStatus(splitId, status, settledAt = null) {
        const updateData = { status };
        if (settledAt) {
            updateData.settled_at = settledAt.toISOString();
        }

        return await super.update('bill_splits', updateData, 'split_id = ?', [splitId]);
    }

    /**
     * Settle a bill split (mark as paid)
     * @param {number} splitId - Split ID
     * @returns {Promise<Object>} Update result
     */
    async settle(splitId) {
        return await this.updateStatus(splitId, 'settled', new Date());
    }

    /**
     * Cancel a bill split
     * @param {number} splitId - Split ID
     * @returns {Promise<Object>} Update result
     */
    async cancel(splitId) {
        return await this.updateStatus(splitId, 'cancelled');
    }

    /**
     * Get pending bill splits summary for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Summary of pending splits
     */
    async getPendingSummary(userId) {
        const owedToMeSql = `
            SELECT COUNT(*) as count, COALESCE(SUM(share_amount), 0) as total_amount
            FROM bill_splits 
            WHERE payer_user_id = ? AND status = 'pending'
        `;

        const iOweSql = `
            SELECT COUNT(*) as count, COALESCE(SUM(share_amount), 0) as total_amount
            FROM bill_splits 
            WHERE debtor_user_id = ? AND status = 'pending'
        `;

        const [owedToMe, iOwe] = await Promise.all([
            this.db.get(owedToMeSql, [userId]),
            this.db.get(iOweSql, [userId])
        ]);

        return {
            owedToMe: {
                count: owedToMe.count,
                totalAmount: parseFloat(owedToMe.total_amount)
            },
            iOwe: {
                count: iOwe.count,
                totalAmount: parseFloat(iOwe.total_amount)
            }
        };
    }

    /**
     * Get bill split details with related transaction info
     * @param {number} splitId - Split ID
     * @returns {Promise<Object|null>} Detailed bill split info
     */
    async findDetailedById(splitId) {
        const sql = `
            SELECT bs.*,
                   u_payer.name as payer_name,
                   u_debtor.name as debtor_name,
                   t.amount as transaction_amount,
                   t.type as transaction_type,
                   m.name as merchant_name,
                   m.category as merchant_category
            FROM bill_splits bs
            LEFT JOIN users u_payer ON bs.payer_user_id = u_payer.user_id
            LEFT JOIN users u_debtor ON bs.debtor_user_id = u_debtor.user_id
            LEFT JOIN transactions t ON bs.tx_id = t.tx_id
            LEFT JOIN merchants m ON t.merchant_id = m.merchant_id
            WHERE bs.split_id = ?
        `;

        return await this.db.get(sql, [splitId]);
    }
}

module.exports = BillSplitRepository;
