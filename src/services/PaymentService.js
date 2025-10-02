/**
 * Payment Service
 * Handles payment and transfer operations
 * Follows Single Responsibility Principle and Open/Closed Principle
 */

const Transaction = require('../domain/Transaction');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
    constructor(walletRepository, transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Transfer money between users
     * @param {string} fromUserId - Sender user ID
     * @param {string} toUserId - Receiver user ID
     * @param {number} amount - Transfer amount
     * @returns {Promise<Object>} Transfer result
     */
    async transferMoney(fromUserId, toUserId, amount) {
        try {
            // Validate input
            if (!fromUserId || !toUserId) {
                return {
                    success: false,
                    message: 'Gönderici ve alıcı kullanıcı ID\'leri gereklidir'
                };
            }

            if (fromUserId === toUserId) {
                return {
                    success: false,
                    message: 'Kendinize para gönderemezsiniz'
                };
            }

            if (typeof amount !== 'number' || amount <= 0) {
                return {
                    success: false,
                    message: 'Geçerli bir tutar giriniz'
                };
            }

            // Check if users exist
            const [fromWallet, toWallet] = await Promise.all([
                this.walletRepository.findByUserId(fromUserId),
                this.walletRepository.findByUserId(toUserId)
            ]);

            if (!fromWallet) {
                return {
                    success: false,
                    message: 'Gönderici kullanıcının cüzdanı bulunamadı'
                };
            }

            if (!toWallet) {
                return {
                    success: false,
                    message: 'Alıcı kullanıcının cüzdanı bulunamadı'
                };
            }

            // Check sufficient funds
            if (!fromWallet.hasSufficientFunds(amount)) {
                return {
                    success: false,
                    message: 'Yetersiz bakiye'
                };
            }

            // Create transaction IDs
            const outTxId = `TX_OUT_${uuidv4().substring(0, 8)}`;
            const inTxId = `TX_IN_${uuidv4().substring(0, 8)}`;

            // Create transactions
            const outTransaction = new Transaction(
                outTxId,
                fromUserId,
                amount,
                'TRY',
                'transfer_out',
                'ok',
                null,
                { to_user: toUserId, related_tx: inTxId }
            );

            const inTransaction = new Transaction(
                inTxId,
                toUserId,
                amount,
                'TRY',
                'transfer_in',
                'ok',
                null,
                { from_user: fromUserId, related_tx: outTxId }
            );

            // Execute transfer in transaction
            const operations = [
                // Update sender wallet
                {
                    sql: 'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), fromUserId]
                },
                // Update receiver wallet
                {
                    sql: 'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), toUserId]
                },
                // Insert outgoing transaction
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(outTransaction.toObject())
                },
                // Insert incoming transaction
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(inTransaction.toObject())
                }
            ];

            await this.walletRepository.transaction(operations);

            return {
                success: true,
                message: 'Transfer başarılı',
                data: {
                    outTransactionId: outTxId,
                    inTransactionId: inTxId,
                    amount,
                    fromUserId,
                    toUserId
                }
            };

        } catch (error) {
            console.error('Transfer error:', error);
            return {
                success: false,
                message: 'Transfer sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Process a payment transaction
     * @param {string} userId - User ID
     * @param {string} merchantId - Merchant ID
     * @param {number} amount - Payment amount
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(userId, merchantId, amount) {
        try {
            // Validate input
            if (!userId || !merchantId) {
                return {
                    success: false,
                    message: 'Kullanıcı ve işyeri ID\'leri gereklidir'
                };
            }

            if (typeof amount !== 'number' || amount <= 0) {
                return {
                    success: false,
                    message: 'Geçerli bir tutar giriniz'
                };
            }

            // Check wallet
            const wallet = await this.walletRepository.findByUserId(userId);
            if (!wallet) {
                return {
                    success: false,
                    message: 'Kullanıcının cüzdanı bulunamadı'
                };
            }

            // Check sufficient funds
            if (!wallet.hasSufficientFunds(amount)) {
                return {
                    success: false,
                    message: 'Yetersiz bakiye'
                };
            }

            // Create payment transaction
            const txId = `TX_PAY_${uuidv4().substring(0, 8)}`;
            const transaction = new Transaction(
                txId,
                userId,
                amount,
                'TRY',
                'payment',
                'ok',
                merchantId,
                { payment_method: 'wallet' }
            );

            // Execute payment in transaction
            const operations = [
                // Update wallet balance
                {
                    sql: 'UPDATE wallets SET balance = balance - ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), userId]
                },
                // Insert payment transaction
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(transaction.toObject())
                }
            ];

            await this.walletRepository.transaction(operations);

            return {
                success: true,
                message: 'Ödeme başarılı',
                data: {
                    transactionId: txId,
                    amount,
                    merchantId,
                    newBalance: wallet.balance - amount
                }
            };

        } catch (error) {
            console.error('Payment error:', error);
            return {
                success: false,
                message: 'Ödeme sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Add funds to wallet (top-up)
     * @param {string} userId - User ID
     * @param {number} amount - Amount to add
     * @returns {Promise<Object>} Top-up result
     */
    async topUpWallet(userId, amount) {
        try {
            if (typeof amount !== 'number' || amount <= 0) {
                return {
                    success: false,
                    message: 'Geçerli bir tutar giriniz'
                };
            }

            const wallet = await this.walletRepository.findByUserId(userId);
            if (!wallet) {
                return {
                    success: false,
                    message: 'Kullanıcının cüzdanı bulunamadı'
                };
            }

            // Create top-up transaction
            const txId = `TX_TOP_${uuidv4().substring(0, 8)}`;
            const transaction = new Transaction(
                txId,
                userId,
                amount,
                'TRY',
                'topup',
                'ok',
                null,
                { method: 'bank_transfer' }
            );

            // Execute top-up in transaction
            const operations = [
                // Update wallet balance
                {
                    sql: 'UPDATE wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?',
                    params: [amount, new Date().toISOString(), userId]
                },
                // Insert top-up transaction
                {
                    sql: `INSERT INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    params: Object.values(transaction.toObject())
                }
            ];

            await this.walletRepository.transaction(operations);

            return {
                success: true,
                message: 'Bakiye yükleme başarılı',
                data: {
                    transactionId: txId,
                    amount,
                    newBalance: wallet.balance + amount
                }
            };

        } catch (error) {
            console.error('Top-up error:', error);
            return {
                success: false,
                message: 'Bakiye yükleme sırasında bir hata oluştu'
            };
        }
    }

    /**
     * Get user's wallet balance
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Balance information
     */
    async getWalletBalance(userId) {
        try {
            const wallet = await this.walletRepository.findByUserId(userId);

            if (!wallet) {
                return {
                    success: false,
                    message: 'Cüzdan bulunamadı'
                };
            }

            return {
                success: true,
                data: {
                    balance: wallet.balance,
                    currency: wallet.currency,
                    formattedBalance: wallet.getFormattedBalance(),
                    updatedAt: wallet.updatedAt
                }
            };

        } catch (error) {
            console.error('Get balance error:', error);
            return {
                success: false,
                message: 'Bakiye bilgisi alınamadı'
            };
        }
    }

    /**
     * Get user's transaction history
     * @param {string} userId - User ID
     * @param {number} page - Page number
     * @param {number} pageSize - Number of records per page
     * @returns {Promise<Object>} Transaction history
     */
    async getTransactionHistory(userId, page = 1, pageSize = 20) {
        try {
            const result = await this.transactionRepository.getUserTransactionHistory(
                userId,
                page,
                pageSize
            );

            return {
                success: true,
                data: {
                    transactions: result.transactions.map(tx => ({
                        txId: tx.txId,
                        type: tx.type,
                        amount: tx.amount,
                        formattedAmount: `${tx.amount.toFixed(2)} ${tx.currency}`,
                        description: this.getTransactionDescription(tx),
                        merchantId: tx.merchantId,
                        merchantName: tx.merchantName,
                        status: tx.status,
                        createdAt: tx.createdAt
                    })),
                    pagination: result.pagination
                }
            };

        } catch (error) {
            console.error('Get transaction history error:', error);
            return {
                success: false,
                message: 'İşlem geçmişi alınamadı'
            };
        }
    }

    /**
     * Get transaction description based on type and metadata
     * @param {Transaction} tx - Transaction object
     * @returns {string} Transaction description
     */
    getTransactionDescription(tx) {
        if (tx.meta && tx.meta.description) {
            return tx.meta.description;
        }

        switch (tx.type) {
            case 'transfer_in':
                return tx.meta?.fromUserId ? `${tx.meta.fromUserId} kullanıcısından para alındı` : 'Para alındı';
            case 'transfer_out':
                return tx.meta?.toUserId ? `${tx.meta.toUserId} kullanıcısına para gönderildi` : 'Para gönderildi';
            case 'payment':
                return tx.merchantName ? `${tx.merchantName} - Ödeme` : 'Ödeme yapıldı';
            case 'topup':
                return 'Bakiye yükleme';
            case 'split_settlement':
                return 'Fatura bölme ödemesi';
            case 'refund':
                return 'İade';
            case 'cashback':
                return 'Cashback kazandınız';
            default:
                return 'İşlem';
        }
    }

    /**
     * Get QR code information by ID
     * @param {string} qrId - QR code ID
     * @returns {Object|null} QR code information
     */
    getQRCodeById(qrId) {
        // Mock QR code database
        const qrCodes = {
            'QR-M1-001': {
                qr_id: 'QR-M1-001',
                merchant_id: 'M1',
                amount: 25.50,
                currency: 'TRY',
                description: 'Kahve ve Kek',
                ts: new Date().toISOString()
            },
            'QR-M1-002': {
                qr_id: 'QR-M1-002',
                merchant_id: 'M1',
                amount: 12.75,
                currency: 'TRY',
                description: 'Türk Kahvesi',
                ts: new Date().toISOString()
            },
            'QR-M2-001': {
                qr_id: 'QR-M2-001',
                merchant_id: 'M2',
                amount: 45.00,
                currency: 'TRY',
                description: 'Market Alışverişi',
                ts: new Date().toISOString()
            },
            'QR-M2-002': {
                qr_id: 'QR-M2-002',
                merchant_id: 'M2',
                amount: 32.50,
                currency: 'TRY',
                description: 'Atıştırmalık',
                ts: new Date().toISOString()
            },
            'QR-12345': {
                qr_id: 'QR-12345',
                merchant_id: 'M1',
                amount: 120.00,
                currency: 'TRY',
                description: 'Özel Sipariş',
                ts: '2025-11-10T19:30:00Z'
            }
        };

        return qrCodes[qrId] || null;
    }

    /**
     * Process payment with QR code
     * @param {string} userId - User ID
     * @param {string|Object} qrData - QR code data (JSON string or object)
     * @returns {Promise<Object>} Payment result
     */
    async processQRPayment(userId, qrData) {
        try {
            // Parse QR data if it's a string
            let qrInfo;
            if (typeof qrData === 'string') {
                try {
                    qrInfo = JSON.parse(qrData);
                } catch (e) {
                    return {
                        success: false,
                        message: 'Geçersiz QR kod formatı'
                    };
                }
            } else {
                qrInfo = qrData;
            }

            // Validate QR data
            if (!qrInfo.qr_id || !qrInfo.merchant_id || !qrInfo.amount) {
                return {
                    success: false,
                    message: 'QR kod verisi eksik veya hatalı'
                };
            }

            // Check if amount is valid
            const amount = parseFloat(qrInfo.amount);
            if (isNaN(amount) || amount <= 0) {
                return {
                    success: false,
                    message: 'Geçersiz tutar'
                };
            }

            // Check if QR code is expired (if timestamp provided)
            if (qrInfo.ts) {
                const qrTimestamp = new Date(qrInfo.ts);
                const now = new Date();
                const hoursDiff = (now - qrTimestamp) / (1000 * 60 * 60);

                // QR codes expire after 24 hours
                if (hoursDiff > 24) {
                    return {
                        success: false,
                        message: 'QR kod süresi dolmuş'
                    };
                }
            }

            // Process payment
            const result = await this.processPayment(
                userId,
                qrInfo.merchant_id,
                amount
            );

            if (result.success) {
                return {
                    success: true,
                    message: `QR kod ile ${amount.toFixed(2)} TL ödeme başarılı`,
                    data: {
                        ...result.data,
                        qrId: qrInfo.qr_id,
                        merchantId: qrInfo.merchant_id
                    }
                };
            }

            return result;

        } catch (error) {
            console.error('QR payment error:', error);
            return {
                success: false,
                message: 'QR kod ile ödeme sırasında bir hata oluştu'
            };
        }
    }
}

module.exports = PaymentService;
