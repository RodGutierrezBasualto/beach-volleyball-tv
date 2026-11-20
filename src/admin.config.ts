/**
 * Admin login.
 *
 * Set ADMIN_USER, ADMIN_PASSWORD (and SESSION_SECRET) as settings on your host
 * — see .env.example. There is no default password: logins are refused until
 * ADMIN_PASSWORD is set (on Cloudflare, or in .env for local testing).
 *
 * Read through functions (not at import time) because Cloudflare only provides
 * its settings while a request is being handled.
 */
import { env } from './lib/env';

export function adminConfig() {
  return {
    username: env('ADMIN_USER') ?? 'admin',
    password: env('ADMIN_PASSWORD') ?? '',
    /** True when a real password has been set on the host. */
    passwordFromEnv: !!env('ADMIN_PASSWORD'),
    /** Always true: there is no built-in password. */
    requirePasswordFromEnv: true,
    /** How long a login lasts. */
    sessionDays: 7,
  };
}

export function loginDisabled() {
  const c = adminConfig();
  return c.requirePasswordFromEnv && !c.passwordFromEnv;
}
