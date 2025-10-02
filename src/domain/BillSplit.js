/**
 * BillSplit Domain Model
 * Represents a bill split with business logic
 * Follows Single Responsibility Principle
 */

class BillSplit {
    constructor(splitId, txId, payerUserId, debtorUserId, totalAmount, shareAmount, weight = 1.0, status = 'pending', createdAt = new Date(), settledAt = null) {
        this.splitId = splitId;
        this.txId = txId;
        this.payerUserId = payerUserId;
        this.debtorUserId = debtorUserId;
        this.totalAmount = totalAmount;
        this.shareAmount = shareAmount;
        this.weight = weight;
        this.status = status;
        this.createdAt = createdAt;
        this.settledAt = settledAt;

        this.validate();
    }

    /**
     * Validate bill split data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.txId || typeof this.txId !== 'string') {
            throw new Error('Transaction ID is required and must be a string');
        }

        if (!this.payerUserId || typeof this.payerUserId !== 'string') {
            throw new Error('Payer User ID is required and must be a string');
        }

        if (!this.debtorUserId || typeof this.debtorUserId !== 'string') {
            throw new Error('Debtor User ID is required and must be a string');
        }

        if (this.payerUserId === this.debtorUserId) {
            throw new Error('Payer and debtor cannot be the same user');
        }

        if (!this.totalAmount || typeof this.totalAmount !== 'number' || this.totalAmount <= 0) {
            throw new Error('Total amount must be a positive number');
        }

        if (!this.shareAmount || typeof this.shareAmount !== 'number' || this.shareAmount <= 0) {
            throw new Error('Share amount must be a positive number');
        }

        if (this.shareAmount > this.totalAmount) {
            throw new Error('Share amount cannot exceed total amount');
        }

        if (!this.isValidStatus(this.status)) {
            throw new Error('Invalid bill split status');
        }

        if (typeof this.weight !== 'number' || this.weight <= 0) {
            throw new Error('Weight must be a positive number');
        }
    }

    /**
     * Check if status is valid
     * @param {string} status - Status to check
     * @returns {boolean} True if valid
     */
    isValidStatus(status) {
        const validStatuses = ['pending', 'settled', 'cancelled'];
        return validStatuses.includes(status);
    }

    /**
     * Mark bill split as settled
     */
    settle() {
        this.status = 'settled';
        this.settledAt = new Date();
    }

    /**
     * Cancel bill split
     */
    cancel() {
        this.status = 'cancelled';
    }

    /**
     * Check if bill split is settled
     * @returns {boolean} True if settled
     */
    isSettled() {
        return this.status === 'settled';
    }

    /**
     * Check if bill split is pending
     * @returns {boolean} True if pending
     */
    isPending() {
        return this.status === 'pending';
    }

    /**
     * Convert to plain object for database storage
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            split_id: this.splitId,
            tx_id: this.txId,
            payer_user_id: this.payerUserId,
            debtor_user_id: this.debtorUserId,
            total_amount: this.totalAmount,
            share_amount: this.shareAmount,
            weight: this.weight,
            status: this.status,
            created_at: this.createdAt.toISOString(),
            settled_at: this.settledAt ? this.settledAt.toISOString() : null
        };
    }

    /**
     * Create BillSplit from database row
     * @param {Object} row - Database row
     * @returns {BillSplit} BillSplit instance
     */
    static fromRow(row) {
        return new BillSplit(
            row.split_id,
            row.tx_id,
            row.payer_user_id,
            row.debtor_user_id,
            parseFloat(row.total_amount),
            parseFloat(row.share_amount),
            parseFloat(row.weight),
            row.status,
            new Date(row.created_at),
            row.settled_at ? new Date(row.settled_at) : null
        );
    }

    /**
     * Calculate equal split amounts for users
     * @param {number} totalAmount - Total amount to split
     * @param {Array<string>} userIds - Array of user IDs
     * @returns {Array<Object>} Array of split objects
     */
    static calculateEqualSplit(totalAmount, userIds) {
        if (!userIds || userIds.length === 0) {
            throw new Error('User IDs array cannot be empty');
        }

        const shareAmount = Math.round((totalAmount / userIds.length) * 100) / 100;

        return userIds.map(userId => ({
            userId,
            shareAmount,
            weight: 1.0
        }));
    }

    /**
     * Calculate weighted split amounts
     * @param {number} totalAmount - Total amount to split
     * @param {Array<Object>} userWeights - Array of {userId, weight} objects
     * @returns {Array<Object>} Array of split objects
     */
    static calculateWeightedSplit(totalAmount, userWeights) {
        if (!userWeights || userWeights.length === 0) {
            throw new Error('User weights array cannot be empty');
        }

        const totalWeight = userWeights.reduce((sum, item) => sum + item.weight, 0);

        if (totalWeight <= 0) {
            throw new Error('Total weight must be positive');
        }

        return userWeights.map(item => ({
            userId: item.userId,
            shareAmount: Math.round((totalAmount * item.weight / totalWeight) * 100) / 100,
            weight: item.weight
        }));
    }
}

module.exports = BillSplit;
