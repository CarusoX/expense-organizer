import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { upsertPaymentSchema, monthYearSchema } from '../../../lib/validation';

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
      'SELECT * FROM expense_payments WHERE month = $1 AND year = $2',
      [parsed.data.month, parsed.data.year],
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const d = parsed.data;
    const { rows } = await pool.query(
      `INSERT INTO expense_payments (expense_id, month, year, is_paid)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (expense_id, month, year)
       DO UPDATE SET is_paid = $4
       RETURNING *`,
      [d.expense_id, d.month, d.year, d.is_paid],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('POST /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
