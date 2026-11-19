import type { APIRoute } from 'astro';
import { checkCredentials, createSession, rateLimited, clearAttempts } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress, url }) => {
  const form = await request.formData();
  const next = String(form.get('next') || '/admin/');
  const safeNext = next.startsWith('/admin') ? next : '/admin/';
  const ip = clientAddress || 'unknown';
  if (rateLimited(ip)) return redirect('/admin/login/?error=locked', 303);
  if (!checkCredentials(String(form.get('username') ?? ''), String(form.get('password') ?? ''))) {
    return redirect(`/admin/login/?error=invalid&next=${encodeURIComponent(safeNext)}`, 303);
  }
  clearAttempts(ip);
  createSession(cookies, url.protocol === 'https:');
  return redirect(safeNext, 303);
};
