/**
 * Wallet Domain Model
 * Represents a user's wallet with business logic
 * Follows Single Responsibility Principle
 */

class Wallet {
    constructor(userId, balance = 0.0, currency = 'TRY', updatedAt = new Date()) {
        this.userId = userId;
        this.balance = balance;
        this.currency = currency;
        this.updatedAt = updatedAt;

        this.validate();
    }

    /**
     * Validate wallet data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.userId || typeof this.userId !== 'string') {
            throw new Error('User ID is required and must be a string');
        }

        if (typeof this.balance !== 'number' || this.balance < 0) {
            throw new Error('Balance must be a non-negative number');
        }

        if (!this.currency || typeof this.currency !== 'string') {
            throw new Error('Currency is required and must be a string');
        }
    }

    /**
     * Add funds to wallet
     * @param {number} amount - Amount to add
     * @throws {Error} If amount is invalid
     */
    credit(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Credit amount must be a positive number');
        }

        this.balance += amount;
        this.balance = Math.round(this.balance * 100) / 100; // Round to 2 decimal places
        this.updatedAt = new Date();
    }

    /**
     * Remove funds from wallet
     * @param {number} amount - Amount to remove
     * @throws {Error} If amount is invalid or insufficient funds
     */
    debit(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Debit amount must be a positive number');
        }

        if (amount > this.balance) {
            throw new Error('Insufficient funds');
        }

        this.balance -= amount;
        this.balance = Math.round(this.balance * 100) / 100; // Round to 2 decimal places
        this.updatedAt = new Date();
    }

    /**
     * Check if wallet has sufficient funds
     * @param {number} amount - Amount to check
     * @returns {boolean} True if sufficient funds
     */
    hasSufficientFunds(amount) {
        return this.balance >= amount;
    }

    /**
     * Get formatted balance
     * @returns {string} Formatted balance with currency
     */
    getFormattedBalance() {
        return `${this.balance.toFixed(2)} ${this.currency}`;
    }

    /**
     * Convert to plain object for database storage
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            user_id: this.userId,
            balance: this.balance,
            currency: this.currency,
            updated_at: this.updatedAt.toISOString()
        };
    }

    /**
     * Create Wallet from database row
     * @param {Object} row - Database row
     * @returns {Wallet} Wallet instance
     */
    static fromRow(row) {
        return new Wallet(
            row.user_id,
            parseFloat(row.balance),
            row.currency,
            new Date(row.updated_at)
        );
    }
}

module.exports = Wallet;
