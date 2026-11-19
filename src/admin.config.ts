/**
 * Admin login.
 *
 * Set ADMIN_USER, ADMIN_PASSWORD (and SESSION_SECRET) as settings on your host
 * — see .env.example. The default password below only works for local testing:
 * once deployed on Cloudflare (or with GITHUB_TOKEN set), logins are refused
 * until ADMIN_PASSWORD is set, because this file is in Git.
 *
 * Read through functions (not at import time) because Cloudflare only provides
 * its settings while a request is being handled.
 */
import { env } from './lib/env';
import { isWorkers } from './lib/storage';

export function adminConfig() {
  return {
    username: env('ADMIN_USER') ?? 'admin',
    password: env('ADMIN_PASSWORD') ?? 'BondiSand2026!',
    /** True when a real password has been set on the host. */
    passwordFromEnv: !!env('ADMIN_PASSWORD'),
    /** Deployed sites must set their own password. */
    requirePasswordFromEnv: isWorkers() || !!env('GITHUB_TOKEN'),
    /** How long a login lasts. */
    sessionDays: 7,
  };
}

export function loginDisabled() {
  const c = adminConfig();
  return c.requirePasswordFromEnv && !c.passwordFromEnv;
}
