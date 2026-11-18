import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';
import { adminConfig, loginDisabled } from '../admin.config';
import { env } from './env';

export const SESSION_COOKIE = 'bvtv_admin';
// Without SESSION_SECRET, a random secret is generated per server start
// (everyone is simply logged out after a restart).
const SECRET = env('SESSION_SECRET') || crypto.randomBytes(32).toString('hex');

const sign = (payload: string) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string) {
  if (loginDisabled) return false;
  const userOk = safeEqual(username.trim().toLowerCase(), adminConfig.username.toLowerCase());
  const passOk = safeEqual(password, adminConfig.password);
  return userOk && passOk;
}

export function createSession(cookies: AstroCookies, secure: boolean) {
  const expires = Date.now() + adminConfig.sessionDays * 864e5;
  const payload = `${adminConfig.username}.${expires}`;
  cookies.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure,
    expires: new Date(expires),
  });
}

export function destroySession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function isValidSession(token: string | undefined) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  if (!safeEqual(token.slice(i + 1), sign(payload))) return false;
  const expires = Number(payload.split('.').pop());
  return Number.isFinite(expires) && expires > Date.now();
}

/* Simple in-memory brute-force protection: 8 attempts per 10 minutes per IP. */
const attempts = new Map<string, { count: number; until: number }>();
export function rateLimited(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.until < now) {
    attempts.set(ip, { count: 1, until: now + 10 * 60e3 });
    return false;
  }
  rec.count++;
  return rec.count > 8;
}
export const clearAttempts = (ip: string) => attempts.delete(ip);
