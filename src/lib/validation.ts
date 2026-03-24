import { z } from 'zod';

// ── Shared field schemas ──

const id = z.number().int().positive();
const month = z.number().int().min(1).max(12);
const year = z.number().int().min(2000).max(2100);
const amount = z.number().positive().max(999_999_999_999);
const name = z.string().trim().min(1, 'Name is required').max(255);
const shortName = z.string().trim().min(1).max(100);
const description = z.string().max(2000).default('');

// ── Currencies ──

export const createCurrencySchema = z.object({
  code: z.string().trim().min(1).max(10).toUpperCase(),
  name: shortName,
  symbol: z.string().trim().min(1).max(10),
});

export const deleteCurrencySchema = z.object({ id });

// ── Categories ──

export const createCategorySchema = z.object({ name: shortName });
export const deleteCategorySchema = z.object({ id });

// ── Credit Cards ──

export const createCreditCardSchema = z.object({ name: shortName });
export const deleteCreditCardSchema = z.object({ id });

// ── Expenses ──

export const createExpenseSchema = z.object({
  name,
  description,
  amount,
  currency_id: id,
  category_id: id.nullable(),
  credit_card_id: id.nullable(),
  type: z.enum(['fixed', 'installment', 'singular']),
  start_month: month,
  start_year: year,
  duration_months: z.number().int().min(1).max(360).nullable(),
}).refine(
  data => data.type !== 'installment' || data.duration_months !== null,
  { message: 'duration_months is required for installment type', path: ['duration_months'] },
);

export const updateExpenseSchema = z.object({
  id,
  name: name.optional(),
  description: description.optional(),
  amount: amount.optional(),
  currency_id: id.optional(),
  category_id: id.nullable().optional(),
  credit_card_id: id.nullable().optional(),
  type: z.enum(['fixed', 'installment', 'singular']).optional(),
  start_month: month.optional(),
  start_year: year.optional(),
  duration_months: z.number().int().min(1).max(360).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const deleteExpenseSchema = z.object({ id });

// ── Payments ──

export const upsertPaymentSchema = z.object({
  expense_id: id,
  month,
  year,
  is_paid: z.boolean(),
});

// ── Budgets ──

export const upsertBudgetSchema = z.object({
  currency_id: id,
  month,
  year,
  amount: z.number().min(0).max(999_999_999_999),
});

// ── Query params ──

export const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
