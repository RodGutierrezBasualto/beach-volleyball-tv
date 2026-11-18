// Central site settings. Edit contact details, socials and the form endpoint here.

export const site = {
  name: 'Beach Volleyball TV',
  shortName: 'BVTV',
  tagline: 'Community. Sport. Stories.',
  description:
    'Beach Volleyball TV is an Australian beach volleyball community born in Bondi — tournaments, clinics, social sessions, stories and video from the sand.',
  url: 'https://beachvolleyballtv.com.au',
  locale: 'en_AU',
  email: 'info@beachvolleyballtv.com.au',
  instagram: {
    handle: '@beachvolleyballtv',
    url: 'https://www.instagram.com/beachvolleyballtv/',
  },
  youtube: {
    channelId: 'UCvXiojAM79J7MOaNVd7F4Og',
    url: 'https://www.youtube.com/channel/UCvXiojAM79J7MOaNVd7F4Og',
    subscribeUrl: 'https://www.youtube.com/channel/UCvXiojAM79J7MOaNVd7F4Og?sub_confirmation=1',
  },
  /**
   * Contact form endpoint. Paste a Formspree / Web3Forms / Basin URL here
   * (e.g. 'https://formspree.io/f/abcdwxyz') to receive submissions by POST.
   * Left empty, the form falls back to opening the visitor's email app
   * with the message pre-filled to the address above.
   */
  formEndpoint: '',
  ogImage: '/images/og-default.jpg',
};

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events/' },
  { label: 'News', href: '/news/' },
  { label: 'YouTube', href: '/youtube/' },
  { label: 'Contact Us', href: '/contact/' },
];

export const enquiryTypes = [
  { value: 'general', label: 'General enquiry' },
  { value: 'community', label: 'Join the community' },
  { value: 'events', label: 'Event registration' },
  { value: 'partnership', label: 'Partnerships & sponsorship' },
  { value: 'media', label: 'Media & content' },
];
