import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { createCurrencySchema, deleteCurrencySchema } from '../../../lib/validation';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM currencies ORDER BY id');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/currencies error:', err);
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCurrencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { code, name, symbol } = parsed.data;
    const { rows } = await pool.query(
      'INSERT INTO currencies (code, name, symbol) VALUES ($1, $2, $3) RETURNING *',
      [code, name, symbol],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/currencies error:', err);
    return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = deleteCurrencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const { rowCount } = await pool.query('DELETE FROM currencies WHERE id = $1', [parsed.data.id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/currencies error:', err);
    return NextResponse.json({ error: 'Failed to delete currency' }, { status: 500 });
  }
}
