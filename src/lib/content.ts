/**
 * Content store: events, news, videos and the uploaded-photo registry.
 *
 * Content is held in memory for fast page rendering and persisted through
 * the storage backend (local files or a GitHub repository — see storage.ts). Every
 * request calls ensureContent() (via middleware) before reading. Saves go to
 * storage first, then memory, one at a time.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { EventItem } from '../data/events';
import type { Article } from '../data/news';
import type { Video } from '../data/videos';
import { images as builtInImages } from '../data/images';
import { blocksToDoc, docImages } from './rich';
import { backend, BUNDLED_DIR } from './storage';

export { UPLOAD_DIR } from './storage';

export interface ImageEntry {
  widths: number[];
  ratio: number;
  /** URL folder. Built-in images live in /images, uploads in /uploads. */
  dir?: string;
  ext?: 'webp' | 'jpg';
  /** When it was uploaded (ms). Used to tidy up photos that were never used. */
  uploadedAt?: number;
}

type Collections = {
  'events.json': EventItem[];
  'news.json': Article[];
  'videos.json': Video[];
  'images.json': Record<string, ImageEntry>;
};
type File = keyof Collections;
const FILES: File[] = ['events.json', 'news.json', 'videos.json', 'images.json'];
const EMPTY: Collections = { 'events.json': [], 'news.json': [], 'videos.json': [], 'images.json': {} };

/* ---------- Loading ---------- */
const mem: Partial<Collections> = {};
const memMtime: Partial<Record<File, number>> = {};
let loading: Promise<void> | null = null;

async function seedFromBundle(missing: File[]) {
  // Remote storage without content yet: copy in the starter content (and its photos).
  for (const file of missing) {
    let data: unknown = EMPTY[file];
    try { data = JSON.parse(fs.readFileSync(path.join(BUNDLED_DIR, file), 'utf8')); } catch {}
    if (file === 'images.json') {
      for (const [name, entry] of Object.entries(data as Record<string, ImageEntry>)) {
        for (const w of entry.widths) {
          const filename = `${name}-${w}.${entry.ext ?? 'webp'}`;
          const p = path.join(BUNDLED_DIR, 'uploads', filename);
          if (fs.existsSync(p)) await backend.putUpload(filename, fs.readFileSync(p));
        }
      }
    }
    await backend.write(file, data);
    (mem as Record<File, unknown>)[file] = data;
  }
  if (missing.length) console.log(`[content] Seeded ${missing.join(', ')} from the starter content.`);
}

async function load() {
  const missing: File[] = [];
  for (const file of FILES) {
    if (backend.mtime) {
      // Local files: reload only when changed on disk.
      const m = backend.mtime(file);
      if (m && m === memMtime[file] && mem[file]) continue;
      memMtime[file] = m;
    } else if (mem[file]) continue; // Remote storage: load once; this server is the only writer.
    const data = await backend.read(file);
    if (data === undefined) {
      if (backend.kind !== 'local') missing.push(file);
      else (mem as Record<File, unknown>)[file] = EMPTY[file];
    } else (mem as Record<File, unknown>)[file] = data;
  }
  if (missing.length) await seedFromBundle(missing);
}

/** Makes sure content is loaded. Called by the middleware on every request. */
export async function ensureContent() {
  if (backend.kind !== 'local' && FILES.every((f) => mem[f])) return;
  loading ??= load().finally(() => (loading = null));
  await loading;
}

function read<F extends File>(file: F): Collections[F] {
  return (mem[file] ?? EMPTY[file]) as Collections[F];
}

/* ---------- Writing (serialised) ---------- */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}
async function write<F extends File>(file: F, data: Collections[F]) {
  await backend.write(file, data);
  (mem as Record<File, unknown>)[file] = data;
  if (backend.mtime) memMtime[file] = backend.mtime(file);
}
const clone = <T>(v: T): T => structuredClone(v);

/* ---------- Reads ---------- */
export function getEvents({ includeDrafts = false } = {}): EventItem[] {
  const list = read('events.json');
  return (includeDrafts ? list : list.filter((e) => !e.draft)).slice().sort((a, b) => a.date.localeCompare(b.date));
}

/** Stories saved in the old block format are converted on the fly. */
function normalise(a: Article & { body?: Parameters<typeof blocksToDoc>[0] }): Article {
  if (a.content || !a.body) return a;
  const { body, ...rest } = a;
  return { ...rest, content: blocksToDoc(body) };
}

export function getArticles({ includeDrafts = false } = {}): Article[] {
  const list = read('news.json').map(normalise);
  return (includeDrafts ? list : list.filter((a) => !a.draft)).slice().sort((a, b) => b.date.localeCompare(a.date));
}

export const getVideos = (): Video[] => read('videos.json');
export const getUploadedImages = (): Record<string, ImageEntry> => read('images.json');
export const imageRegistry = (): Record<string, ImageEntry> => ({ ...builtInImages, ...getUploadedImages() });
/** URL folder for uploaded photos (always served by this site at /uploads). */
export const uploadsBase = () => '/uploads';

/* Uploaded photos never change (unique names), so keep recently used ones in memory. */
const photoCache = new Map<string, Buffer>();
let photoCacheBytes = 0;
export async function getUpload(filename: string): Promise<Buffer | null> {
  const hit = photoCache.get(filename);
  if (hit) return hit;
  const body = await backend.getUpload(filename);
  if (body && backend.kind !== 'local') {
    photoCache.set(filename, body);
    photoCacheBytes += body.length;
    for (const [k, v] of photoCache) {
      if (photoCacheBytes <= 80e6) break; // ~80 MB cap
      photoCache.delete(k);
      photoCacheBytes -= v.length;
    }
  }
  return body;
}

export const getEvent = (slug: string, includeDrafts = false) => getEvents({ includeDrafts }).find((e) => e.slug === slug);
export const getArticle = (slug: string, includeDrafts = false) => getArticles({ includeDrafts }).find((a) => a.slug === slug);
export const getVideo = (youtubeId: string) => getVideos().find((v) => v.youtubeId === youtubeId);
export const featuredArticle = () => {
  const list = getArticles();
  return list.find((a) => a.featured) ?? list[0];
};
export const featuredVideo = () => {
  const list = getVideos();
  return list.find((v) => v.featured) ?? list[0];
};

/* ---------- Slugs ---------- */
export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'item'
  );
}

function uniqueSlug(base: string, taken: Set<string>) {
  taken.add('new'); // reserved for the admin's "add new" pages
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/* ---------- Writes ---------- */
export const saveEvent = (item: EventItem, originalSlug?: string) =>
  serial(async () => {
    const list = clone(read('events.json'));
    const idx = originalSlug ? list.findIndex((e) => e.slug === originalSlug) : -1;
    const taken = new Set(list.filter((_, i) => i !== idx).map((e) => e.slug));
    // Keep an existing item's web address stable when its title changes.
    item.slug = idx >= 0 ? list[idx].slug : uniqueSlug(slugify(item.slug || item.title), taken);
    const previousImage = idx >= 0 ? list[idx].image : undefined;
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    await write('events.json', list);
    if (previousImage && previousImage !== item.image) await removeIfUnused(previousImage);
    return item.slug;
  });

export const deleteEvents = (slugs: string[]) =>
  serial(async () => {
    const list = read('events.json');
    const removed = list.filter((e) => slugs.includes(e.slug));
    await write('events.json', list.filter((e) => !slugs.includes(e.slug)));
    for (const e of removed) await removeIfUnused(e.image);
    return removed.length;
  });

export const saveArticle = (item: Article, originalSlug?: string) =>
  serial(async () => {
    const list = clone(read('news.json'));
    const idx = originalSlug ? list.findIndex((a) => a.slug === originalSlug) : -1;
    const taken = new Set(list.filter((_, i) => i !== idx).map((a) => a.slug));
    // Keep an existing story's web address stable when its headline changes.
    item.slug = idx >= 0 ? list[idx].slug : uniqueSlug(slugify(item.slug || item.title), taken);
    const previous = idx >= 0 ? articleImages(list[idx]) : [];
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    await write('news.json', list);
    const now = new Set(articleImages(item));
    for (const img of previous) if (!now.has(img)) await removeIfUnused(img);
    return item.slug;
  });

export const deleteArticles = (slugs: string[]) =>
  serial(async () => {
    const list = read('news.json');
    const removed = list.filter((a) => slugs.includes(a.slug));
    await write('news.json', list.filter((a) => !slugs.includes(a.slug)));
    for (const img of removed.flatMap(articleImages)) await removeIfUnused(img);
    return removed.length;
  });

export const saveVideos = (list: Video[]) => serial(() => write('videos.json', list));

/* ---------- Uploaded images ---------- */
function articleImages(a: Article) {
  return [a.image, ...docImages(normalise(a).content)];
}

/** Stores an uploaded photo's files and registers it. */
export const storeUpload = (name: string, files: { width: number; body: Buffer }[], entry: Omit<ImageEntry, 'uploadedAt' | 'dir'>) =>
  serial(async () => {
    const ext = entry.ext ?? 'webp';
    for (const f of files) await backend.putUpload(`${name}-${f.width}.${ext}`, f.body);
    const reg = clone(read('images.json'));
    reg[name] = { ...entry, dir: '/uploads', uploadedAt: Date.now() };
    await write('images.json', reg);
  });

/** Deletes an uploaded photo once nothing references it any more. */
async function removeIfUnused(name: string) {
  const entry = read('images.json')[name];
  if (!entry) return; // built-in images are never deleted
  const used =
    read('events.json').some((e) => e.image === name) ||
    read('news.json').some((a) => articleImages(a).includes(name)) ||
    read('videos.json').some((v) => v.image === name);
  if (used) return;
  await backend.deleteUploads(entry.widths.map((w) => `${name}-${w}.${entry.ext ?? 'webp'}`));
  const next = clone(read('images.json'));
  delete next[name];
  await write('images.json', next);
}

export const removeImageIfUnused = (name: string) => serial(() => removeIfUnused(name));

/**
 * Removes uploaded photos that were never saved into any event/story/video
 * (e.g. uploaded, then the editor was closed). Only touches photos older than
 * a day, so photos in an editor that's still open are safe.
 */
export const sweepUnusedUploads = () =>
  serial(async () => {
    const cutoff = Date.now() - 24 * 3600e3;
    for (const [name, entry] of Object.entries(read('images.json'))) {
      if ((entry.uploadedAt ?? 0) < cutoff) await removeIfUnused(name);
    }
  });
