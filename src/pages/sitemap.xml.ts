import type { APIRoute } from 'astro';
import { getEvents, getArticles } from '../lib/content';

export const GET: APIRoute = ({ site }) => {
  const events = getEvents();
  const articles = getArticles();
  const base = site?.href.replace(/\/$/, '') ?? 'https://beachvolleyballtv.com.au';
  const paths = [
    '/', '/events/', '/news/', '/youtube/', '/contact/',
    ...events.map((e) => `/events/${e.slug}/`),
    ...articles.map((a) => `/news/${a.slug}/`),
  ];
  const lastmod: Record<string, string> = Object.fromEntries(articles.map((a) => [`/news/${a.slug}/`, a.date]));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${base}${p}</loc>${lastmod[p] ? `<lastmod>${lastmod[p]}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
