// Article types. Articles live in content/news.json and are managed from the
// admin (/admin/news). The story itself is a rich-text document (see lib/rich.ts).

import { docText, type RichNode } from '../lib/rich';

export type NewsCategory = 'Tournament Highlights' | 'Interviews' | 'Athlete Profiles' | 'Community' | 'Features';

export interface Article {
  slug: string;
  title: string;
  category: NewsCategory;
  /** ISO publish date (YYYY-MM-DD). */
  date: string;
  author: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  featured?: boolean;
  draft?: boolean;
  /** The story, written in the admin's Word-style editor. */
  content: RichNode;
}

export const newsCategories: NewsCategory[] = [
  'Tournament Highlights',
  'Interviews',
  'Athlete Profiles',
  'Community',
  'Features',
];

export function readingTime(article: Article) {
  const words = docText(article.content).split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}
