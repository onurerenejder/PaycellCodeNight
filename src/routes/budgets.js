/**
 * Budget Routes
 * Defines budget management API endpoints
 * Follows RESTful principles
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createBudgetRoutes(budgetController) {
    const router = express.Router();

    // Apply authentication middleware to all routes
    router.use(authMiddleware);

    // Get user budgets
    router.get('/', budgetController.getUserBudgets.bind(budgetController));

    // Get budget summary
    router.get('/summary', budgetController.getBudgetSummary.bind(budgetController));

    // Get all months with budgets
    router.get('/months', budgetController.getBudgetMonths.bind(budgetController));

    // Set or update budget
    router.post('/', budgetController.setBudget.bind(budgetController));

    // Delete budget
    router.delete('/:month/:category', budgetController.deleteBudget.bind(budgetController));

    return router;
}

module.exports = createBudgetRoutes;

