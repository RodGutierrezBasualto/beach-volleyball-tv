/**
 * Content store: events, news, videos, editable pages (home, about) and the uploaded-photo registry.
 *
 * Content is held in memory for fast page rendering and persisted through
 * the storage backend (local files, or the GitHub repository on Cloudflare —
 * see storage.ts). The middleware calls ensureContent() before pages read.
 * Public pages are built ahead of time from the local files; the admin runs on
 * Cloudflare, where every request reloads the latest content from GitHub and
 * every save is one commit. Saves run one at a time.
 */
import type { EventItem } from '../data/events';
import type { Article } from '../data/news';
import type { Video } from '../data/videos';
import { pages, type PageContents, type PageName } from '../data/pages';
import { images as builtInImages } from '../data/images';
import { blocksToDoc, docImages } from './rich';
import { getBackend } from './storage';

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
} & { [N in PageName as `${N}.json`]: Partial<PageContents[N]> };
type File = keyof Collections;
const PAGE_NAMES = Object.keys(pages) as PageName[];
const pageFile = <N extends PageName>(name: N) => `${name}.json` as `${N}.json`;
const FILES: File[] = ['events.json', 'news.json', 'videos.json', 'images.json', ...PAGE_NAMES.map(pageFile)];
const EMPTY = { 'events.json': [], 'news.json': [], 'videos.json': [], 'images.json': {}, ...Object.fromEntries(PAGE_NAMES.map((n) => [pageFile(n), {}])) } as unknown as Collections;

/* ---------- Loading ---------- */
const mem: Partial<Collections> = {};
const memMtime: Partial<Record<File, number>> = {};
let loading: Promise<void> | null = null;

async function load(force = false) {
  const backend = getBackend();
  await Promise.all(
    FILES.map(async (file) => {
      if (backend.mtime) {
        // Local files: reload only when changed on disk.
        const m = backend.mtime(file);
        if (!force && m && m === memMtime[file] && mem[file]) return;
        memMtime[file] = m;
      }
      const data = await backend.read(file);
      (mem as Record<File, unknown>)[file] = data === undefined ? EMPTY[file] : data;
    }),
  );
}

/**
 * Makes sure content is loaded. Called by the middleware. On Cloudflare the
 * server can run in several places at once, so it always reads the latest copy.
 */
export async function ensureContent() {
  loading ??= load().finally(() => (loading = null));
  await loading;
}

function read<F extends File>(file: F): Collections[F] {
  return (mem[file] ?? EMPTY[file]) as Collections[F];
}

/* ---------- Writing (serialised) ---------- */
let queue: Promise<unknown> = Promise.resolve();
/** Runs a change on the freshest content, then saves everything it touched as one commit. */
function serial<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const backend = getBackend();
    try {
      if (backend.kind === 'github') await load(true);
      const result = await fn();
      await backend.commit(`Website admin: ${label}`);
      return result;
    } catch (err) {
      backend.discard();
      throw err;
    }
  });
  queue = run.catch(() => {});
  return run;
}
async function write<F extends File>(file: F, data: Collections[F]) {
  const backend = getBackend();
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

/** An editable page's content: what was saved in the admin, with defaults for anything missing. */
export function getPage<N extends PageName>(name: N): PageContents[N] {
  const saved = read(pageFile(name)) as Record<string, object>;
  const page = clone(pages[name].defaults) as PageContents[N];
  for (const [key, section] of Object.entries(page)) Object.assign(section, saved[key]);
  return page;
}
export const getHome = () => getPage('home');

/** Photos used by a page: every value of a field named photo, photoA, photoB… */
function pageImages(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([k, v]) => (typeof v === 'string' ? (/^photo[A-Z]?$/.test(k) && v ? [v] : []) : pageImages(v)));
}
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
  const backend = getBackend();
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
  serial('update events', async () => {
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
  serial('delete events', async () => {
    const list = read('events.json');
    const removed = list.filter((e) => slugs.includes(e.slug));
    await write('events.json', list.filter((e) => !slugs.includes(e.slug)));
    for (const e of removed) await removeIfUnused(e.image);
    return removed.length;
  });

export const saveArticle = (item: Article, originalSlug?: string) =>
  serial('update news', async () => {
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
  serial('delete news', async () => {
    const list = read('news.json');
    const removed = list.filter((a) => slugs.includes(a.slug));
    await write('news.json', list.filter((a) => !slugs.includes(a.slug)));
    for (const img of removed.flatMap(articleImages)) await removeIfUnused(img);
    return removed.length;
  });

export const saveVideos = (list: Video[]) => serial('update videos', () => write('videos.json', list));

export const savePage = <N extends PageName>(name: N, content: PageContents[N]) =>
  serial(`update ${name} page`, async () => {
    const previous = pageImages(read(pageFile(name)));
    await write(pageFile(name), content as Collections[`${N}.json`]);
    const now = new Set(pageImages(content));
    for (const img of previous) if (!now.has(img)) await removeIfUnused(img);
  });

/* ---------- Uploaded images ---------- */
function articleImages(a: Article) {
  return [a.image, ...docImages(normalise(a).content)];
}

/** Stores an uploaded photo's files and registers it. */
export const storeUpload = (name: string, files: { width: number; body: Buffer }[], entry: Omit<ImageEntry, 'uploadedAt' | 'dir'>) =>
  serial('add photo', async () => {
    const backend = getBackend();
    const ext = entry.ext ?? 'webp';
    for (const f of files) await backend.putUpload(`${name}-${f.width}.${ext}`, f.body);
    const reg = clone(read('images.json'));
    reg[name] = { ...entry, dir: '/uploads', uploadedAt: Date.now() };
    await write('images.json', reg);
  });

const isUnused = (name: string) =>
  !(
    read('events.json').some((e) => e.image === name) ||
    read('news.json').some((a) => articleImages(a).includes(name)) ||
    read('videos.json').some((v) => v.image === name) ||
    PAGE_NAMES.some((p) => pageImages(read(pageFile(p))).includes(name))
  );

/** Deletes an uploaded photo once nothing references it any more. */
async function removeIfUnused(name: string) {
  const entry = read('images.json')[name];
  if (!entry) return; // built-in images are never deleted
  if (!isUnused(name)) return;
  await getBackend().deleteUploads(entry.widths.map((w) => `${name}-${w}.${entry.ext ?? 'webp'}`));
  const next = clone(read('images.json'));
  delete next[name];
  await write('images.json', next);
}

export const removeImageIfUnused = (name: string) => serial('remove unused photo', () => removeIfUnused(name));

/**
 * Removes uploaded photos that were never saved into any event/story/video/page
 * (e.g. uploaded, then the editor was closed). Only touches photos older than
 * a day, so photos in an editor that's still open are safe.
 */
export const sweepUnusedUploads = async () => {
  const cutoff = Date.now() - 24 * 3600e3;
  const stale = () => Object.entries(read('images.json')).filter(([name, entry]) => (entry.uploadedAt ?? 0) < cutoff && isUnused(name));
  if (!stale().length) return; // nothing to do — skip the save
  await serial('remove unused photos', async () => {
    for (const [name] of stale()) await removeIfUnused(name);
  });
};
