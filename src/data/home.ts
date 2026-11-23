// Home page wording and photos. Edited in the admin (Home page), saved to
// content/home.json. These defaults are used for anything not saved there yet.

/** A headline whose last words are shown in italic. */
export interface Headline { title: string; em: string }

export interface HomeContent {
  hero: { kicker: string; tagline: string; primaryLabel: string; youtubeLabel: string; barLeft: string; hint: string; barRight: string };
  welcome: Headline & {
    eyebrow: string;
    paragraphs: string[];
    platforms: { title: string; text: string }[];
    photoA: string; photoAAlt: string;
    photoB: string; photoBAlt: string;
  };
  spotlight: { show: boolean; eyebrow: string };
  videos: Headline & { show: boolean; eyebrow: string; text: string };
  news: Headline & { show: boolean; eyebrow: string };
  events: Headline & { show: boolean; eyebrow: string; text: string };
  purpose: Headline & {
    show: boolean; eyebrow: string; paragraphs: string[]; linkLabel: string;
    involvedTitle: string; involvedText: string; involvedLink: string;
    joinTitle: string; joinText: string; instagramLabel: string; whatsappLabel: string;
  };
  partner: Headline & { show: boolean; eyebrow: string; text: string; note: string; buttonLabel: string };
  connect: { show: boolean; eyebrow: string; text: string; buttonLabel: string };
}

export const defaultHome: HomeContent = {
  hero: {
    kicker: 'A world of entertainment, inspiration, sport and business',
    tagline: 'Community. Sport. Stories.',
    primaryLabel: 'Explore the Community',
    youtubeLabel: 'Watch on YouTube',
    barLeft: 'Born in Bondi',
    hint: 'Give the ball a nudge',
    barRight: '33.89° S · 151.27° E',
  },
  welcome: {
    eyebrow: 'Welcome to Beach Volleyball TV',
    title: 'Your home for beach volleyball —',
    em: 'from Bondi to the world.',
    paragraphs: [
      'Your home for beach volleyball news, weekly broadcasts, athlete interviews, tournament highlights and inspiring stories from Australia and around the world.',
      'We go beyond the game to celebrate the athletes, people and communities that make our sport special.',
    ],
    platforms: [
      { title: 'Latest episodes on YouTube', text: 'Interviews, weekly broadcasts and match highlights.' },
      { title: 'Latest posts on Instagram', text: 'Where our community connects every day.' },
      { title: 'Latest posts on TikTok', text: 'Quick clips from the sand.' },
    ],
    photoA: 'yt-u9tlUaKomis',
    photoAAlt: 'A player passing the ball on Bondi Beach with the apartments of Bondi behind',
    photoB: 'volleyball-ball',
    photoBAlt: 'Close-up of a yellow and blue volleyball',
  },
  spotlight: { show: true, eyebrow: 'Coming up · Free community event' },
  videos: {
    show: true,
    eyebrow: 'Watch now',
    title: 'Latest news &',
    em: 'weekly broadcasts',
    text: 'Stay connected with exclusive interviews, match highlights, behind-the-scenes coverage and our weekly Beach Volleyball TV content of entertainment and inspiration.',
  },
  news: { show: true, eyebrow: 'News & media', title: 'Stories from', em: 'the beach' },
  events: { show: true, eyebrow: 'Events', title: 'Play with us', em: 'every week', text: 'Free social beach volleyball at Bondi Beach — no need to book.' },
  purpose: {
    show: true,
    eyebrow: 'Our purpose',
    title: 'More than',
    em: 'just sport',
    paragraphs: [
      'We believe in the power of sport to bring people together, inspire positive change and build stronger communities.',
      'Through storytelling, media, events and community initiatives, our mission is to uplift, serve and support others.',
    ],
    linkLabel: 'About Beach Volleyball TV',
    involvedTitle: 'Get involved',
    involvedText: 'Become a reporter, volunteer, contributor or collaborator. Whether you’re an athlete, creator, business or sporting enthusiast, there’s a place for you in our community.',
    involvedLink: 'Find your place',
    joinTitle: 'Join our community',
    joinText: 'Chat with players, find a game and hear about events first.',
    instagramLabel: 'Instagram group',
    whatsappLabel: 'WhatsApp group',
  },
  partner: {
    show: true,
    eyebrow: 'Partner with us',
    title: 'Let’s make a difference',
    em: 'together.',
    text: 'Beach Volleyball TV welcomes partnerships with businesses, brands, sporting organisations and individuals who share our passion for sport, community and positive change.',
    note: 'We are currently running a 10-week podcast at the Budgy Smuggler store in Bondi, with a beach volleyball community day and gala night coming 12 December.',
    buttonLabel: 'Partners & sponsors',
  },
  connect: {
    show: true,
    eyebrow: 'Connect with us',
    text: 'For media enquiries, interviews, event coverage, sponsorships, bookings and collaborations, we’d love to hear from you.',
    buttonLabel: 'Contact us',
  },
};

/** The two collage photos are square. */
export const HOME_PHOTO_RATIO = 1;
