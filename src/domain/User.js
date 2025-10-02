/**
 * User Domain Model
 * Represents a user entity with business logic
 * Follows Single Responsibility Principle
 */

class User {
    constructor(userId, name, phone, createdAt = new Date()) {
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.createdAt = createdAt;

        this.validate();
    }

    /**
     * Validate user data
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.userId || typeof this.userId !== 'string') {
            throw new Error('User ID is required and must be a string');
        }

        if (!this.name || typeof this.name !== 'string') {
            throw new Error('Name is required and must be a string');
        }

        if (!this.phone || !this.isValidPhone(this.phone)) {
            throw new Error('Valid phone number is required');
        }
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone number
     * @returns {boolean} True if valid
     */
    isValidPhone(phone) {
        // Turkish phone number format: +90XXXXXXXXXX
        const phoneRegex = /^\+90[0-9]{10}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Convert to plain object
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            user_id: this.userId,
            name: this.name,
            phone: this.phone,
            created_at: this.createdAt
        };
    }

    /**
     * Create User from database row
     * @param {Object} row - Database row
     * @returns {User} User instance
     */
    static fromRow(row) {
        return new User(
            row.user_id,
            row.name,
            row.phone,
            new Date(row.created_at)
        );
    }
}

module.exports = User;
