/**
 * Turns admin form input into clean content records, with friendly error
 * messages for anything missing or malformed.
 */
import type { EventItem, EventType } from '../data/events';
import { eventTypes } from '../data/events';
import type { Article, NewsCategory } from '../data/news';
import { newsCategories } from '../data/news';
import type { Video, VideoCategory } from '../data/videos';
import { videoCategories } from '../data/videos';
import { defaultHome, type HomeContent } from '../data/home';
import { imageRegistry } from './content';
import { cleanDoc, docHasContent, safeHref } from './rich';

type Input = Record<string, unknown>;

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v: unknown) => v === true || v === 'true' || v === 'on';
const lines = (v: unknown, max = 40) =>
  (Array.isArray(v) ? v : String(v ?? '').split('\n')).map((s) => str(s, 400)).filter(Boolean).slice(0, max);
const paragraphs = (v: unknown) =>
  (Array.isArray(v) ? v.map(String) : String(v ?? '').split(/\n\s*\n/)).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).slice(0, 40);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const YT_ID = /^[\w-]{11}$/;

export function parseYouTubeId(input: string) {
  const s = input.trim();
  if (YT_ID.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1, 12);
    if (u.searchParams.get('v')) return u.searchParams.get('v')!.slice(0, 11);
    const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/);
    if (m) return m[2];
  } catch {}
  return '';
}

function checkImage(name: string, errors: string[], label = 'Image') {
  if (name && !imageRegistry()[name]) errors.push(`${label} could not be found — please upload it again.`);
}

export function cleanEvent(input: Input): { item: EventItem; errors: string[] } {
  const errors: string[] = [];
  const type = str(input.type) as EventType;
  const item: EventItem = {
    slug: str(input.slug, 80),
    title: str(input.title, 120),
    type: eventTypes.some((t) => t.value === type) ? type : 'Community',
    date: str(input.date, 10),
    endDate: str(input.endDate, 10) || undefined,
    startTime: str(input.startTime, 5) || undefined,
    endTime: str(input.endTime, 5) || undefined,
    timeNote: str(input.timeNote, 120) || undefined,
    recurring: str(input.recurring, 60) || undefined,
    venue: str(input.venue, 120),
    suburb: str(input.suburb, 80),
    image: str(input.image, 120) || 'bv-ball-sand',
    imageAlt: str(input.imageAlt, 200),
    excerpt: str(input.excerpt, 300),
    description: paragraphs(input.description),
    price: str(input.price, 120),
    level: str(input.level, 120),
    format: str(input.format, 120) || undefined,
    includes: lines(input.includes),
    ctaLabel: str(input.ctaLabel, 40) || (str(input.cta) === 'enquire' ? 'Enquire now' : str(input.cta) === 'link' ? 'Find out more' : 'Register now'),
    cta: str(input.cta) === 'enquire' ? 'enquire' : str(input.cta) === 'link' ? 'link' : 'register',
    ctaUrl: safeHref(str(input.ctaUrl, 600)) ?? undefined,
    featured: bool(input.featured) || undefined,
    draft: bool(input.draft) || undefined,
  };
  if (!item.includes?.length) delete item.includes;
  if (!item.title) errors.push('Please add a title.');
  if (!isDate(item.date)) errors.push('Please choose the event date.');
  if (item.endDate && (!isDate(item.endDate) || item.endDate < item.date)) errors.push('The end date must be on or after the start date.');
  if ((item.startTime && !isTime(item.startTime)) || (item.endTime && !isTime(item.endTime))) errors.push('Please check the start and finish times.');
  if (!item.startTime && !item.timeNote) errors.push('Please set a start time, or add a time note (e.g. “Check Instagram to see if it’s on”).');
  if (item.cta === 'link' && !item.ctaUrl) errors.push('The sign-up button is set to open a web link — please paste the link (e.g. https://chat.whatsapp.com/…).');
  if (item.cta !== 'link') delete item.ctaUrl;
  if (!item.venue) errors.push('Please add the venue (e.g. “Bondi Beach, south end courts”).');
  if (!item.suburb) item.suburb = 'Bondi Beach, NSW';
  if (!item.excerpt) errors.push('Please add a short summary — it appears on the event cards.');
  if (!item.description.length) item.description = [item.excerpt];
  if (!item.price) item.price = 'Free';
  if (!item.level) item.level = 'All levels';
  if (!item.imageAlt) item.imageAlt = item.title;
  checkImage(item.image, errors);
  return { item, errors };
}

export function cleanArticle(input: Input): { item: Article; errors: string[] } {
  const errors: string[] = [];
  const category = str(input.category) as NewsCategory;
  const content = cleanDoc(input.content, (name) => !!imageRegistry()[name]);
  const item: Article = {
    slug: str(input.slug, 80),
    title: str(input.title, 160),
    category: newsCategories.includes(category) ? category : 'Features',
    date: str(input.date, 10),
    author: str(input.author, 80) || 'Beach Volleyball TV',
    image: str(input.image, 120) || 'bv-sunset-silhouettes',
    imageAlt: str(input.imageAlt, 200),
    excerpt: str(input.excerpt, 400),
    featured: bool(input.featured) || undefined,
    draft: bool(input.draft) || undefined,
    content,
  };
  if (!item.title) errors.push('Please add a headline.');
  if (!isDate(item.date)) errors.push('Please choose a publish date.');
  if (!item.excerpt) errors.push('Please add a short summary — it appears on the story cards.');
  if (!docHasContent(content)) errors.push('The story is empty — write something in the story box.');
  if (!item.imageAlt) item.imageAlt = item.title;
  checkImage(item.image, errors);
  return { item, errors };
}

export function cleanVideos(input: unknown): { videos: Video[]; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  const videos: Video[] = [];
  for (const raw of Array.isArray(input) ? input.slice(0, 500) : []) {
    const v = raw as Input;
    const youtubeId = parseYouTubeId(str(v.youtubeId, 200));
    if (!youtubeId || seen.has(youtubeId)) continue;
    seen.add(youtubeId);
    const category = str(v.category) as VideoCategory;
    const video: Video = {
      youtubeId,
      title: str(v.title, 160) || 'Untitled video',
      category: videoCategories.includes(category) ? category : 'Interviews',
      description: str(v.description, 300),
    };
    if (str(v.image) && imageRegistry()[str(v.image)]) video.image = str(v.image);
    if (bool(v.featured) && !videos.some((x) => x.featured)) video.featured = true;
    if (str(v.athlete, 80)) video.athlete = str(v.athlete, 80);
    videos.push(video);
  }
  if (!videos.length) errors.push('The video library can’t be empty.');
  return { videos, errors };
}

/* ---------- Home page ---------- */
const HOME_SECTIONS: Record<keyof HomeContent, string> = {
  hero: 'Top banner',
  welcome: 'Welcome',
  spotlight: 'Featured event',
  videos: 'Videos',
  news: 'Stories',
  events: 'Events',
  purpose: 'Our purpose',
  partner: 'Partner with us',
  connect: 'Connect with us',
};
/** Fields that can't be left empty (headlines and button text), when the section is shown. */
const isRequired = (key: string) => key === 'title' || /(Title|Label|Link)$/.test(key);
const isLong = (key: string) => /text|Text|note/.test(key);

export function cleanHome(input: unknown): { home: HomeContent; errors: string[] } {
  const errors: string[] = [];
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, Input>;
  const home = structuredClone(defaultHome);
  for (const section of Object.keys(home) as (keyof HomeContent)[]) {
    const out = home[section] as Record<string, unknown>;
    const src = raw[section] ?? {};
    for (const [key, fallback] of Object.entries(out)) {
      if (typeof fallback === 'boolean') out[key] = bool(src[key]);
      else if (key === 'paragraphs') out[key] = paragraphs(src[key]).map((p) => p.slice(0, 1200));
      else if (key === 'platforms') {
        const list = Array.isArray(src[key]) ? (src[key] as Input[]) : [];
        out[key] = (fallback as { title: string; text: string }[]).map((_, i) => ({ title: str(list[i]?.title, 80), text: str(list[i]?.text, 200) }));
      } else if (key === 'photoA' || key === 'photoB') {
        out[key] = str(src[key], 120) || fallback;
        checkImage(out[key] as string, errors, `${HOME_SECTIONS[section]}: a photo`);
      } else out[key] = str(src[key], isLong(key) ? 600 : key.endsWith('Alt') ? 200 : 140);
    }
    if (out.show === false) continue;
    const name = HOME_SECTIONS[section];
    for (const [key, v] of Object.entries(out)) if (isRequired(key) && v === '') errors.push(`${name}: please fill in every headline and button text.`);
    if (section === 'welcome' && home.welcome.platforms.some((p) => !p.title)) errors.push(`${name}: each of the three platform cards needs a title.`);
  }
  return { home, errors: [...new Set(errors)] };
}
