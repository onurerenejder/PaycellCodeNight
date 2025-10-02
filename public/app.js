/**
 * Frontend Application Logic
 * Handles UI interactions and API communication
 * Follows Single Responsibility and Clean Code principles
 */

class DigitalPaymentApp {
    constructor() {
        this.currentUser = null;
        this.currentQRInfo = null;
        this.apiBaseUrl = '/api';
        this.currentBudgetMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Transfer form
        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransfer();
        });

        // Payment form removed - only QR payment available

        // Top up modal
        document.getElementById('topUpBtn').addEventListener('click', () => {
            this.showTopUpModal();
        });

        document.getElementById('topUpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTopUp();
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.closest('.modal'));
            });
        });

        // Balance refresh
        document.getElementById('refreshBalance').addEventListener('click', () => {
            this.loadBalance();
        });

        // Split type selector
        document.querySelectorAll('[data-split-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSplitType(e.target.dataset.splitType);
            });
        });

        // Split forms
        document.getElementById('equalSplitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEqualSplit();
        });

        document.getElementById('weightedSplitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWeightedSplit();
        });

        // Add debtor button
        document.getElementById('addDebtorBtn').addEventListener('click', () => {
            this.addDebtorEntry();
        });

        // Remove debtor buttons (delegated)
        document.getElementById('weightedDebtors').addEventListener('click', (e) => {
            if (e.target.closest('.remove-debtor')) {
                this.removeDebtorEntry(e.target.closest('.debtor-entry'));
            }
        });

        // Demo user selection (delegated)
        document.querySelector('.demo-user-list').addEventListener('click', (e) => {
            const demoUser = e.target.closest('.demo-user');
            if (demoUser) {
                const userId = demoUser.dataset.userId;
                document.getElementById('userId').value = userId;
            }
        });

        // Quick amount buttons (delegated)
        document.addEventListener('click', (e) => {
            const quickAmountBtn = e.target.closest('.quick-amount');
            if (quickAmountBtn) {
                const amount = quickAmountBtn.dataset.amount;
                document.getElementById('topUpAmount').value = amount;
            }
        });

        // Split action buttons (delegated)
        document.addEventListener('click', (e) => {
            const settleBtn = e.target.closest('.settle-split-btn');
            const cancelBtn = e.target.closest('.cancel-split-btn');

            if (settleBtn) {
                const splitId = settleBtn.dataset.splitId;
                this.settleSplit(splitId);
            } else if (cancelBtn) {
                const splitId = cancelBtn.dataset.splitId;
                this.cancelSplit(splitId);
            }
        });

        // QR Payment form
        document.getElementById('qrPaymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQRPayment();
        });

        // Search QR button
        document.getElementById('searchQRBtn').addEventListener('click', () => {
            this.searchQRCode();
        });

        // Sample QR ID buttons (delegated)
        document.addEventListener('click', (e) => {
            const useQRIdBtn = e.target.closest('.use-qr-id');
            if (useQRIdBtn) {
                const qrId = useQRIdBtn.dataset.qrId;
                document.getElementById('qrIdInput').value = qrId;
                this.searchQRCode();
            }
        });

        // Print receipt button
        document.getElementById('printReceiptBtn').addEventListener('click', () => {
            this.printReceipt();
        });

        // Budget form
        document.getElementById('addBudgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBudget();
        });

        // Month navigation
        document.getElementById('prevMonthBtn').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('nextMonthBtn').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Reset threshold settings
        document.getElementById('resetThresholdsBtn').addEventListener('click', () => {
            this.resetThresholdSettings();
        });
    }

    /**
     * Check if user is already authenticated
     */
    async checkAuthStatus() {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            try {
                const response = await this.apiCall('GET', '/auth/profile');
                if (response.success) {
                    this.currentUser = response.user;
                    this.showDashboard();
                    return;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        }

        this.showLogin();
    }

    /**
     * Handle user login
     */
    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const userId = formData.get('userId').trim();

        if (!userId) {
            this.showToast('Kullanıcı ID\'si gereklidir', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Authenticate through login endpoint
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success) {
                // Store user ID for subsequent requests
                localStorage.setItem('userId', userId);
                this.currentUser = data.user;
                this.showDashboard();
                this.showToast('Giriş başarılı', 'success');
            } else {
                throw new Error(data.message || 'Kullanıcı bulunamadı');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.message || 'Giriş başarısız', 'error');
            localStorage.removeItem('userId');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        localStorage.removeItem('userId');
        this.currentUser = null;
        this.showLogin();
        this.showToast('Çıkış yapıldı', 'success');
    }

    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboardScreen').classList.add('hidden');
    }

    /**
     * Show dashboard screen
     */
    async showDashboard() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');

        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
        }

        // Load initial data
        await this.loadBalance();
        await this.loadSplitSummary();
        await this.loadActiveSplits();
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Load tab-specific data
        if (tabName === 'history') {
            this.loadTransactionHistory();
        } else if (tabName === 'splits') {
            this.loadActiveSplits();
        } else if (tabName === 'budgets') {
            this.loadBudgets();
        }
    }

    /**
     * Handle money transfer
     */
    async handleTransfer() {
        const formData = new FormData(document.getElementById('transferForm'));
        const toUserId = formData.get('toUserId').trim();
        const amount = parseFloat(formData.get('amount'));

        if (!toUserId || !amount || amount <= 0) {
            this.showToast('Tüm alanları doğru şekilde doldurun', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/payments/transfer', {
                toUserId,
                amount
            });

            if (response.success) {
                this.showToast(response.message, 'success');
                document.getElementById('transferForm').reset();
                await this.loadBalance();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Transfer error:', error);
            this.showToast('Transfer sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Payment method removed - only QR payment is available now

    /**
     * Search QR code by ID
     */
    async searchQRCode() {
        const qrId = document.getElementById('qrIdInput').value.trim();

        if (!qrId) {
            this.showToast('QR kod ID\'si giriniz', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/payments/qr-info?qrId=${encodeURIComponent(qrId)}`);
            const result = await response.json();

            if (result.success) {
                const qrInfo = result.data;

                // Get merchant name
                const merchantNames = {
                    'M1': 'Kampüs Kafe',
                    'M2': 'Kampüs Market'
                };
                const merchantName = merchantNames[qrInfo.merchant_id] || qrInfo.merchant_id;

                // Store QR info for payment
                this.currentQRInfo = qrInfo;

                // Display QR info
                document.getElementById('qrMerchant').textContent = merchantName;
                document.getElementById('qrDescription').textContent = qrInfo.description || '-';
                document.getElementById('qrAmount').textContent = `${parseFloat(qrInfo.amount).toFixed(2)} ${qrInfo.currency || 'TRY'}`;
                document.getElementById('qrInfo').style.display = 'block';
                document.getElementById('qrPayBtn').disabled = false;

                this.showToast('QR kod bulundu', 'success');
            } else {
                this.showToast(result.message, 'error');
                document.getElementById('qrInfo').style.display = 'none';
                document.getElementById('qrPayBtn').disabled = true;
                this.currentQRInfo = null;
            }

        } catch (error) {
            console.error('QR search error:', error);
            this.showToast('QR kod arama sırasında bir hata oluştu', 'error');
            document.getElementById('qrInfo').style.display = 'none';
            document.getElementById('qrPayBtn').disabled = true;
            this.currentQRInfo = null;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle QR payment
     */
    async handleQRPayment() {
        if (!this.currentQRInfo) {
            this.showToast('Önce QR kodu arayın', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/payments/qr-payment', {
                qrData: this.currentQRInfo
            });

            if (response.success) {
                this.showToast(response.message, 'success');

                // Save current QR info for receipt
                const receiptData = {
                    transactionId: response.data.transactionId,
                    merchantId: this.currentQRInfo.merchant_id,
                    qrId: this.currentQRInfo.qr_id,
                    amount: this.currentQRInfo.amount,
                    currency: this.currentQRInfo.currency || 'TRY',
                    description: this.currentQRInfo.description,
                    timestamp: new Date()
                };

                // Reset form
                document.getElementById('qrPaymentForm').reset();
                document.getElementById('qrInfo').style.display = 'none';
                document.getElementById('qrPayBtn').disabled = true;
                this.currentQRInfo = null;

                await this.loadBalance();

                // Show receipt
                this.showReceipt(receiptData);

                // Show option to split the bill after receipt is closed
                setTimeout(() => {
                    if (response.data.transactionId) {
                        this.showSplitOption(response.data.transactionId, receiptData.amount);
                    }
                }, 500);
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('QR payment error:', error);
            this.showToast('QR ödeme sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show option to split the bill after payment
     */
    showSplitOption(transactionId, amount) {
        const message = `Ödeme başarılı! ${amount.toFixed(2)} TL tutarındaki faturayı bölmek ister misiniz?`;

        if (confirm(message)) {
            // Switch to splits tab and pre-fill transaction ID
            this.switchTab('splits');
            document.getElementById('equalTxId').value = transactionId;
            document.getElementById('weightedTxId').value = transactionId;
        }
    }

    /**
     * Handle top up
     */
    async handleTopUp() {
        const formData = new FormData(document.getElementById('topUpForm'));
        const amount = parseFloat(formData.get('amount'));

        if (!amount || amount <= 0) {
            this.showToast('Geçerli bir tutar girin', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/payments/topup', { amount });

            if (response.success) {
                this.showToast(response.message, 'success');
                this.hideModal(document.getElementById('topUpModal'));
                document.getElementById('topUpForm').reset();
                await this.loadBalance();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Top up error:', error);
            this.showToast('Bakiye yükleme sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Switch split type
     */
    switchSplitType(type) {
        document.querySelectorAll('[data-split-type]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-split-type="${type}"]`).classList.add('active');

        if (type === 'equal') {
            document.getElementById('equalSplitForm').classList.remove('hidden');
            document.getElementById('weightedSplitForm').classList.add('hidden');
        } else {
            document.getElementById('equalSplitForm').classList.add('hidden');
            document.getElementById('weightedSplitForm').classList.remove('hidden');
        }
    }

    /**
     * Handle equal split
     */
    async handleEqualSplit() {
        const formData = new FormData(document.getElementById('equalSplitForm'));
        const originalTxId = formData.get('originalTxId').trim();
        const debtorUserIds = formData.get('debtorUserIds').trim().split(',').map(id => id.trim()).filter(id => id);

        if (!originalTxId || debtorUserIds.length === 0) {
            this.showToast('Tüm alanları doğru şekilde doldurun', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/splits/equal', {
                originalTxId,
                debtorUserIds
            });

            if (response.success) {
                this.showToast(response.message, 'success');
                document.getElementById('equalSplitForm').reset();
                await this.loadSplitSummary();
                await this.loadActiveSplits();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Equal split error:', error);
            this.showToast('Fatura bölme sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle weighted split
     */
    async handleWeightedSplit() {
        const formData = new FormData(document.getElementById('weightedSplitForm'));
        const originalTxId = formData.get('originalTxId').trim();

        // Collect debtor weights
        const debtorWeights = [];
        document.querySelectorAll('.debtor-entry').forEach(entry => {
            const userId = entry.querySelector('.debtor-user-id').value.trim();
            const weight = parseFloat(entry.querySelector('.debtor-weight').value);

            if (userId && weight > 0) {
                debtorWeights.push({ userId, weight });
            }
        });

        if (!originalTxId || debtorWeights.length === 0) {
            this.showToast('Tüm alanları doğru şekilde doldurun', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/splits/weighted', {
                originalTxId,
                debtorWeights
            });

            if (response.success) {
                this.showToast(response.message, 'success');
                document.getElementById('weightedSplitForm').reset();
                this.resetWeightedDebtors();
                await this.loadSplitSummary();
                await this.loadActiveSplits();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Weighted split error:', error);
            this.showToast('Ağırlıklı fatura bölme sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Add debtor entry for weighted split
     */
    addDebtorEntry() {
        const container = document.getElementById('weightedDebtors');
        const debtorEntry = document.createElement('div');
        debtorEntry.className = 'debtor-entry';
        debtorEntry.innerHTML = `
            <input 
                type="text" 
                placeholder="Kullanıcı ID (örn: U2)" 
                class="debtor-user-id"
                required
            >
            <input 
                type="number" 
                placeholder="Ağırlık" 
                class="debtor-weight"
                step="0.1"
                min="0.1"
                required
            >
            <button type="button" class="btn-icon remove-debtor">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(debtorEntry);
    }

    /**
     * Remove debtor entry
     */
    removeDebtorEntry(entry) {
        const container = document.getElementById('weightedDebtors');
        if (container.querySelectorAll('.debtor-entry').length > 1) {
            entry.remove();
        } else {
            this.showToast('En az bir borçlu kullanıcı olmalıdır', 'warning');
        }
    }

    /**
     * Reset weighted debtors to single entry
     */
    resetWeightedDebtors() {
        const container = document.getElementById('weightedDebtors');
        const entries = container.querySelectorAll('.debtor-entry');

        // Remove all except first
        for (let i = 1; i < entries.length; i++) {
            entries[i].remove();
        }

        // Clear first entry
        if (entries[0]) {
            entries[0].querySelector('.debtor-user-id').value = '';
            entries[0].querySelector('.debtor-weight').value = '';
        }
    }

    /**
     * Settle a bill split
     */
    async settleSplit(splitId) {
        if (!confirm('Bu fatura bölümünü ödemek istediğinizden emin misiniz?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', `/splits/${splitId}/settle`);

            if (response.success) {
                this.showToast(response.message, 'success');
                await this.loadBalance();
                await this.loadSplitSummary();
                await this.loadActiveSplits();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Settle split error:', error);
            this.showToast('Ödeme sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Cancel a bill split
     */
    async cancelSplit(splitId) {
        if (!confirm('Bu fatura bölümünü iptal etmek istediğinizden emin misiniz?')) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('DELETE', `/splits/${splitId}`);

            if (response.success) {
                this.showToast(response.message, 'success');
                await this.loadSplitSummary();
                await this.loadActiveSplits();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Cancel split error:', error);
            this.showToast('İptal sırasında bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load user balance
     */
    async loadBalance() {
        try {
            const response = await this.apiCall('GET', '/payments/balance');

            if (response.success) {
                document.getElementById('balanceAmount').textContent =
                    response.data.formattedBalance;
            } else {
                console.error('Failed to load balance:', response.message);
            }

        } catch (error) {
            console.error('Load balance error:', error);
        }
    }

    /**
     * Load split summary
     */
    async loadSplitSummary() {
        try {
            const response = await this.apiCall('GET', '/splits/summary');

            if (response.success) {
                const { summary } = response.data;
                document.getElementById('owedToMe').textContent =
                    `${summary.owedToMe.totalAmount.toFixed(2)} TL`;
                document.getElementById('iOwe').textContent =
                    `${summary.iOwe.totalAmount.toFixed(2)} TL`;
            }

        } catch (error) {
            console.error('Load split summary error:', error);
        }
    }

    /**
     * Load active splits
     */
    async loadActiveSplits() {
        try {
            const response = await this.apiCall('GET', '/splits?status=pending');

            if (response.success) {
                this.renderActiveSplits(response.data.splits);
            }

        } catch (error) {
            console.error('Load active splits error:', error);
        }
    }

    /**
     * Render active splits
     */
    renderActiveSplits(splits) {
        const container = document.getElementById('activeSplits');

        if (splits.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">Aktif fatura bölümü bulunmuyor</p>';
            return;
        }

        container.innerHTML = splits.map(split => {
            const isDebtor = split.debtor_user_id === this.currentUser.user_id;
            const isPayer = split.payer_user_id === this.currentUser.user_id;

            return `
                <div class="split-item">
                    <div class="split-header">
                        <div class="split-amount">${split.share_amount.toFixed(2)} TL</div>
                        <div class="split-status ${split.status}">${split.status}</div>
                    </div>
                    
                    <div class="split-details">
                        <div><strong>İşlem:</strong> ${split.tx_id}</div>
                        <div><strong>Toplam Tutar:</strong> ${split.total_amount.toFixed(2)} TL</div>
                        ${isPayer ? `<div><strong>Borçlu:</strong> ${split.debtor_name}</div>` : ''}
                        ${isDebtor ? `<div><strong>Ödeme Yapan:</strong> ${split.payer_name}</div>` : ''}
                        ${split.merchant_name ? `<div><strong>İşyeri:</strong> ${split.merchant_name}</div>` : ''}
                        <div><strong>Ağırlık:</strong> ${split.weight}</div>
                    </div>
                    
                    <div class="split-actions">
                        ${isDebtor ? `
                            <button class="btn btn-success settle-split-btn" data-split-id="${split.split_id}">
                                <i class="fas fa-check"></i>
                                Öde
                            </button>
                        ` : ''}
                        ${isPayer ? `
                            <button class="btn btn-danger cancel-split-btn" data-split-id="${split.split_id}">
                                <i class="fas fa-times"></i>
                                İptal
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Load transaction history
     */
    async loadTransactionHistory() {
        try {
            const response = await this.apiCall('GET', '/payments/history?page=1&pageSize=50');

            if (response.success) {
                this.renderTransactionHistory(response.data.transactions);
            } else {
                document.getElementById('transactionHistory').innerHTML = `
                    <p class="text-center text-secondary">İşlem geçmişi yüklenemedi</p>
                `;
            }

        } catch (error) {
            console.error('Load transaction history error:', error);
            document.getElementById('transactionHistory').innerHTML = `
                <p class="text-center text-secondary">Hata: ${error.message}</p>
            `;
        }
    }

    /**
     * Render transaction history
     */
    renderTransactionHistory(transactions) {
        const container = document.getElementById('transactionHistory');

        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">Henüz işlem yapılmamış</p>';
            return;
        }

        container.innerHTML = transactions.map(tx => {
            const typeLabels = {
                'transfer_in': 'Para Alındı',
                'transfer_out': 'Para Gönderildi',
                'payment': 'Ödeme',
                'topup': 'Bakiye Yükleme',
                'split_settlement': 'Fatura Ödemesi',
                'refund': 'İade'
            };

            const typeIcons = {
                'transfer_in': 'fas fa-arrow-down text-success',
                'transfer_out': 'fas fa-arrow-up text-danger',
                'payment': 'fas fa-credit-card text-primary',
                'topup': 'fas fa-plus-circle text-success',
                'split_settlement': 'fas fa-receipt text-info',
                'refund': 'fas fa-undo text-warning'
            };

            const isIncoming = tx.type === 'transfer_in' || tx.type === 'topup' || tx.type === 'refund';
            const amountClass = isIncoming ? 'text-success' : 'text-danger';
            const amountSign = isIncoming ? '+' : '-';

            return `
                <div class="transaction-item">
                    <div class="transaction-icon">
                        <i class="${typeIcons[tx.type] || 'fas fa-exchange-alt'}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-type">${typeLabels[tx.type] || tx.type}</div>
                        <div class="transaction-description">${tx.description || ''}</div>
                        ${tx.merchantName ? `<div class="transaction-merchant">${tx.merchantName}</div>` : ''}
                        <div class="transaction-date">${new Date(tx.createdAt).toLocaleString('tr-TR')}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}${tx.formattedAmount}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Show top up modal
     */
    showTopUpModal() {
        document.getElementById('topUpModal').classList.remove('hidden');
    }

    /**
     * Hide modal
     */
    hideModal(modal) {
        modal.classList.add('hidden');
    }

    /**
     * Show loading spinner
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        // Set icon based on type
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

        icon.className = `toast-icon ${iconClass}`;
        messageEl.textContent = message;
        toast.className = `toast ${type}`;

        // Show toast
        toast.classList.remove('hidden');

        // Hide after 4 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    /**
     * Show receipt modal
     */
    showReceipt(receiptData) {
        const merchantNames = {
            'M1': 'Kampüs Kafe',
            'M2': 'Kampüs Market'
        };

        const merchantName = merchantNames[receiptData.merchantId] || receiptData.merchantId;
        const date = new Date(receiptData.timestamp);

        // Populate receipt
        document.getElementById('receiptTxId').textContent = receiptData.transactionId;
        document.getElementById('receiptDate').textContent = date.toLocaleDateString('tr-TR');
        document.getElementById('receiptTime').textContent = date.toLocaleTimeString('tr-TR');
        document.getElementById('receiptMerchant').textContent = merchantName;
        document.getElementById('receiptCustomer').textContent = this.currentUser ? this.currentUser.name : '-';
        document.getElementById('receiptAmount').textContent = `${receiptData.amount.toFixed(2)} ${receiptData.currency}`;

        // Show QR ID if available
        if (receiptData.qrId) {
            document.getElementById('receiptQRRow').style.display = 'flex';
            document.getElementById('receiptQRId').textContent = receiptData.qrId;
        } else {
            document.getElementById('receiptQRRow').style.display = 'none';
        }

        // Show modal
        document.getElementById('receiptModal').classList.remove('hidden');
    }

    /**
     * Print receipt
     */
    printReceipt() {
        const receiptContent = document.querySelector('.receipt-body').innerHTML;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ödeme Fişi</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        max-width: 400px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .receipt-logo {
                        font-size: 48px;
                        margin-bottom: 10px;
                    }
                    .receipt-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                    }
                    .receipt-total {
                        font-size: 18px;
                        font-weight: bold;
                        margin-top: 10px;
                    }
                    .receipt-divider {
                        border-top: 2px dashed #ccc;
                        margin: 15px 0;
                    }
                    .success-row {
                        color: #10b981;
                        text-align: center;
                        font-weight: bold;
                        padding: 10px 0;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 10px;
                        }
                    }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    /**
     * Handle add budget
     */
    async handleAddBudget() {
        const formData = new FormData(document.getElementById('addBudgetForm'));
        const month = formData.get('month');
        const category = formData.get('category');
        const limitAmount = parseFloat(formData.get('limitAmount'));

        if (!month || !category || !limitAmount || limitAmount <= 0) {
            this.showToast('Tüm alanları doğru şekilde doldurun', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiCall('POST', '/budgets', {
                month,
                category,
                limitAmount
            });

            if (response.success) {
                this.showToast(response.message, 'success');
                document.getElementById('addBudgetForm').reset();
                await this.loadBudgets();
            } else {
                this.showToast(response.message, 'error');
            }

        } catch (error) {
            console.error('Add budget error:', error);
            this.showToast('Bütçe eklenirken bir hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Change displayed month
     */
    changeMonth(direction) {
        const currentDate = new Date(this.currentBudgetMonth + '-01');
        currentDate.setMonth(currentDate.getMonth() + direction);
        this.currentBudgetMonth = currentDate.toISOString().substring(0, 7);

        this.updateMonthDisplay();
        this.loadBudgets();
    }

    /**
     * Update month display
     */
    updateMonthDisplay() {
        const monthNames = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const [year, month] = this.currentBudgetMonth.split('-');
        const monthName = monthNames[parseInt(month) - 1];

        document.getElementById('currentMonthDisplay').textContent = `${monthName} ${year}`;
    }

    /**
     * Load threshold settings from localStorage for a category
     */
    getCategoryThresholds(category) {
        const settings = localStorage.getItem('categoryThresholds');
        if (settings) {
            const allThresholds = JSON.parse(settings);
            if (allThresholds[category]) {
                return allThresholds[category];
            }
        }
        return { warning: 80, danger: 95 };
    }

    /**
     * Save threshold for a category
     */
    saveCategoryThreshold(category, warning, danger) {
        if (warning >= danger) {
            this.showToast(`${category}: Uyarı eşiği kritikten küçük olmalı`, 'error');
            return false;
        }

        if (warning < 1 || warning > 100 || danger < 1 || danger > 100) {
            this.showToast('Eşik değerleri 1-100 arasında olmalıdır', 'error');
            return false;
        }

        const settings = localStorage.getItem('categoryThresholds');
        const allThresholds = settings ? JSON.parse(settings) : {};

        allThresholds[category] = { warning, danger };
        localStorage.setItem('categoryThresholds', JSON.stringify(allThresholds));

        return true;
    }

    /**
     * Reset all thresholds to defaults
     */
    resetThresholdSettings() {
        if (confirm('Tüm kategori eşiklerini varsayılana döndürmek istediğinizden emin misiniz?')) {
            localStorage.removeItem('categoryThresholds');
            this.showToast('Eşikler varsayılana sıfırlandı', 'success');
            this.loadBudgets();
        }
    }

    /**
     * Get budget status based on category-specific thresholds
     */
    getBudgetStatusByThreshold(percentage, category) {
        const thresholds = this.getCategoryThresholds(category);

        if (percentage >= thresholds.danger) return 'danger';
        if (percentage >= thresholds.warning) return 'warning';
        return 'good';
    }

    /**
     * Load budgets
     */
    async loadBudgets() {
        try {
            const response = await this.apiCall('GET', `/budgets?month=${this.currentBudgetMonth}`);

            console.log('Budget API Response:', response);

            if (response.success) {
                console.log('Budget Data:', response.data);

                // Also get current month summary
                const summaryResponse = await this.apiCall('GET', '/budgets/summary');
                if (summaryResponse.success) {
                    this.renderBudgetSummary(summaryResponse.data);
                }

                this.renderBudgets(response.data.budgets);
                this.renderCategoryThresholds(response.data.budgets);
                this.updateMonthDisplay();
            } else {
                console.error('Budget load failed:', response.message);
                // Show empty state
                document.getElementById('budgetsList').innerHTML =
                    '<p class="text-center text-secondary">Bu ay için bütçe tanımlanmamış</p>';
                document.getElementById('categoryThresholds').innerHTML =
                    '<p class="text-center text-secondary">Önce bütçe ekleyin</p>';
            }

        } catch (error) {
            console.error('Load budgets error:', error);
            this.showToast('Bütçeler yüklenemedi', 'error');
        }
    }

    /**
     * Render budget summary
     */
    renderBudgetSummary(data) {
        console.log('Rendering budget summary with data:', data);

        // Use real transaction data from backend
        const totalLimit = parseFloat(data.totalLimit) || 0;
        const totalSpent = parseFloat(data.totalSpent) || 0;
        const totalRemaining = parseFloat(data.totalRemaining) || 0;
        const percentage = parseFloat(data.percentage) || 0;

        console.log('Budget Summary:', {
            totalLimit,
            totalSpent,
            totalRemaining,
            percentage
        });

        // Update DOM with real values from database
        // totalBudget is now from wallet balance, not budget limits
        const totalBudget = parseFloat(data.totalBudget) || totalLimit;

        document.getElementById('totalBudget').textContent = `${totalBudget.toFixed(2)} TL`;
        document.getElementById('totalSpent').textContent = `${totalSpent.toFixed(2)} TL`;
        document.getElementById('totalRemaining').textContent = `${totalRemaining.toFixed(2)} TL`;
        document.getElementById('totalPercentage').textContent = `${percentage.toFixed(1)}%`;

        const progressBar = document.getElementById('totalProgressBar');
        const displayPercentage = Math.min(percentage, 100);
        progressBar.style.width = `${displayPercentage}%`;

        // Change color based on average thresholds
        // For overall budget, use average of all category thresholds
        if (percentage >= 95) {
            progressBar.style.background = 'var(--error-color)';
        } else if (percentage >= 80) {
            progressBar.style.background = 'var(--warning-color)';
        } else {
            progressBar.style.background = 'var(--success-color)';
        }

        // Log additional info
        if (data.totalMonthSpending !== undefined) {
            console.log(`✓ Bu ay toplam harcama: ${data.totalMonthSpending.toFixed(2)} TL`);
            console.log(`✓ Bütçeli kategorilerde: ${totalSpent.toFixed(2)} TL`);
        }
    }

    /**
     * Render budgets list
     */
    renderBudgets(budgets) {
        const container = document.getElementById('budgetsList');

        if (budgets.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">Henüz bütçe tanımlanmamış</p>';
            return;
        }

        const categoryIcons = {
            'cafe': 'fa-coffee',
            'market': 'fa-shopping-cart',
            'ulaşım': 'fa-bus',
            'eğlence': 'fa-film',
            'sağlık': 'fa-heartbeat',
            'diğer': 'fa-ellipsis-h'
        };

        container.innerHTML = budgets.map(budget => {
            // Apply category-specific thresholds
            const percentage = parseFloat(budget.percentage);
            const statusClass = this.getBudgetStatusByThreshold(percentage, budget.category);
            const icon = categoryIcons[budget.category] || 'fa-tag';

            return `
                <div class="budget-item ${statusClass}">
                    <div class="budget-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="budget-details">
                        <div class="budget-category">${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</div>
                        <div class="budget-amounts">
                            <span class="spent">${budget.spentAmount.toFixed(2)} TL</span>
                            <span class="separator">/</span>
                            <span class="limit">${budget.limitAmount.toFixed(2)} TL</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${statusClass}" style="width: ${budget.percentage}%;"></div>
                        </div>
                        <div class="budget-info-row">
                            <span class="remaining">Kalan: ${budget.remaining.toFixed(2)} TL</span>
                            <span class="percentage">${budget.percentage}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Set default month to current month
        const currentMonth = new Date().toISOString().substring(0, 7);
        document.getElementById('budgetMonth').value = currentMonth;
    }

    /**
     * Render category threshold settings
     */
    renderCategoryThresholds(budgets) {
        const container = document.getElementById('categoryThresholds');

        if (budgets.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">Önce bütçe ekleyin</p>';
            return;
        }

        const categoryIcons = {
            'cafe': 'fa-coffee',
            'market': 'fa-shopping-cart',
            'ulaşım': 'fa-bus',
            'eğlence': 'fa-film',
            'sağlık': 'fa-heartbeat',
            'diğer': 'fa-ellipsis-h'
        };

        container.innerHTML = budgets.map(budget => {
            const thresholds = this.getCategoryThresholds(budget.category);
            const icon = categoryIcons[budget.category] || 'fa-tag';
            const categoryName = budget.category.charAt(0).toUpperCase() + budget.category.slice(1);

            return `
                <div class="threshold-category-item">
                    <div class="threshold-category-header">
                        <i class="fas ${icon}"></i>
                        <strong>${categoryName}</strong>
                    </div>
                    <div class="threshold-inputs">
                        <div class="threshold-input-wrapper">
                            <label>
                                <i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>
                                Uyarı
                            </label>
                            <div class="threshold-input-group">
                                <input type="number" 
                                    class="threshold-input" 
                                    data-category="${budget.category}" 
                                    data-type="warning"
                                    min="1" max="100" 
                                    value="${thresholds.warning}">
                                <span>%</span>
                            </div>
                        </div>
                        <div class="threshold-input-wrapper">
                            <label>
                                <i class="fas fa-exclamation-circle" style="color: var(--error-color);"></i>
                                Kritik
                            </label>
                            <div class="threshold-input-group">
                                <input type="number" 
                                    class="threshold-input" 
                                    data-category="${budget.category}" 
                                    data-type="danger"
                                    min="1" max="100" 
                                    value="${thresholds.danger}">
                                <span>%</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary save-category-threshold" 
                            data-category="${budget.category}">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for save buttons
        document.querySelectorAll('.save-category-threshold').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.closest('button').dataset.category;
                this.saveCategoryThresholdFromUI(category);
            });
        });
    }

    /**
     * Save category threshold from UI inputs
     */
    saveCategoryThresholdFromUI(category) {
        const warningInput = document.querySelector(`input[data-category="${category}"][data-type="warning"]`);
        const dangerInput = document.querySelector(`input[data-category="${category}"][data-type="danger"]`);

        const warning = parseInt(warningInput.value);
        const danger = parseInt(dangerInput.value);

        if (this.saveCategoryThreshold(category, warning, danger)) {
            this.showToast(`${category.charAt(0).toUpperCase() + category.slice(1)} eşikleri kaydedildi`, 'success');
            this.loadBudgets();
        }
    }

    /**
     * Make API call
     */
    async apiCall(method, endpoint, data = null) {
        const userId = localStorage.getItem('userId');

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(userId && { 'Authorization': `Bearer ${userId}` })
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API call failed');
        }

        return await response.json();
    }
}

// Initialize the application
const app = new DigitalPaymentApp();
