/**
 * User Repository
 * Handles user data access operations
 * Follows Dependency Inversion Principle
 */

const BaseRepository = require('./BaseRepository');
const User = require('../domain/User');

class UserRepository extends BaseRepository {
    constructor(database) {
        super(database);
    }

    /**
     * Find user by ID
     * @param {string} userId - User ID
     * @returns {Promise<User|null>} User instance or null
     */
    async findById(userId) {
        const row = await super.findById('users', 'user_id', userId);
        return row ? User.fromRow(row) : null;
    }

    /**
     * Find user by phone number
     * @param {string} phone - Phone number
     * @returns {Promise<User|null>} User instance or null
     */
    async findByPhone(phone) {
        const sql = 'SELECT * FROM users WHERE phone = ?';
        const row = await this.db.get(sql, [phone]);
        return row ? User.fromRow(row) : null;
    }

    /**
     * Get all users
     * @returns {Promise<Array<User>>} Array of User instances
     */
    async findAll() {
        const rows = await super.findAll('users', 'ORDER BY created_at DESC');
        return rows.map(row => User.fromRow(row));
    }

    /**
     * Create a new user
     * @param {User} user - User instance
     * @returns {Promise<Object>} Insert result
     */
    async create(user) {
        return await super.insert('users', user.toObject());
    }

    /**
     * Update user information
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Update result
     */
    async update(userId, updateData) {
        return await super.update('users', updateData, 'user_id = ?', [userId]);
    }

    /**
     * Delete a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Delete result
     */
    async delete(userId) {
        return await super.delete('users', 'user_id = ?', [userId]);
    }

    /**
     * Check if user exists
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user exists
     */
    async exists(userId) {
        const user = await this.findById(userId);
        return user !== null;
    }

    /**
     * Search users by name
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array<User>>} Array of matching users
     */
    async searchByName(searchTerm) {
        const sql = 'SELECT * FROM users WHERE name LIKE ? ORDER BY name';
        const rows = await this.db.query(sql, [`%${searchTerm}%`]);
        return rows.map(row => User.fromRow(row));
    }

    /**
     * Get user contacts
     * @param {string} userId - User ID
     * @returns {Promise<Array<Object>>} Array of contact information
     */
    async getContacts(userId) {
        const sql = `
            SELECT u.*, pc.favorite 
            FROM users u 
            JOIN p2p_contacts pc ON u.user_id = pc.contact_user_id 
            WHERE pc.user_id = ? 
            ORDER BY pc.favorite DESC, u.name
        `;
        return await this.db.query(sql, [userId]);
    }

    /**
     * Add a contact
     * @param {string} userId - User ID
     * @param {string} contactUserId - Contact user ID
     * @param {boolean} favorite - Is favorite contact
     * @returns {Promise<Object>} Insert result
     */
    async addContact(userId, contactUserId, favorite = false) {
        const sql = 'INSERT OR REPLACE INTO p2p_contacts (user_id, contact_user_id, favorite) VALUES (?, ?, ?)';
        return await this.db.run(sql, [userId, contactUserId, favorite ? 1 : 0]);
    }

    /**
     * Remove a contact
     * @param {string} userId - User ID
     * @param {string} contactUserId - Contact user ID
     * @returns {Promise<Object>} Delete result
     */
    async removeContact(userId, contactUserId) {
        const sql = 'DELETE FROM p2p_contacts WHERE user_id = ? AND contact_user_id = ?';
        return await this.db.run(sql, [userId, contactUserId]);
    }
}

module.exports = UserRepository;
