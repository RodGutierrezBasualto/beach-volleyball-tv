import type { EventItem } from '../data/events';
import { getEvents, imageRegistry, uploadsBase } from './content';
import { site } from '../data/site';

const TZ = 'Australia/Sydney';

/** Parse a YYYY-MM-DD string as a calendar date (no timezone drift). */
function asUTC(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-AU', { ...opts, timeZone: 'UTC' }).format(asUTC(iso));
}

export function dateParts(iso: string) {
  const d = asUTC(iso);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-AU', { ...o, timeZone: 'UTC' }).format(d);
  return { day: f({ day: '2-digit' }), month: f({ month: 'short' }).replace('.', ''), weekday: f({ weekday: 'short' }), year: f({ year: 'numeric' }) };
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')}${suffix}` : `${hr}${suffix}`;
}

/** "+11:00" style offset for Sydney on a given date (handles daylight saving). */
function sydneyOffset(iso: string) {
  const name = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(asUTC(iso))
    .find((p) => p.type === 'timeZoneName')?.value;
  return name?.replace('GMT', '') || '+10:00';
}

export function isoDateTime(date: string, time?: string) {
  return time ? `${date}T${time}:00${sydneyOffset(date)}` : date;
}

export function todaySydney() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Published events that haven't finished yet (Sydney time). */
export function upcomingEvents() {
  const today = todaySydney();
  return getEvents().filter((e) => (e.endDate ?? e.date) >= today);
}

export const isPastEvent = (e: EventItem) => (e.endDate ?? e.date) < todaySydney();

export function eventDateLabel(e: EventItem) {
  if (e.recurring && !e.endDate) return `${e.recurring} · from ${formatDate(e.date, { day: 'numeric', month: 'long' })}`;
  if (e.endDate) return `${formatDate(e.date, { day: 'numeric', month: 'short' })} – ${formatDate(e.endDate)}`;
  return formatDate(e.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function eventTimeLabel(e: EventItem) {
  if (e.timeNote) return e.timeNote;
  if (e.startTime && e.endTime) return `${formatTime(e.startTime)} – ${formatTime(e.endTime)}`;
  if (e.startTime) return `From ${formatTime(e.startTime)}`;
  return 'Times to be confirmed';
}

export function googleCalendarUrl(e: EventItem) {
  const stamp = (d: string, t: string) => `${d.replaceAll('-', '')}T${t.replace(':', '')}00`;
  const nextDay = (d: string) => new Date(Date.parse(`${d}T12:00:00Z`) + 864e5).toISOString().slice(0, 10).replaceAll('-', '');
  const end = e.endTime ?? (e.startTime ? `${String(Math.min(23, Number(e.startTime.slice(0, 2)) + 3)).padStart(2, '0')}${e.startTime.slice(2)}` : undefined);
  const dates = e.startTime && end ? `${stamp(e.date, e.startTime)}/${stamp(e.date, end)}` : `${e.date.replaceAll('-', '')}/${nextDay(e.date)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates,
    ctz: TZ,
    details: `${e.excerpt}\n\n${site.url}/events/${e.slug}/`,
    location: `${e.venue}, ${e.suburb}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function mapUrl(e: EventItem) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.suburb}`)}`;
}

export function contactUrl(type: string, subject?: string) {
  const p = new URLSearchParams({ type });
  if (subject) p.set('subject', subject);
  return `/contact/?${p}`;
}

/** Responsive image attributes for a registered image name. */
export function img(name: string) {
  const entry = imageRegistry()[name];
  if (!entry) return { src: name, srcset: undefined, ratio: undefined, largest: name };
  const dir = entry.dir === '/uploads' ? uploadsBase() : entry.dir ?? '/images';
  const url = (w: number) => `${dir}/${name}-${w}.${entry.ext ?? 'webp'}`;
  const largest = url(entry.widths[entry.widths.length - 1]);
  return {
    src: url(entry.widths[0]),
    srcset: entry.widths.map((w) => `${url(w)} ${w}w`).join(', '),
    ratio: entry.ratio,
    largest,
  };
}

export function videoThumb(youtubeId: string, image?: string) {
  if (image && imageRegistry()[image]) return img(image);
  const yt = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return { src: yt, srcset: undefined, ratio: 16 / 9, largest: yt };
}

/**
 * JSON that is safe to place inside a <script> tag: escapes "<" (so content
 * like "</script>" can't end the tag early) and the U+2028/2029 separators.
 */
export function jsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
