import type { APIRoute } from 'astro';
import { saveArticle, deleteArticles } from '../../../lib/content';
import { cleanArticle } from '../../../lib/validate';

export const POST: APIRoute = async ({ request }) => {
  const { item: input, originalSlug } = await request.json();
  const { item, errors } = cleanArticle(input ?? {});
  if (errors.length) return Response.json({ errors }, { status: 422 });
  const slug = await saveArticle(item, typeof originalSlug === 'string' ? originalSlug : undefined);
  return Response.json({ slug });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { slugs } = await request.json();
  if (!Array.isArray(slugs) || !slugs.length) return Response.json({ errors: ['Nothing selected.'] }, { status: 400 });
  return Response.json({ deleted: await deleteArticles(slugs.map(String)) });
};
