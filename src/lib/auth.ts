import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET ?? '';

export function generateSessionToken(): string {
  return crypto.createHmac('sha256', AUTH_SECRET).update('authenticated').digest('hex');
}

export function verifySessionToken(token: string): boolean {
  const expected = generateSessionToken();
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.AUTH_PASSWORD ?? '';
  if (!expected || !password) return false;
  if (password.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export const SESSION_COOKIE = 'expense_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
