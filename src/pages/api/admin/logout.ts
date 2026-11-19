import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  destroySession(cookies);
  return redirect('/admin/login/?loggedout=1', 303);
};
