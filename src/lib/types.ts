export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface CreditCard {
  id: number;
  name: string;
}

export type ExpenseType = 'fixed' | 'installment' | 'singular';

export interface Expense {
  id: number;
  name: string;
  description: string;
  amount: number;
  currency_id: number;
  category_id: number | null;
  credit_card_id: number | null;
  type: ExpenseType;
  start_month: number;
  start_year: number;
  duration_months: number | null;
  is_active: boolean;
  end_month: number | null;
  end_year: number | null;
  created_at: string;
}

export interface ExpenseWithDetails extends Expense {
  currency?: Currency;
  category?: Category;
  credit_card?: CreditCard;
  installment_number?: number;
}

export interface ExpensePayment {
  id: number;
  expense_id: number;
  month: number;
  year: number;
  is_paid: boolean;
}

export interface MonthlyBudget {
  id: number;
  currency_id: number;
  amount: number;
  month: number;
  year: number;
}

export interface ExpenseFormData {
  name: string;
  description: string;
  amount: string;
  currency_id: number;
  category_id: number | null;
  credit_card_id: number | null;
  type: ExpenseType;
  start_month: number;
  start_year: number;
  duration_months: string;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isExpenseInMonth(expense: Expense, month: number, year: number): boolean {
  const targetAbs = year * 12 + month;
  const startAbs = expense.start_year * 12 + expense.start_month;

  // Check end date (first month where expense no longer appears)
  if (expense.end_month != null && expense.end_year != null) {
    const endAbs = expense.end_year * 12 + expense.end_month;
    if (targetAbs >= endAbs) return false;
  }

  switch (expense.type) {
    case 'fixed':
      return startAbs <= targetAbs;
    case 'installment':
      return startAbs <= targetAbs &&
        (startAbs + (expense.duration_months ?? 0) - 1) >= targetAbs;
    case 'singular':
      return expense.start_month === month && expense.start_year === year;
    default:
      return false;
  }
}

export function getInstallmentNumber(expense: Expense, month: number, year: number): number {
  const targetAbs = year * 12 + month;
  const startAbs = expense.start_year * 12 + expense.start_month;
  return targetAbs - startAbs + 1;
}
