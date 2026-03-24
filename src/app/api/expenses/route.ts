import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { createExpenseSchema, updateExpenseSchema, deleteExpenseSchema, deactivateExpenseSchema } from '../../../lib/validation';

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
  'credit_card_id', 'type', 'start_month', 'start_year', 'duration_months',
  'is_active', 'end_month', 'end_year',
]);

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, from_month, from_year, ...rawUpdates } = parsed.data;

    // Versioned edit for fixed expenses: close old, create new from this month
    if (from_month && from_year) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Get the current expense
        const { rows: [oldExpense] } = await client.query(
          'SELECT * FROM expenses WHERE id = $1',
          [id],
        );
        if (!oldExpense) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Close the old expense at this month
        await client.query(
          'UPDATE expenses SET end_month = $2, end_year = $3 WHERE id = $1',
          [id, from_month, from_year],
        );

        // Build the new expense with updated fields
        const newData = {
          name: rawUpdates.name ?? oldExpense.name,
          description: rawUpdates.description ?? oldExpense.description,
          amount: rawUpdates.amount ?? oldExpense.amount,
          currency_id: rawUpdates.currency_id ?? oldExpense.currency_id,
          category_id: rawUpdates.category_id !== undefined ? rawUpdates.category_id : oldExpense.category_id,
          credit_card_id: rawUpdates.credit_card_id !== undefined ? rawUpdates.credit_card_id : oldExpense.credit_card_id,
          type: rawUpdates.type ?? oldExpense.type,
          start_month: from_month,
          start_year: from_year,
          duration_months: rawUpdates.duration_months !== undefined ? rawUpdates.duration_months : oldExpense.duration_months,
        };

        const { rows: [newExpense] } = await client.query(
          `INSERT INTO expenses (name, description, amount, currency_id, category_id, credit_card_id, type, start_month, start_year, duration_months)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [newData.name, newData.description, newData.amount, newData.currency_id, newData.category_id, newData.credit_card_id, newData.type, newData.start_month, newData.start_year, newData.duration_months],
        );

        // Migrate payment record for this month from old to new expense
        await client.query(
          'UPDATE expense_payments SET expense_id = $1 WHERE expense_id = $2 AND month = $3 AND year = $4',
          [newExpense.id, id, from_month, from_year],
        );

        await client.query('COMMIT');
        return NextResponse.json(parseRow(newExpense));
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Regular in-place update (non-fixed expenses, or deactivation)
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
