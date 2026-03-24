import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = generateSessionToken();
    const res = NextResponse.json({ ok: true });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
