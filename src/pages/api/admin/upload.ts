import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { storeUpload, slugify } from '../../../lib/content';

const MAX_BYTES = 6 * 1024 * 1024;

function detect(buf: Buffer): 'webp' | 'jpg' | null {
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  return null;
}

/**
 * Receives a photo already cropped and compressed in the browser, in two
 * sizes (large + small), and stores it (local disk or the GitHub repo).
 */
export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const large = form.get('large');
  const small = form.get('small');
  const wl = Number(form.get('widthLarge'));
  const ws = Number(form.get('widthSmall'));
  const ratio = Number(form.get('ratio'));
  if (!(large instanceof File) || !(small instanceof File)) return Response.json({ error: 'No image received.' }, { status: 400 });
  if (large.size > MAX_BYTES || small.size > MAX_BYTES) return Response.json({ error: 'That image is too large.' }, { status: 413 });
  if (![wl, ws].every((w) => Number.isInteger(w) && w >= 100 && w <= 2400) || !(ratio > 0.3 && ratio < 4)) {
    return Response.json({ error: 'Invalid image size.' }, { status: 400 });
  }
  const bufL = Buffer.from(await large.arrayBuffer());
  const bufS = Buffer.from(await small.arrayBuffer());
  const ext = detect(bufL);
  if (!ext || detect(bufS) !== ext) return Response.json({ error: 'Only photos (JPG, PNG, WebP) can be uploaded.' }, { status: 415 });

  const name = `u-${slugify(String(form.get('name') ?? 'image')).slice(0, 40)}-${crypto.randomBytes(3).toString('hex')}`;
  const files = wl === ws ? [{ width: wl, body: bufL }] : [{ width: ws, body: bufS }, { width: wl, body: bufL }];
  try {
    await storeUpload(name, files, { widths: files.map((f) => f.width), ratio: Math.round(ratio * 1e4) / 1e4, ext });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'The photo couldn’t be saved. Please try again.' }, { status: 502 });
  }
  const { img } = await import('../../../lib/utils');
  return Response.json({ name, url: img(name).largest });
};
