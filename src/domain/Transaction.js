/**
 * Transaction Domain Model
 * Represents a financial transaction with business logic
 * Follows Single Responsibility Principle
 */

class Transaction {
    constructor(txId, userId, amount, currency = 'TRY', type, status = 'pending', merchantId = null, meta = {}, createdAt = new Date(), merchantName = null) {
        this.txId = txId;
        this.userId = userId;
        this.merchantId = merchantId;
        this.merchantName = merchantName;
        this.amount = amount;
        this.currency = currency;
        this.type = type;
        this.status = status;
        this.meta = meta;
        this.createdAt = createdAt;

        this.validate();
    }

    /**
     * Validate transaction data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.txId || typeof this.txId !== 'string') {
            throw new Error('Transaction ID is required and must be a string');
        }

        if (!this.userId || typeof this.userId !== 'string') {
            throw new Error('User ID is required and must be a string');
        }

        if (!this.amount || typeof this.amount !== 'number' || this.amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        if (!this.isValidType(this.type)) {
            throw new Error('Invalid transaction type');
        }

        if (!this.isValidStatus(this.status)) {
            throw new Error('Invalid transaction status');
        }
    }

    /**
     * Check if transaction type is valid
     * @param {string} type - Transaction type
     * @returns {boolean} True if valid
     */
    isValidType(type) {
        const validTypes = ['payment', 'cashback', 'topup', 'transfer_out', 'transfer_in', 'bill_split', 'split_settlement', 'refund'];
        return validTypes.includes(type);
    }

    /**
     * Check if transaction status is valid
     * @param {string} status - Transaction status
     * @returns {boolean} True if valid
     */
    isValidStatus(status) {
        const validStatuses = ['pending', 'ok', 'failed', 'cancelled'];
        return validStatuses.includes(status);
    }

    /**
     * Check if transaction is a transfer
     * @returns {boolean} True if transfer
     */
    isTransfer() {
        return this.type === 'transfer_out' || this.type === 'transfer_in';
    }

    /**
     * Check if transaction is a payment
     * @returns {boolean} True if payment
     */
    isPayment() {
        return this.type === 'payment';
    }

    /**
     * Check if transaction affects balance positively
     * @returns {boolean} True if increases balance
     */
    increasesBalance() {
        return ['cashback', 'topup', 'transfer_in'].includes(this.type);
    }

    /**
     * Check if transaction affects balance negatively
     * @returns {boolean} True if decreases balance
     */
    decreasesBalance() {
        return ['payment', 'transfer_out', 'bill_split'].includes(this.type);
    }

    /**
     * Convert to plain object for database storage
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            tx_id: this.txId,
            created_at: this.createdAt.toISOString(),
            user_id: this.userId,
            merchant_id: this.merchantId,
            amount: this.amount,
            currency: this.currency,
            type: this.type,
            status: this.status,
            meta: JSON.stringify(this.meta)
        };
    }

    /**
     * Create Transaction from database row
     * @param {Object} row - Database row
     * @returns {Transaction} Transaction instance
     */
    static fromRow(row) {
        let meta = {};
        try {
            meta = row.meta ? JSON.parse(row.meta) : {};
        } catch (e) {
            console.warn('Failed to parse transaction meta:', e);
        }

        return new Transaction(
            row.tx_id,
            row.user_id,
            parseFloat(row.amount),
            row.currency,
            row.type,
            row.status,
            row.merchant_id,
            meta,
            new Date(row.created_at),
            row.merchant_name || null
        );
    }
}

module.exports = Transaction;
