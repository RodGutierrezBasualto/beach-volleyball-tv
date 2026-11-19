import type { APIRoute } from 'astro';
import { saveEvent, deleteEvents } from '../../../lib/content';
import { cleanEvent } from '../../../lib/validate';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { item: input, originalSlug } = await request.json();
  const { item, errors } = cleanEvent(input ?? {});
  if (errors.length) return Response.json({ errors }, { status: 422 });
  const slug = await saveEvent(item, typeof originalSlug === 'string' ? originalSlug : undefined);
  return Response.json({ slug });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { slugs } = await request.json();
  if (!Array.isArray(slugs) || !slugs.length) return Response.json({ errors: ['Nothing selected.'] }, { status: 400 });
  return Response.json({ deleted: await deleteEvents(slugs.map(String)) });
};
