/**
 * Authentication Middleware
 * Handles session validation
 * Follows Single Responsibility Principle
 */

/**
 * Simple session middleware for demonstration
 * In production, use proper session management or JWT
 */
class SessionManager {
    constructor() {
        this.sessions = new Map(); // In-memory storage for demo
    }

    createSession(userId) {
        const sessionId = require('uuid').v4();
        this.sessions.set(sessionId, {
            userId,
            createdAt: new Date(),
            lastAccess: new Date()
        });
        return sessionId;
    }

    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccess = new Date();
            return session;
        }
        return null;
    }

    destroySession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    cleanExpiredSessions() {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastAccess > maxAge) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

const sessionManager = new SessionManager();

// Clean expired sessions every hour
setInterval(() => {
    sessionManager.cleanExpiredSessions();
}, 60 * 60 * 1000);

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authMiddleware = (req, res, next) => {
    // For demonstration, we'll use a simple header-based auth
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Oturum açmanız gerekiyor'
        });
    }

    // Extract user ID from Authorization header
    // Format: "Bearer USER_ID"
    const userId = authHeader.replace('Bearer ', '');

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz oturum'
        });
    }

    // Set session for request
    req.session = { userId };
    next();
};

/**
 * Optional authentication middleware
 * Doesn't block request if no auth provided
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const userId = authHeader.replace('Bearer ', '');
        if (userId) {
            req.session = { userId };
        }
    }

    next();
};

module.exports = {
    authMiddleware,
    optionalAuth,
    sessionManager
};
