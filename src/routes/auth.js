/**
 * Authentication Routes
 * Defines authentication API endpoints
 * Follows RESTful principles
 */

const express = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

function createAuthRoutes(authController) {
    const router = express.Router();

    // Login with user ID (no auth required)
    router.post('/login', authController.login.bind(authController));

    // Get current user profile (requires auth)
    router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

    // Search users (requires auth)
    router.get('/users/search', authMiddleware, authController.searchUsers.bind(authController));

    // Logout (optional auth)
    router.post('/logout', optionalAuth, authController.logout.bind(authController));

    return router;
}

module.exports = createAuthRoutes;
