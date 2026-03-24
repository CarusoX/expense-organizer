-- Currencies
CREATE TABLE currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO currencies (code, name, symbol) VALUES
  ('ARS', 'Argentine Peso', '$'),
  ('USD', 'US Dollar', 'US$');

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name) VALUES
  ('Housing'),
  ('Utilities'),
  ('Subscriptions'),
  ('Food'),
  ('Transportation'),
  ('Entertainment'),
  ('Shopping'),
  ('Savings'),
  ('Health'),
  ('Other');

-- Credit Cards
CREATE TABLE credit_cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
-- type: 'fixed' (recurring indefinitely), 'installment' (limited months), 'singular' (one-time)
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  amount DECIMAL(12, 2) NOT NULL,
  currency_id INTEGER REFERENCES currencies(id) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  credit_card_id INTEGER REFERENCES credit_cards(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('fixed', 'installment', 'singular')),
  start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_year INTEGER NOT NULL CHECK (start_year >= 2000),
  duration_months INTEGER CHECK (duration_months > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track payments per expense per month
CREATE TABLE expense_payments (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  is_paid BOOLEAN DEFAULT false,
  UNIQUE(expense_id, month, year)
);

-- Monthly budget (how much money available per currency)
CREATE TABLE monthly_budgets (
  id SERIAL PRIMARY KEY,
  currency_id INTEGER REFERENCES currencies(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  UNIQUE(currency_id, month, year)
);

-- RLS policies (for Supabase - allow all for single-user app)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on currencies" ON currencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on credit_cards" ON credit_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expense_payments" ON expense_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on monthly_budgets" ON monthly_budgets FOR ALL USING (true) WITH CHECK (true);
