// Partners & Sponsors page wording and photo. Edited in the admin (Partners page),
// saved to content/partners.json. The Instagram figures come from the About page,
// and the partnerships contact from Settings.
import type { Headline } from './home';

export interface PartnersContent {
  header: Headline & { eyebrow: string; lede: string; photo: string; photoAlt: string; buttonLabel: string };
  intro: Headline & { eyebrow: string; paragraphs: string[]; waysTitle: string; ways: { title: string }[] };
  now: { show: boolean; title: string; text: string; linkText: string };
  reach: Headline & { show: boolean; eyebrow: string };
  talk: { show: boolean; eyebrow: string; buttonLabel: string };
}

export const defaultPartners: PartnersContent = {
  header: {
    eyebrow: 'Partners & sponsors',
    title: 'Advertising, sponsorship',
    em: '& commercial partnerships',
    lede: 'Partner with Beach Volleyball TV and connect your brand with a growing community of athletes, sporting enthusiasts, families and fans across Australia and beyond.',
    photo: 'bv-ball-sand',
    photoAlt: 'A volleyball resting in the sand beside the court line',
    buttonLabel: 'Partner with us',
  },
  intro: {
    eyebrow: 'Let’s make a difference together',
    title: 'More than a partnership —',
    em: 'a shared purpose',
    paragraphs: [
      'Explore advertising, sponsorship and commercial partnership opportunities through our digital media platforms, podcasts, athlete interviews, event coverage and community initiatives.',
      'We work with businesses, brands and organisations to create meaningful collaborations that increase visibility, strengthen brand engagement and deliver mutual value. Together, we can support athletes, grow the sport and make a positive impact in our communities.',
      'By partnering with Beach Volleyball TV, you’re helping us tell inspiring stories, support athletes, create opportunities and make sport more accessible to everyone — building meaningful relationships, increasing brand visibility and making a lasting impact locally, nationally and globally.',
    ],
    waysTitle: 'Ways to partner',
    ways: [
      { title: 'Sponsorships' },
      { title: 'Advertising' },
      { title: 'Branded content' },
      { title: 'Event partnerships' },
      { title: 'Media collaborations' },
      { title: 'Podcasts & athlete interviews' },
    ],
  },
  now: {
    show: true,
    title: 'Happening now',
    text: 'We are currently running a 10-week podcast at the Budgy Smuggler store in Bondi, with a beach volleyball community day and gala night coming 12 December.',
    linkText: 'See the community day',
  },
  reach: { show: true, eyebrow: 'Our reach', title: 'A fast-growing', em: 'community' },
  talk: { show: true, eyebrow: 'Talk to us', buttonLabel: 'Enquire about partnering' },
};
