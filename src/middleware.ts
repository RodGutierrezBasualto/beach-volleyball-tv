import { defineMiddleware } from 'astro:middleware';
import { isValidSession, SESSION_COOKIE } from './lib/auth';
import { ensureContent } from './lib/content';

const PUBLIC_ADMIN = ['/admin/login', '/api/admin/login'];

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin navigations from some browsers omit it
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = [request.headers.get('host'), ...(request.headers.get('x-forwarded-host') ?? '').split(',')]
    .map((h) => h?.trim())
    .filter(Boolean);
  return allowed.includes(host);
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  // Public pages are built ahead of time (no cookies, no admin). Only the admin
  // and the photo fallback run on the server at request time.
  if (ctx.isPrerendered) {
    ctx.locals.isAdmin = false;
    await ensureContent();
    return next();
  }
  if (!pathname.startsWith('/uploads/') && !PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) await ensureContent();
  ctx.locals.isAdmin = isValidSession(ctx.cookies.get(SESSION_COOKIE)?.value);

  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminArea) {
    // Block cross-site form posts / API calls to the admin.
    if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD' && !sameOrigin(ctx.request)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (!ctx.locals.isAdmin && !PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) {
      if (pathname.startsWith('/api/')) return Response.json({ error: 'Please log in again.' }, { status: 401 });
      return ctx.redirect(`/admin/login/?next=${encodeURIComponent(pathname)}`);
    }
  }

  const res = await next();
  if (isAdminArea) {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
});
