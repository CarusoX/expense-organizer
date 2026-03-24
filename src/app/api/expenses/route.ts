import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { createExpenseSchema, updateExpenseSchema, deleteExpenseSchema } from '../../../lib/validation';

function parseRow(row: Record<string, unknown>) {
  return { ...row, amount: Number(row.amount) };
}

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses ORDER BY created_at');
    return NextResponse.json(rows.map(parseRow));
  } catch (err) {
    console.error('GET /api/expenses error:', err);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const d = parsed.data;
    const { rows } = await pool.query(
      `INSERT INTO expenses (name, description, amount, currency_id, category_id, credit_card_id, type, start_month, start_year, duration_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [d.name, d.description, d.amount, d.currency_id, d.category_id, d.credit_card_id, d.type, d.start_month, d.start_year, d.duration_months],
    );
    return NextResponse.json(parseRow(rows[0]), { status: 201 });
  } catch (err) {
    console.error('POST /api/expenses error:', err);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'description', 'amount', 'currency_id', 'category_id',
  'credit_card_id', 'type', 'start_month', 'start_year', 'duration_months', 'is_active',
]);

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, ...rawUpdates } = parsed.data;
    const entries = Object.entries(rawUpdates).filter(
      ([k, v]) => ALLOWED_UPDATE_FIELDS.has(k) && v !== undefined,
    );

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(', ');

    const { rows } = await pool.query(
      `UPDATE expenses SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(parseRow(rows[0]));
  } catch (err) {
    console.error('PUT /api/expenses error:', err);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = deleteExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const { rowCount } = await pool.query('DELETE FROM expenses WHERE id = $1', [parsed.data.id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/expenses error:', err);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
