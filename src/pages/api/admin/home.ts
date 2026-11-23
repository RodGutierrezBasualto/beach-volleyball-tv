import type { APIRoute } from 'astro';
import { saveHome } from '../../../lib/content';
import { cleanHome } from '../../../lib/validate';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { item } = await request.json();
  const { home, errors } = cleanHome(item);
  if (errors.length) return Response.json({ errors }, { status: 422 });
  await saveHome(home);
  return Response.json({ redirect: '/admin/home/?saved=1' });
};
