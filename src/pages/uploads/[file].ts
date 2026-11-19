import type { APIRoute } from 'astro';
import { getUpload } from '../../lib/content';

export const prerender = false;

const TYPES = { webp: 'image/webp', jpg: 'image/jpeg' } as const;

/** Serves photos uploaded through the admin (from disk, or from the GitHub repo). */
export const GET: APIRoute = async ({ params }) => {
  const file = params.file ?? '';
  const m = file.match(/^[a-z0-9-]+\.(webp|jpg)$/);
  if (!m) return new Response('Not found', { status: 404 });
  const body = await getUpload(file);
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': TYPES[m[1] as keyof typeof TYPES], 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
