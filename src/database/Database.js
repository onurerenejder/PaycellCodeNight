/**
 * Database Connection Manager
 * Implements Singleton Pattern for database connection
 * Follows Single Responsibility Principle
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.db = null;
        Database.instance = this;
    }

    /**
     * Initialize database connection
     * @param {string} dbPath - Path to SQLite database file
     */
    async connect(dbPath = 'database/payment_system.db') {
        return new Promise((resolve, reject) => {
            const fullPath = path.resolve(dbPath);

            this.db = new sqlite3.Database(fullPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    // Enable foreign key constraints
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    /**
     * Execute a query that returns multiple rows
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Query error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Execute a query that returns a single row
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object|null>} Single row or null
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Get error:', err);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Execute an INSERT, UPDATE, or DELETE statement
     * @param {string} sql - SQL statement
     * @param {Array} params - Statement parameters
     * @returns {Promise<Object>} Result with lastID and changes
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Run error:', err);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Execute multiple statements in a transaction
     * @param {Array} statements - Array of {sql, params} objects
     * @returns {Promise<Array>} Results array
     */
    async transaction(statements) {
        return new Promise((resolve, reject) => {
            const db = this.db; // Capture reference before callbacks

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                const results = [];
                let completed = 0;
                let hasError = false;

                for (let i = 0; i < statements.length; i++) {
                    const { sql, params = [] } = statements[i];

                    db.run(sql, params, function (err) {
                        if (hasError) return; // Skip if already rolled back

                        if (err) {
                            hasError = true;
                            db.run('ROLLBACK', () => {
                                reject(err);
                            });
                            return;
                        }

                        results[i] = {
                            lastID: this.lastID,
                            changes: this.changes
                        };

                        completed++;

                        if (completed === statements.length) {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(results);
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    /**
     * Close database connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database instance
     * @returns {sqlite3.Database} Database instance
     */
    getConnection() {
        return this.db;
    }
}

module.exports = Database;
