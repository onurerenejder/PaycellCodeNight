/**
 * Base Repository
 * Provides common database operations
 * Follows Interface Segregation Principle
 */

class BaseRepository {
    constructor(database) {
        this.db = database;
    }

    /**
     * Find a single record by ID
     * @param {string} table - Table name
     * @param {string} idColumn - ID column name
     * @param {string} id - Record ID
     * @returns {Promise<Object|null>} Record or null
     */
    async findById(table, idColumn, id) {
        const sql = `SELECT * FROM ${table} WHERE ${idColumn} = ?`;
        return await this.db.get(sql, [id]);
    }

    /**
     * Find all records in a table
     * @param {string} table - Table name
     * @param {string} orderBy - Order by clause
     * @returns {Promise<Array>} Array of records
     */
    async findAll(table, orderBy = '') {
        const sql = `SELECT * FROM ${table} ${orderBy}`;
        return await this.db.query(sql);
    }

    /**
     * Insert a new record
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Insert result
     */
    async insert(table, data) {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => data[col]);

        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        return await this.db.run(sql, values);
    }

    /**
     * Update a record
     * @param {string} table - Table name
     * @param {Object} data - Data to update
     * @param {string} whereClause - WHERE clause
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<Object>} Update result
     */
    async update(table, data, whereClause, whereParams = []) {
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const values = [...columns.map(col => data[col]), ...whereParams];

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        return await this.db.run(sql, values);
    }

    /**
     * Delete a record
     * @param {string} table - Table name
     * @param {string} whereClause - WHERE clause
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<Object>} Delete result
     */
    async delete(table, whereClause, whereParams = []) {
        const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
        return await this.db.run(sql, whereParams);
    }

    /**
     * Execute a custom query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async query(sql, params = []) {
        return await this.db.query(sql, params);
    }

    /**
     * Execute multiple operations in a transaction
     * @param {Array} operations - Array of database operations
     * @returns {Promise<Array>} Results array
     */
    async transaction(operations) {
        return await this.db.transaction(operations);
    }
}

module.exports = BaseRepository;
