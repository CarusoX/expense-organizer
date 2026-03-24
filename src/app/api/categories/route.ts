import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { createCategorySchema, deleteCategorySchema } from '../../../lib/validation';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [parsed.data.name],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error('POST /api/categories error:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = deleteCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [parsed.data.id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/categories error:', err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
