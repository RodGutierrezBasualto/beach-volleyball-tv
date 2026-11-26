import type { APIRoute } from 'astro';
import { savePage } from '../../../../lib/content';
import { cleanPage } from '../../../../lib/validate';
import { isPageName } from '../../../../data/pages';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const name = params.name ?? '';
  if (!isPageName(name)) return Response.json({ errors: ['Unknown page.'] }, { status: 404 });
  const { item } = await request.json();
  const { content, errors } = cleanPage(name, item);
  if (errors.length) return Response.json({ errors }, { status: 422 });
  await savePage(name, content);
  return Response.json({ redirect: `/admin/${name}/?saved=1` });
};
