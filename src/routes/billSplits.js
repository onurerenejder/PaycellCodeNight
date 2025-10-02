/**
 * Bill Split Routes
 * Defines bill splitting API endpoints
 * Follows RESTful principles
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createBillSplitRoutes(billSplitController) {
    const router = express.Router();

    // Apply authentication middleware to all routes
    router.use(authMiddleware);

    // Create equal bill split
    router.post('/equal', billSplitController.createEqualSplit.bind(billSplitController));

    // Create weighted bill split
    router.post('/weighted', billSplitController.createWeightedSplit.bind(billSplitController));

    // Get user's bill split summary
    router.get('/summary', billSplitController.getSplitSummary.bind(billSplitController));

    // Get user's bill splits with optional filtering
    router.get('/', billSplitController.getUserSplits.bind(billSplitController));

    // Get detailed bill split information
    router.get('/:splitId', billSplitController.getSplitDetails.bind(billSplitController));

    // Settle a bill split (pay back)
    router.post('/:splitId/settle', billSplitController.settleSplit.bind(billSplitController));

    // Cancel a bill split
    router.delete('/:splitId', billSplitController.cancelSplit.bind(billSplitController));

    return router;
}

module.exports = createBillSplitRoutes;
