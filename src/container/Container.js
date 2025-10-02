/**
 * Dependency Injection Container
 * Manages application dependencies
 * Follows Dependency Inversion Principle
 */

const Database = require('../database/Database');
const UserRepository = require('../repositories/UserRepository');
const WalletRepository = require('../repositories/WalletRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const BillSplitRepository = require('../repositories/BillSplitRepository');
const AuthService = require('../services/AuthService');
const PaymentService = require('../services/PaymentService');
const BillSplitService = require('../services/BillSplitService');
const BudgetService = require('../services/BudgetService');
const AuthController = require('../controllers/AuthController');
const PaymentController = require('../controllers/PaymentController');
const BillSplitController = require('../controllers/BillSplitController');
const BudgetController = require('../controllers/BudgetController');

class Container {
    constructor() {
        this.services = new Map();
        this.initialized = false;
    }

    /**
     * Initialize all dependencies
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // Database
            const database = new Database();
            await database.connect();
            this.services.set('database', database);

            // Repositories
            const userRepository = new UserRepository(database);
            const walletRepository = new WalletRepository(database);
            const transactionRepository = new TransactionRepository(database);
            const billSplitRepository = new BillSplitRepository(database);

            this.services.set('userRepository', userRepository);
            this.services.set('walletRepository', walletRepository);
            this.services.set('transactionRepository', transactionRepository);
            this.services.set('billSplitRepository', billSplitRepository);

            // Services
            const authService = new AuthService(userRepository);
            const paymentService = new PaymentService(walletRepository, transactionRepository);
            const billSplitService = new BillSplitService(
                billSplitRepository,
                transactionRepository,
                walletRepository,
                userRepository
            );
            const budgetService = new BudgetService(database, walletRepository);

            this.services.set('authService', authService);
            this.services.set('paymentService', paymentService);
            this.services.set('billSplitService', billSplitService);
            this.services.set('budgetService', budgetService);

            // Controllers
            const authController = new AuthController(authService);
            const paymentController = new PaymentController(paymentService);
            const billSplitController = new BillSplitController(billSplitService);
            const budgetController = new BudgetController(budgetService);

            this.services.set('authController', authController);
            this.services.set('paymentController', paymentController);
            this.services.set('billSplitController', billSplitController);
            this.services.set('budgetController', budgetController);

            this.initialized = true;
            console.log('Container initialized successfully');

        } catch (error) {
            console.error('Container initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get a service from the container
     * @param {string} serviceName - Service name
     * @returns {Object} Service instance
     */
    get(serviceName) {
        if (!this.initialized) {
            throw new Error('Container not initialized. Call init() first.');
        }

        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found in container`);
        }

        return service;
    }

    /**
     * Check if service exists
     * @param {string} serviceName - Service name
     * @returns {boolean} True if service exists
     */
    has(serviceName) {
        return this.services.has(serviceName);
    }

    /**
     * Close all resources
     */
    async close() {
        try {
            const database = this.services.get('database');
            if (database) {
                await database.close();
            }

            this.services.clear();
            this.initialized = false;
            console.log('Container closed successfully');

        } catch (error) {
            console.error('Container close error:', error);
        }
    }
}

module.exports = Container;
