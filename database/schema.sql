-- Digital Payment System Database Schema
-- Created with SOLID principles in mind

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    merchant_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL
);

-- Wallets table - User balances
CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance DECIMAL(10,2) DEFAULT 0.0,
    currency TEXT DEFAULT 'TRY',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Transactions table - All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
    tx_id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT NOT NULL,
    merchant_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    type TEXT NOT NULL CHECK (type IN ('payment', 'cashback', 'topup', 'transfer_out', 'transfer_in', 'bill_split')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'failed', 'cancelled')),
    meta TEXT, -- JSON metadata
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
);

-- Bill splits table - For split payments
CREATE TABLE IF NOT EXISTS bill_splits (
    split_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT NOT NULL, -- Original transaction ID
    payer_user_id TEXT NOT NULL, -- User who paid the bill
    debtor_user_id TEXT NOT NULL, -- User who owes money
    total_amount DECIMAL(10,2) NOT NULL, -- Total bill amount
    share_amount DECIMAL(10,2) NOT NULL, -- Amount this user owes
    weight DECIMAL(5,2) DEFAULT 1.0, -- Weight for weighted splitting
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settled_at DATETIME,
    FOREIGN KEY (tx_id) REFERENCES transactions(tx_id),
    FOREIGN KEY (payer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (debtor_user_id) REFERENCES users(user_id)
);

-- P2P contacts table
CREATE TABLE IF NOT EXISTS p2p_contacts (
    user_id TEXT NOT NULL,
    contact_user_id TEXT NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, contact_user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (contact_user_id) REFERENCES users(user_id)
);

-- Cashback rules table
CREATE TABLE IF NOT EXISTS cashback_rules (
    rule_id TEXT PRIMARY KEY,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('percent', 'flat')),
    category TEXT,
    rate DECIMAL(5,4) DEFAULT 0,
    flat_amount DECIMAL(10,2) DEFAULT 0,
    cap DECIMAL(10,2),
    first_time_only BOOLEAN DEFAULT FALSE,
    starts_at DATE,
    ends_at DATE,
    active BOOLEAN DEFAULT TRUE
);

-- Budget tracking table
CREATE TABLE IF NOT EXISTS budgets (
    user_id TEXT NOT NULL,
    month TEXT NOT NULL, -- Format: YYYY-MM
    category TEXT NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, month, category),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_bill_splits_payer ON bill_splits(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_debtor ON bill_splits(debtor_user_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_status ON bill_splits(status);

-- Insert initial data
INSERT OR IGNORE INTO users (user_id, name, phone) VALUES 
('U1', 'Ayşe', '+905551111111'),
('U2', 'Ali', '+905552222222'),
('U3', 'Deniz', '+905553333333');

INSERT OR IGNORE INTO merchants (merchant_id, name, category) VALUES 
('M1', 'Kampüs Kafe', 'cafe'),
('M2', 'Kampüs Market', 'market');

INSERT OR IGNORE INTO wallets (user_id, balance) VALUES 
('U1', 250.0),
('U2', 90.0),
('U3', 30.0);

INSERT OR IGNORE INTO cashback_rules (rule_id, rule_type, category, rate, flat_amount, cap, first_time_only, starts_at, ends_at) VALUES 
('CB1', 'percent', 'cafe', 0.05, 0, 20, 0, '2025-10-01', '2025-12-31'),
('CB2', 'flat', 'any', 0.0, 20, 20, 1, '2025-10-01', '2025-10-31');

INSERT OR IGNORE INTO p2p_contacts (user_id, contact_user_id, favorite) VALUES 
('U1', 'U2', 1),
('U1', 'U3', 0);

-- Demo Budgets (multiple users, multiple months)
INSERT OR IGNORE INTO budgets (user_id, month, category, limit_amount, spent_amount) VALUES 
-- U1 (Ayşe) - October 2025
('U1', '2025-10', 'cafe', 200.0, 0.0),
('U1', '2025-10', 'market', 300.0, 0.0),
('U1', '2025-10', 'ulaşım', 150.0, 0.0),
-- U1 (Ayşe) - November 2025
('U1', '2025-11', 'cafe', 180.0, 0.0),
('U1', '2025-11', 'market', 320.0, 0.0),
('U1', '2025-11', 'eğlence', 100.0, 0.0),
-- U2 (Ali) - October 2025
('U2', '2025-10', 'cafe', 100.0, 0.0),
('U2', '2025-10', 'market', 200.0, 0.0),
-- U3 (Deniz) - October 2025
('U3', '2025-10', 'cafe', 80.0, 0.0),
('U3', '2025-10', 'ulaşım', 120.0, 0.0);

-- Demo Transactions (realistic payment history)
INSERT OR IGNORE INTO transactions (tx_id, created_at, user_id, merchant_id, amount, currency, type, status, meta) VALUES 
-- U1 Cafe payments (September - old data)
('TX_PAY_001', '2025-09-15T10:30:00Z', 'U1', 'M1', 15.50, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-001"}'),
('TX_PAY_002', '2025-09-18T14:20:00Z', 'U1', 'M1', 22.00, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-002"}'),
-- U1 Market payments (September)
('TX_PAY_003', '2025-09-20T16:45:00Z', 'U1', 'M2', 45.75, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M2-001"}'),
-- U1 October payments
('TX_PAY_004', '2025-10-01T09:15:00Z', 'U1', 'M1', 18.50, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-001"}'),
('TX_PAY_005', '2025-10-03T12:30:00Z', 'U1', 'M2', 32.00, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M2-002"}'),
('TX_PAY_006', '2025-10-05T15:45:00Z', 'U1', 'M1', 12.75, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-002"}'),
-- U1 Cashback transactions (October)
('TX_CB_001', '2025-10-01T09:15:05Z', 'U1', 'M1', 0.93, 'TRY', 'cashback', 'ok', '{"rule_id":"CB1","original_tx_id":"TX_PAY_004","description":"Kampüs Kafe - %5 Cashback"}'),
('TX_CB_002', '2025-10-05T15:45:05Z', 'U1', 'M1', 0.64, 'TRY', 'cashback', 'ok', '{"rule_id":"CB1","original_tx_id":"TX_PAY_006","description":"Kampüs Kafe - %5 Cashback"}'),
-- U2 transactions
('TX_PAY_007', '2025-10-02T11:00:00Z', 'U2', 'M1', 25.50, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-001"}'),
('TX_CB_003', '2025-10-02T11:00:05Z', 'U2', NULL, 20.00, 'TRY', 'cashback', 'ok', '{"rule_id":"CB2","original_tx_id":"TX_PAY_007","description":"İlk QR Ödeme Bonusu - 20 TL"}'),
('TX_CB_004', '2025-10-02T11:00:06Z', 'U2', 'M1', 1.28, 'TRY', 'cashback', 'ok', '{"rule_id":"CB1","original_tx_id":"TX_PAY_007","description":"Kampüs Kafe - %5 Cashback"}'),
('TX_PAY_008', '2025-10-04T13:20:00Z', 'U2', 'M2', 18.00, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M2-001"}'),
-- U3 transactions
('TX_PAY_009', '2025-10-01T08:30:00Z', 'U3', 'M1', 12.75, 'TRY', 'payment', 'ok', '{"payment_method":"qr_code","qr_id":"QR-M1-002"}'),
('TX_CB_005', '2025-10-01T08:30:05Z', 'U3', NULL, 20.00, 'TRY', 'cashback', 'ok', '{"rule_id":"CB2","original_tx_id":"TX_PAY_009","description":"İlk QR Ödeme Bonusu - 20 TL"}'),
('TX_CB_006', '2025-10-01T08:30:06Z', 'U3', 'M1', 0.64, 'TRY', 'cashback', 'ok', '{"rule_id":"CB1","original_tx_id":"TX_PAY_009","description":"Kampüs Kafe - %5 Cashback"}'),
-- Top-up transactions
('TX_TOP_001', '2025-10-01T08:00:00Z', 'U2', NULL, 100.00, 'TRY', 'topup', 'ok', '{"payment_method":"bank_transfer"}'),
('TX_TOP_002', '2025-10-02T09:00:00Z', 'U3', NULL, 50.00, 'TRY', 'topup', 'ok', '{"payment_method":"bank_transfer"}');

