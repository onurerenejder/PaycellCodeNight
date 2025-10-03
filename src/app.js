/**
 * Main Application Entry Point
 * Sets up Express server with all dependencies
 * Follows Dependency Inversion Principle
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const Container = require('./container/Container');
const createAuthRoutes = require('./routes/auth');
const createPaymentRoutes = require('./routes/payments');
const createBillSplitRoutes = require('./routes/billSplits');
const createBudgetRoutes = require('./routes/budgets');
const createCashbackRoutes = require('./routes/cashback');

class App {
    constructor() {
        this.app = express();
        this.container = new Container();
        this.port = process.env.PORT || 3000;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize dependency container
            await this.container.init();

            // Setup middleware
            this.setupMiddleware();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Application initialization failed:', error);
            process.exit(1);
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    mediaSrc: ["'self'", "data:"],
                },
            },
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
            }
        });
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../public')));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                message: 'Server is running',
                timestamp: new Date().toISOString()
            });
        });

        // API routes
        this.app.use('/api/auth', createAuthRoutes(this.container.get('authController')));
        this.app.use('/api/payments', createPaymentRoutes(this.container.get('paymentController')));
        this.app.use('/api/splits', createBillSplitRoutes(this.container.get('billSplitController')));
        this.app.use('/api/budgets', createBudgetRoutes(this.container.get('budgetController')));
        this.app.use('/api/cashback', createCashbackRoutes(this.container.get('cashbackController')));

        // Serve frontend
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint bulunamadı'
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);

            // Don't leak error details in production
            const message = process.env.NODE_ENV === 'production'
                ? 'Sunucu hatası'
                : error.message;

            res.status(500).json({
                success: false,
                message,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            });
        });
    }

    /**
     * Start the server
     */
    async start() {
        await this.init();

        this.server = this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
            console.log(`Frontend: http://localhost:${this.port}`);
            console.log(`API: http://localhost:${this.port}/api`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('Shutting down gracefully...');

        if (this.server) {
            this.server.close();
        }

        await this.container.close();
        process.exit(0);
    }
}

// Start the application
const app = new App();
app.start().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
});

module.exports = App;
