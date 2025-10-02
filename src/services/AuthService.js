/**
 * Authentication Service
 * Handles user authentication logic
 * Follows Single Responsibility Principle
 */

class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Authenticate user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Authentication result
     */
    async authenticateById(userId) {
        try {
            if (!userId || typeof userId !== 'string') {
                return {
                    success: false,
                    message: 'Geçerli bir kullanıcı ID\'si gereklidir'
                };
            }

            const user = await this.userRepository.findById(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'Kullanıcı bulunamadı'
                };
            }

            return {
                success: true,
                user: user.toObject(),
                message: 'Giriş başarılı'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: 'Giriş sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Get user profile information
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User profile or null
     */
    async getUserProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            return user ? user.toObject() : null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    /**
     * Validate user session
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if valid session
     */
    async validateSession(userId) {
        try {
            return await this.userRepository.exists(userId);
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    /**
     * Search users for transfer/split operations
     * @param {string} currentUserId - Current user ID
     * @param {string} searchTerm - Search term (name or ID)
     * @returns {Promise<Array<Object>>} Array of matching users
     */
    async searchUsers(currentUserId, searchTerm) {
        try {
            if (!searchTerm) {
                return [];
            }

            // Search by ID first
            if (searchTerm.startsWith('U')) {
                const user = await this.userRepository.findById(searchTerm);
                if (user && user.userId !== currentUserId) {
                    return [user.toObject()];
                }
            }

            // Search by name
            const users = await this.userRepository.searchByName(searchTerm);
            return users
                .filter(user => user.userId !== currentUserId)
                .map(user => user.toObject());

        } catch (error) {
            console.error('Search users error:', error);
            return [];
        }
    }
}

module.exports = AuthService;
