import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { upsertBudgetSchema, monthYearSchema } from '../../../lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = monthYearSchema.safeParse({
      month: searchParams.get('month'),
      year: searchParams.get('year'),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const { rows } = await pool.query(
      'SELECT * FROM monthly_budgets WHERE month = $1 AND year = $2',
      [parsed.data.month, parsed.data.year],
    );
    return NextResponse.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
  } catch (err) {
    console.error('GET /api/budgets error:', err);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const d = parsed.data;
    const { rows } = await pool.query(
      `INSERT INTO monthly_budgets (currency_id, month, year, amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (currency_id, month, year)
       DO UPDATE SET amount = $4
       RETURNING *`,
      [d.currency_id, d.month, d.year, d.amount],
    );
    return NextResponse.json({ ...rows[0], amount: Number(rows[0].amount) });
  } catch (err) {
    console.error('POST /api/budgets error:', err);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}
