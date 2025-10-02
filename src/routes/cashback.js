/**
 * Cashback Routes
 * Defines cashback API endpoints
 * Follows RESTful principles
 */

const express = require('express');

function createCashbackRoutes(cashbackController) {
    const router = express.Router();

    // Get active cashback campaigns (no auth required - public)
    router.get('/campaigns', cashbackController.getActiveCampaigns.bind(cashbackController));

    return router;
}

module.exports = createCashbackRoutes;

