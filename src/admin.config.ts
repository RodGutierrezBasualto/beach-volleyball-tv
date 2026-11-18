/**
 * Admin login.
 *
 * Set ADMIN_USER and ADMIN_PASSWORD (and SESSION_SECRET) as environment
 * variables on your host — see .env.example. The default password below only
 * works for local testing: once deployed (on Render, or with GITHUB_TOKEN
 * set), logins are refused until ADMIN_PASSWORD is set, because this file is
 * in Git.
 */
import { env } from './lib/env';

export const adminConfig = {
  username: env('ADMIN_USER') ?? 'admin',
  password: env('ADMIN_PASSWORD') ?? 'BondiSand2026!',
  /** True when a real password has been set on the host. */
  passwordFromEnv: !!env('ADMIN_PASSWORD'),
  /** Deployed sites must set their own password. (Render sets RENDER=true.) */
  requirePasswordFromEnv: !!env('GITHUB_TOKEN') || !!env('RENDER'),
  /** How long a login lasts. */
  sessionDays: 7,
};

export const loginDisabled = adminConfig.requirePasswordFromEnv && !adminConfig.passwordFromEnv;
