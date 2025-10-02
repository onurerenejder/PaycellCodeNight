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

INSERT OR IGNORE INTO budgets (user_id, month, category, limit_amount, spent_amount) VALUES 
('U1', '2025-10', 'cafe', 200.0, 120.0),
('U1', '2025-10', 'market', 300.0, 50.0);

