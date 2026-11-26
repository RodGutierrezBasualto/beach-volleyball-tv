// Pages whose wording and photos are edited in the admin (plus the site-wide
// Settings). Each is saved to content/<name>.json; its defaults fill in
// anything not saved yet.
import { defaultHome, type HomeContent } from './home';
import { defaultAbout, emptyTeamMember, type AboutContent } from './about';
import { defaultPartners, type PartnersContent } from './partners';
import { defaultSettings, type SettingsContent } from './settings';

export interface PageContents { home: HomeContent; about: AboutContent; partners: PartnersContent; settings: SettingsContent }
export type PageName = keyof PageContents;

export const pages: {
  [N in PageName]: {
    defaults: PageContents[N];
    path: string;
    sections: Record<keyof PageContents[N], string>;
    /** The boxes of each list item, for lists that can start empty (otherwise taken from the first default item). */
    listItems?: Record<string, Record<string, string>>;
  };
} = {
  home: {
    defaults: defaultHome,
    path: '/',
    sections: {
      hero: 'Top banner', welcome: 'Welcome', spotlight: 'Featured event', videos: 'Videos', news: 'Stories',
      events: 'Upcoming events', purpose: 'Our purpose', partner: 'Partner with us', connect: 'Connect with us',
    },
  },
  about: {
    defaults: defaultAbout,
    path: '/about/',
    sections: { header: 'Top of the page', story: 'Our story', growth: 'Instagram statistics', values: 'Our values', team: 'Team' },
    listItems: { members: { ...emptyTeamMember } },
  },
  partners: {
    defaults: defaultPartners,
    path: '/partners/',
    sections: { header: 'Top of the page', intro: 'Introduction', now: 'Happening now', reach: 'Our reach', talk: 'Talk to us' },
  },
  settings: {
    defaults: defaultSettings,
    path: '/contact/',
    sections: { contact: 'Email addresses', social: 'Social media', community: 'Community groups', site: 'Website text' },
  },
};

export const isPageName = (name: string): name is PageName => Object.hasOwn(pages, name);
