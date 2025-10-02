/**
 * Wallet Repository
 * Handles wallet data access operations
 * Follows Dependency Inversion Principle
 */

const BaseRepository = require('./BaseRepository');
const Wallet = require('../domain/Wallet');

class WalletRepository extends BaseRepository {
    constructor(database) {
        super(database);
    }

    /**
     * Find wallet by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Wallet|null>} Wallet instance or null
     */
    async findByUserId(userId) {
        const row = await super.findById('wallets', 'user_id', userId);
        return row ? Wallet.fromRow(row) : null;
    }

    /**
     * Get all wallets
     * @returns {Promise<Array<Wallet>>} Array of Wallet instances
     */
    async findAll() {
        const rows = await super.findAll('wallets', 'ORDER BY balance DESC');
        return rows.map(row => Wallet.fromRow(row));
    }

    /**
     * Create a new wallet
     * @param {Wallet} wallet - Wallet instance
     * @returns {Promise<Object>} Insert result
     */
    async create(wallet) {
        return await super.insert('wallets', wallet.toObject());
    }

    /**
     * Update wallet balance
     * @param {string} userId - User ID
     * @param {number} newBalance - New balance
     * @returns {Promise<Object>} Update result
     */
    async updateBalance(userId, newBalance) {
        const updateData = {
            balance: newBalance,
            updated_at: new Date().toISOString()
        };
        return await super.update('wallets', updateData, 'user_id = ?', [userId]);
    }

    /**
     * Transfer funds between wallets
     * @param {string} fromUserId - Sender user ID
     * @param {string} toUserId - Receiver user ID
     * @param {number} amount - Transfer amount
     * @returns {Promise<boolean>} True if successful
     */
    async transfer(fromUserId, toUserId, amount) {
        try {
            // Get current balances
            const fromWallet = await this.findByUserId(fromUserId);
            const toWallet = await this.findByUserId(toUserId);

            if (!fromWallet || !toWallet) {
                throw new Error('One or both wallets not found');
            }

            // Check sufficient funds
            if (!fromWallet.hasSufficientFunds(amount)) {
                throw new Error('Insufficient funds');
            }

            // Calculate new balances
            const fromNewBalance = fromWallet.balance - amount;
            const toNewBalance = toWallet.balance + amount;

            // Execute transfer in transaction
            const operations = [
                {
                    sql: 'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
                    params: [fromNewBalance, new Date().toISOString(), fromUserId]
                },
                {
                    sql: 'UPDATE wallets SET balance = ?, updated_at = ? WHERE user_id = ?',
                    params: [toNewBalance, new Date().toISOString(), toUserId]
                }
            ];

            await this.transaction(operations);
            return true;

        } catch (error) {
            console.error('Transfer failed:', error);
            throw error;
        }
    }

    /**
     * Get wallet balance
     * @param {string} userId - User ID
     * @returns {Promise<number>} Current balance
     */
    async getBalance(userId) {
        const wallet = await this.findByUserId(userId);
        return wallet ? wallet.balance : 0;
    }

    /**
     * Check if user has sufficient funds
     * @param {string} userId - User ID
     * @param {number} amount - Amount to check
     * @returns {Promise<boolean>} True if sufficient funds
     */
    async hasSufficientFunds(userId, amount) {
        const wallet = await this.findByUserId(userId);
        return wallet ? wallet.hasSufficientFunds(amount) : false;
    }

    /**
     * Get wallets with low balance
     * @param {number} threshold - Balance threshold
     * @returns {Promise<Array<Wallet>>} Array of wallets below threshold
     */
    async findLowBalanceWallets(threshold = 10.0) {
        const sql = 'SELECT * FROM wallets WHERE balance < ? ORDER BY balance ASC';
        const rows = await this.db.query(sql, [threshold]);
        return rows.map(row => Wallet.fromRow(row));
    }
}

module.exports = WalletRepository;
