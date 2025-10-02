/**
 * Database Initialization Script
 * Sets up the database schema and initial data
 */

const fs = require('fs');
const path = require('path');
const Database = require('./Database');

async function initializeDatabase() {
    try {
        const db = new Database();
        await db.connect();

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split schema into individual statements
        const statements = schema.split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
            try {
                await db.run(statement + ';');
                console.log('Executed:', statement.substring(0, 50) + '...');
            } catch (error) {
                console.error('Error executing statement:', statement.substring(0, 50));
                console.error(error);
            }
        }

        console.log('Database initialized successfully');
        await db.close();

    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
