// Pages whose wording and photos are edited in the admin. Each is saved to
// content/<name>.json; its defaults fill in anything not saved yet.
import { defaultHome, type HomeContent } from './home';
import { defaultAbout, type AboutContent } from './about';

export interface PageContents { home: HomeContent; about: AboutContent }
export type PageName = keyof PageContents;

export const pages: { [N in PageName]: { defaults: PageContents[N]; path: string; sections: Record<keyof PageContents[N], string> } } = {
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
  },
};

export const isPageName = (name: string): name is PageName => Object.hasOwn(pages, name);
