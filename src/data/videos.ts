// Video types. Videos live in content/videos.json and are managed from the
// admin (/admin/videos) — paste a YouTube link to add one.

import { site } from './site';

export type VideoCategory = 'Interviews' | 'Tournaments' | 'Highlights' | 'Podcasts';

export interface Video {
  youtubeId: string;
  title: string;
  category: VideoCategory;
  description: string;
  /** Optional local thumbnail (image registry name). Defaults to YouTube's. */
  image?: string;
  /** Shown large at the top of the YouTube page (first match wins). */
  featured?: boolean;
}

export const videoCategories: VideoCategory[] = ['Interviews', 'Tournaments', 'Highlights', 'Podcasts'];

export const channel = {
  url: site.youtube.url,
  subscribeUrl: site.youtube.subscribeUrl,
};
