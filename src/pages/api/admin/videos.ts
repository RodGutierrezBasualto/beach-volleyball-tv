import type { APIRoute } from 'astro';
import { saveVideos } from '../../../lib/content';
import { cleanVideos } from '../../../lib/validate';

export const PUT: APIRoute = async ({ request }) => {
  const { videos: input } = await request.json();
  const { videos, errors } = cleanVideos(input);
  if (errors.length) return Response.json({ errors }, { status: 422 });
  await saveVideos(videos);
  return Response.json({ count: videos.length });
};
