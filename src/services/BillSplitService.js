/**
 * Bill Split Service
 * Handles bill splitting logic
 * Follows Single Responsibility Principle and Open/Closed Principle
 */

const BillSplit = require('../domain/BillSplit');
const Transaction = require('../domain/Transaction');
const { v4: uuidv4 } = require('uuid');

class BillSplitService {
    constructor(billSplitRepository, transactionRepository, walletRepository, userRepository) {
        this.billSplitRepository = billSplitRepository;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create equal bill split
     * @param {string} payerUserId - User who paid the bill
     * @param {string} originalTxId - Original transaction ID
     * @param {Array<string>} debtorUserIds - Array of debtor user IDs
     * @returns {Promise<Object>} Split result
     */
    async createEqualSplit(payerUserId, originalTxId, debtorUserIds) {
        try {
            // Validate input
            if (!payerUserId || !originalTxId || !Array.isArray(debtorUserIds) || debtorUserIds.length === 0) {
                return {
                    success: false,
                    message: 'Geçersiz parametreler'
                };
            }

            // Remove payer from debtors if included
            const filteredDebtors = debtorUserIds.filter(id => id !== payerUserId);

            if (filteredDebtors.length === 0) {
                return {
                    success: false,
                    message: 'En az bir borçlu kullanıcı belirtmelisiniz'
                };
            }

            // Get original transaction
            const originalTx = await this.transactionRepository.findById(originalTxId);
            if (!originalTx) {
                return {
                    success: false,
                    message: 'Orijinal işlem bulunamadı'
                };
            }

            if (originalTx.userId !== payerUserId) {
                return {
                    success: false,
                    message: 'Bu işlem size ait değil'
                };
            }

            // Validate all debtor users exist
            const userValidations = await Promise.all(
                filteredDebtors.map(userId => this.userRepository.exists(userId))
            );

            if (userValidations.some(exists => !exists)) {
                return {
                    success: false,
                    message: 'Bir veya daha fazla kullanıcı bulunamadı'
                };
            }

            // Calculate equal splits
            const totalUsers = filteredDebtors.length + 1; // Include payer
            const shareAmount = Math.round((originalTx.amount / totalUsers) * 100) / 100;

            // Create bill splits for debtors
            const billSplits = filteredDebtors.map(debtorUserId =>
                new BillSplit(
                    null, // Auto-increment
                    originalTxId,
                    payerUserId,
                    debtorUserId,
                    originalTx.amount,
                    shareAmount,
                    1.0, // Equal weight
                    'pending'
                )
            );

            // Save bill splits
            await this.billSplitRepository.createMultiple(billSplits);

            return {
                success: true,
                message: 'Fatura başarıyla bölündü',
                data: {
                    originalTxId,
                    totalAmount: originalTx.amount,
                    shareAmount,
                    totalUsers,
                    debtorCount: filteredDebtors.length,
                    splits: billSplits.map(split => ({
                        debtorUserId: split.debtorUserId,
                        shareAmount: split.shareAmount,
                        weight: split.weight
                    }))
                }
            };

        } catch (error) {
            console.error('Equal split error:', error);
            return {
                success: false,
                message: 'Fatura bölme sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Create weighted bill split
     * @param {string} payerUserId - User who paid the bill
     * @param {string} originalTxId - Original transaction ID
     * @param {Array<Object>} debtorWeights - Array of {userId, weight} objects
     * @returns {Promise<Object>} Split result
     */
    async createWeightedSplit(payerUserId, originalTxId, debtorWeights) {
        try {
            // Validate input
            if (!payerUserId || !originalTxId || !Array.isArray(debtorWeights) || debtorWeights.length === 0) {
                return {
                    success: false,
                    message: 'Geçersiz parametreler'
                };
            }

            // Remove payer from debtors if included
            const filteredDebtors = debtorWeights.filter(item => item.userId !== payerUserId);

            if (filteredDebtors.length === 0) {
                return {
                    success: false,
                    message: 'En az bir borçlu kullanıcı belirtmelisiniz'
                };
            }

            // Validate weights
            const invalidWeights = filteredDebtors.some(item =>
                typeof item.weight !== 'number' || item.weight <= 0
            );

            if (invalidWeights) {
                return {
                    success: false,
                    message: 'Tüm ağırlıklar pozitif sayı olmalıdır'
                };
            }

            // Get original transaction
            const originalTx = await this.transactionRepository.findById(originalTxId);
            if (!originalTx) {
                return {
                    success: false,
                    message: 'Orijinal işlem bulunamadı'
                };
            }

            if (originalTx.userId !== payerUserId) {
                return {
                    success: false,
                    message: 'Bu işlem size ait değil'
                };
            }

            // Validate all debtor users exist
            const userValidations = await Promise.all(
                filteredDebtors.map(item => this.userRepository.exists(item.userId))
            );

            if (userValidations.some(exists => !exists)) {
                return {
                    success: false,
                    message: 'Bir veya daha fazla kullanıcı bulunamadı'
                };
            }

            // Calculate weighted splits
            const totalWeight = filteredDebtors.reduce((sum, item) => sum + item.weight, 0);

            const billSplits = filteredDebtors.map(item => {
                const shareAmount = Math.round((originalTx.amount * item.weight / totalWeight) * 100) / 100;

                return new BillSplit(
                    null, // Auto-increment
                    originalTxId,
                    payerUserId,
                    item.userId,
                    originalTx.amount,
                    shareAmount,
                    item.weight,
                    'pending'
                );
            });

            // Save bill splits
            await this.billSplitRepository.createMultiple(billSplits);

            return {
                success: true,
                message: 'Fatura başarıyla ağırlıklı olarak bölündü',
                data: {
                    originalTxId,
                    totalAmount: originalTx.amount,
                    totalWeight,
                    debtorCount: filteredDebtors.length,
                    splits: billSplits.map(split => ({
                        debtorUserId: split.debtorUserId,
                        shareAmount: split.shareAmount,
                        weight: split.weight
                    }))
                }
            };

        } catch (error) {
            console.error('Weighted split error:', error);
            return {
                success: false,
                message: 'Ağırlıklı fatura bölme sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Settle a bill split (pay back)
     * @param {number} splitId - Split ID
     * @param {string} payingUserId - User who is paying
     * @returns {Promise<Object>} Settlement result
     */
    async settleBillSplit(splitId, payingUserId) {
        try {
            // Get bill split details
            const split = await this.billSplitRepository.findById(splitId);
            if (!split) {
                return {
                    success: false,
                    message: 'Fatura bölünmesi bulunamadı'
                };
            }

            if (split.debtorUserId !== payingUserId) {
                return {
                    success: false,
                    message: 'Bu bölünmeyi sadece borçlu kullanıcı ödeyebilir'
                };
            }

            if (split.isSettled()) {
                return {
                    success: false,
                    message: 'Bu fatura bölünmesi zaten ödenmiş'
                };
            }

            // Check if debtor has sufficient funds
            const hasFunds = await this.walletRepository.hasSufficientFunds(
                payingUserId,
                split.shareAmount
            );

            if (!hasFunds) {
                return {
                    success: false,
                    message: 'Yetersiz bakiye'
                };
            }

            // Transfer money from debtor to payer
            const transferResult = await this.transferMoney(
                split.debtorUserId,
                split.payerUserId,
                split.shareAmount
            );

            if (!transferResult.success) {
                return transferResult;
            }

            // Mark split as settled
            await this.billSplitRepository.settle(splitId);

            return {
                success: true,
                message: 'Fatura bölünmesi başarıyla ödendi',
                data: {
                    splitId,
                    amount: split.shareAmount,
                    payerUserId: split.payerUserId,
                    debtorUserId: split.debtorUserId,
                    transferTransactionId: transferResult.data.outTransactionId
                }
            };

        } catch (error) {
            console.error('Settle bill split error:', error);
            return {
                success: false,
                message: 'Fatura ödeme sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Get user's bill split summary
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Bill split summary
     */
    async getUserSplitSummary(userId) {
        try {
            const [summary, asPayerSplits, asDebtorSplits] = await Promise.all([
                this.billSplitRepository.getPendingSummary(userId),
                this.billSplitRepository.findByPayerId(userId, 'pending'),
                this.billSplitRepository.findByDebtorId(userId, 'pending')
            ]);

            return {
                success: true,
                data: {
                    summary,
                    pendingAsPayerCount: asPayerSplits.length,
                    pendingAsDebtorCount: asDebtorSplits.length,
                    recentSplits: await this.billSplitRepository.findByUserId(userId)
                }
            };

        } catch (error) {
            console.error('Get split summary error:', error);
            return {
                success: false,
                message: 'Fatura özeti alınamadı'
            };
        }
    }

    /**
     * Cancel a bill split
     * @param {number} splitId - Split ID
     * @param {string} userId - User requesting cancellation
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelBillSplit(splitId, userId) {
        try {
            const split = await this.billSplitRepository.findById(splitId);
            if (!split) {
                return {
                    success: false,
                    message: 'Fatura bölünmesi bulunamadı'
                };
            }

            // Only payer can cancel
            if (split.payerUserId !== userId) {
                return {
                    success: false,
                    message: 'Bu bölünmeyi sadece ödeme yapan kullanıcı iptal edebilir'
                };
            }

            if (split.isSettled()) {
                return {
                    success: false,
                    message: 'Ödenmiş fatura bölünmesi iptal edilemez'
                };
            }

            await this.billSplitRepository.cancel(splitId);

            return {
                success: true,
                message: 'Fatura bölünmesi iptal edildi'
            };

        } catch (error) {
            console.error('Cancel split error:', error);
            return {
                success: false,
                message: 'Fatura iptal sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Transfer money between users (used internally)
     * @param {string} fromUserId - Sender user ID
     * @param {string} toUserId - Receiver user ID
     * @param {number} amount - Transfer amount
     * @returns {Promise<Object>} Transfer result
     */
    async transferMoney(fromUserId, toUserId, amount) {
        // This would typically call PaymentService, but to avoid circular dependency,
        // we implement the core logic here
        try {
            const outTxId = `TX_SPLIT_${uuidv4().substring(0, 8)}`;
            const inTxId = `TX_SPLIT_${uuidv4().substring(0, 8)}`;

            const outTransaction = new Transaction(
                outTxId,
                fromUserId,
                amount,
                'TRY',
                'bill_split',
                'ok',
                null,
                { to_user: toUserId, related_tx: inTxId, type: 'split_payment' }
            );

            const inTransaction = new Transaction(
                inTxId,
                toUserId,
                amount,
                'TRY',
                'transfer_in',
                'ok',
                null,
                { from_user: fromUserId, related_tx: outTxId, type: 'split_received' }
            );

            // Execute in transaction
            const operations = [
                {
                    sql: 'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), fromUserId]
                },
                {
                    sql: 'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), toUserId]
                },
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(outTransaction.toObject())
                },
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(inTransaction.toObject())
                }
            ];

            await this.walletRepository.transaction(operations);

            return {
                success: true,
                data: {
                    outTransactionId: outTxId,
                    inTransactionId: inTxId,
                    amount
                }
            };

        } catch (error) {
            console.error('Split transfer error:', error);
            throw error;
        }
    }

    /**
     * Get detailed bill split information
     * @param {number} splitId - Split ID
     * @returns {Promise<Object>} Detailed split information
     */
    async getSplitDetails(splitId) {
        try {
            const details = await this.billSplitRepository.findDetailedById(splitId);

            if (!details) {
                return {
                    success: false,
                    message: 'Fatura bölünmesi bulunamadı'
                };
            }

            return {
                success: true,
                data: details
            };

        } catch (error) {
            console.error('Get split details error:', error);
            return {
                success: false,
                message: 'Fatura detayları alınamadı'
            };
        }
    }

    /**
     * Get user's bill splits with filtering options
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Filtered bill splits
     */
    async getUserSplits(userId, filters = {}) {
        try {
            const { status, role } = filters; // role: 'payer', 'debtor', or null for both

            let splits = [];

            if (!role || role === 'both') {
                splits = await this.billSplitRepository.findByUserId(userId, status);
            } else if (role === 'payer') {
                splits = await this.billSplitRepository.findByPayerId(userId, status);
            } else if (role === 'debtor') {
                splits = await this.billSplitRepository.findByDebtorId(userId, status);
            }

            return {
                success: true,
                data: {
                    splits,
                    count: splits.length
                }
            };

        } catch (error) {
            console.error('Get user splits error:', error);
            return {
                success: false,
                message: 'Fatura bölünmeleri alınamadı'
            };
        }
    }
}

module.exports = BillSplitService;
