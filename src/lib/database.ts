import type {
  Currency, Category, CreditCard, Expense,
  ExpensePayment, MonthlyBudget, ExpenseWithDetails,
} from './types';
import { isExpenseInMonth, getInstallmentNumber } from './types';

const BASE = '';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const body = await res.json();
      if (body?.error && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // response wasn't JSON, use generic message
    }
    throw new Error(message);
  }
  return res.json();
}

// ── Currencies ──

export async function getCurrencies(): Promise<Currency[]> {
  return api('/api/currencies');
}

export async function addCurrency(code: string, name: string, symbol: string): Promise<Currency> {
  return api('/api/currencies', {
    method: 'POST',
    body: JSON.stringify({ code, name, symbol }),
  });
}

export async function deleteCurrency(id: number): Promise<void> {
  await api('/api/currencies', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ── Categories ──

export async function getCategories(): Promise<Category[]> {
  return api('/api/categories');
}

export async function addCategory(name: string): Promise<Category> {
  return api('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await api('/api/categories', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ── Credit Cards ──

export async function getCreditCards(): Promise<CreditCard[]> {
  return api('/api/credit-cards');
}

export async function addCreditCard(name: string): Promise<CreditCard> {
  return api('/api/credit-cards', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteCreditCard(id: number): Promise<void> {
  await api('/api/credit-cards', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ── Expenses ──

export async function getAllExpenses(): Promise<Expense[]> {
  return api('/api/expenses');
}

export function getExpensesForMonth(
  allExpenses: Expense[],
  currencies: Currency[],
  categories: Category[],
  creditCards: CreditCard[],
  month: number,
  year: number,
): ExpenseWithDetails[] {
  const currencyMap = new Map(currencies.map(c => [c.id, c]));
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const creditCardMap = new Map(creditCards.map(c => [c.id, c]));

  return allExpenses
    .filter(e => isExpenseInMonth(e, month, year))
    .map(e => ({
      ...e,
      currency: currencyMap.get(e.currency_id),
      category: e.category_id ? categoryMap.get(e.category_id) : undefined,
      credit_card: e.credit_card_id ? creditCardMap.get(e.credit_card_id) : undefined,
      installment_number: e.type === 'installment' ? getInstallmentNumber(e, month, year) : undefined,
    }));
}

export async function createExpense(expense: {
  name: string;
  description: string;
  amount: number;
  currency_id: number;
  category_id: number | null;
  credit_card_id: number | null;
  type: string;
  start_month: number;
  start_year: number;
  duration_months: number | null;
}): Promise<Expense> {
  return api('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export async function updateExpense(
  id: number,
  updates: Partial<Expense>,
  fromMonth?: number,
  fromYear?: number,
): Promise<Expense> {
  return api('/api/expenses', {
    method: 'PUT',
    body: JSON.stringify({
      id,
      ...updates,
      ...(fromMonth && fromYear ? { from_month: fromMonth, from_year: fromYear } : {}),
    }),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await api('/api/expenses', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function deactivateExpense(id: number, month: number, year: number): Promise<void> {
  await api('/api/expenses', {
    method: 'PUT',
    body: JSON.stringify({ id, end_month: month, end_year: year }),
  });
}

// ── Payments ──

export async function getPaymentsForMonth(month: number, year: number): Promise<ExpensePayment[]> {
  return api(`/api/payments?month=${month}&year=${year}`);
}

export async function togglePayment(
  expenseId: number,
  month: number,
  year: number,
  isPaid: boolean,
): Promise<ExpensePayment> {
  return api('/api/payments', {
    method: 'POST',
    body: JSON.stringify({ expense_id: expenseId, month, year, is_paid: isPaid }),
  });
}

// ── Budgets ──

export async function getBudgetsForMonth(month: number, year: number): Promise<MonthlyBudget[]> {
  return api(`/api/budgets?month=${month}&year=${year}`);
}

export async function setBudget(
  currencyId: number,
  month: number,
  year: number,
  amount: number,
): Promise<MonthlyBudget> {
  return api('/api/budgets', {
    method: 'POST',
    body: JSON.stringify({ currency_id: currencyId, month, year, amount }),
  });
}
