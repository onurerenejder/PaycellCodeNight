/**
 * Transaction Repository
 * Handles transaction data access operations
 * Follows Dependency Inversion Principle
 */

const BaseRepository = require('./BaseRepository');
const Transaction = require('../domain/Transaction');

class TransactionRepository extends BaseRepository {
    constructor(database) {
        super(database);
    }

    /**
     * Find transaction by ID
     * @param {string} txId - Transaction ID
     * @returns {Promise<Transaction|null>} Transaction instance or null
     */
    async findById(txId) {
        const row = await super.findById('transactions', 'tx_id', txId);
        return row ? Transaction.fromRow(row) : null;
    }

    /**
     * Get all transactions
     * @returns {Promise<Array<Transaction>>} Array of Transaction instances
     */
    async findAll() {
        const rows = await super.findAll('transactions', 'ORDER BY created_at DESC');
        return rows.map(row => Transaction.fromRow(row));
    }

    /**
     * Get transactions by user ID
     * @param {string} userId - User ID
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array<Transaction>>} Array of transactions
     */
    async findByUserId(userId, limit = 50) {
        const sql = `
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const rows = await this.db.query(sql, [userId, limit]);
        return rows.map(row => Transaction.fromRow(row));
    }

    /**
     * Get transactions by type
     * @param {string} type - Transaction type
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array<Transaction>>} Array of transactions
     */
    async findByType(type, limit = 50) {
        const sql = `
            SELECT * FROM transactions 
            WHERE type = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const rows = await this.db.query(sql, [type, limit]);
        return rows.map(row => Transaction.fromRow(row));
    }

    /**
     * Create a new transaction
     * @param {Transaction} transaction - Transaction instance
     * @returns {Promise<Object>} Insert result
     */
    async create(transaction) {
        return await super.insert('transactions', transaction.toObject());
    }

    /**
     * Update transaction status
     * @param {string} txId - Transaction ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Update result
     */
    async updateStatus(txId, status) {
        return await super.update('transactions', { status }, 'tx_id = ?', [txId]);
    }

    /**
     * Get user's transaction history with pagination
     * @param {string} userId - User ID
     * @param {number} page - Page number (1-based)
     * @param {number} pageSize - Number of records per page
     * @returns {Promise<Object>} Paginated results
     */
    async getUserTransactionHistory(userId, page = 1, pageSize = 20) {
        const offset = (page - 1) * pageSize;

        // Get total count
        const countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
        const countResult = await this.db.get(countSql, [userId]);
        const total = countResult.total;

        // Get transactions
        const sql = `
            SELECT t.*, m.name as merchant_name, m.category as merchant_category
            FROM transactions t
            LEFT JOIN merchants m ON t.merchant_id = m.merchant_id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const rows = await this.db.query(sql, [userId, pageSize, offset]);

        return {
            transactions: rows.map(row => Transaction.fromRow(row)),
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    /**
     * Get transaction summary for a user
     * @param {string} userId - User ID
     * @param {string} period - Period ('day', 'week', 'month', 'year')
     * @returns {Promise<Object>} Transaction summary
     */
    async getTransactionSummary(userId, period = 'month') {
        let dateFilter = '';
        switch (period) {
            case 'day':
                dateFilter = "AND created_at >= date('now', '-1 day')";
                break;
            case 'week':
                dateFilter = "AND created_at >= date('now', '-7 days')";
                break;
            case 'month':
                dateFilter = "AND created_at >= date('now', '-1 month')";
                break;
            case 'year':
                dateFilter = "AND created_at >= date('now', '-1 year')";
                break;
        }

        const sql = `
            SELECT 
                type,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
            GROUP BY type
        `;

        return await this.db.query(sql, [userId]);
    }

    /**
     * Get pending transfers for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array<Transaction>>} Array of pending transfers
     */
    async getPendingTransfers(userId) {
        const sql = `
            SELECT * FROM transactions 
            WHERE user_id = ? 
            AND type IN ('transfer_out', 'transfer_in') 
            AND status = 'pending'
            ORDER BY created_at DESC
        `;
        const rows = await this.db.query(sql, [userId]);
        return rows.map(row => Transaction.fromRow(row));
    }
}

module.exports = TransactionRepository;
