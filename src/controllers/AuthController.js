/**
 * Authentication Controller
 * Handles authentication HTTP requests
 * Follows Single Responsibility Principle
 */

class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    /**
     * User login with ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async login(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Kullanıcı ID\'si gereklidir'
                });
            }

            const result = await this.authService.authenticateById(userId);

            if (result.success) {
                // In a real app, you would set session/JWT here
                req.session = { userId: result.user.user_id };

                return res.status(200).json({
                    success: true,
                    message: result.message,
                    user: result.user
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: result.message
                });
            }

        } catch (error) {
            console.error('Login controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Get current user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getProfile(req, res) {
        try {
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const user = await this.authService.getUserProfile(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                });
            }

            return res.status(200).json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Get profile controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * Search users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async searchUsers(req, res) {
        try {
            const userId = req.session?.userId;
            const { query } = req.query;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
            }

            const users = await this.authService.searchUsers(userId, query);

            return res.status(200).json({
                success: true,
                users
            });

        } catch (error) {
            console.error('Search users controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    /**
     * User logout
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async logout(req, res) {
        try {
            req.session = null;

            return res.status(200).json({
                success: true,
                message: 'Başarıyla çıkış yapıldı'
            });

        } catch (error) {
            console.error('Logout controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

module.exports = AuthController;
