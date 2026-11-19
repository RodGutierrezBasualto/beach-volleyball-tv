import type { APIRoute } from 'astro';
import { parseYouTubeId } from '../../../lib/validate';

export const prerender = false;

/** Looks up a YouTube video's title from a pasted link (via YouTube oEmbed). */
export const GET: APIRoute = async ({ url }) => {
  const youtubeId = parseYouTubeId(url.searchParams.get('url') ?? '');
  if (!youtubeId) return Response.json({ error: 'That doesn’t look like a YouTube link.' }, { status: 400 });
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return Response.json({ youtubeId, title: String(data.title ?? '') });
  } catch {
    // Still usable — the admin can type the title in.
    return Response.json({ youtubeId, title: '' });
  }
};
