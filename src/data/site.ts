// Central site settings. Edit contact details, social links and navigation here.

export const site = {
  name: 'Beach Volleyball TV',
  shortName: 'BVTV',
  tagline: 'Community. Sport. Stories.',
  strapline: 'A world of entertainment, inspiration, sport and business',
  description:
    'Your home for beach volleyball news, weekly broadcasts, athlete interviews, tournament highlights and inspiring stories from Australia and around the world.',
  url: 'https://beachvolleyballtv.com.au',
  locale: 'en_AU',
  email: 'info@beachvolleyballtv.com.au',
  /** Partnerships & sponsorship contact. */
  partnerships: { name: 'Christie', email: 'beachvolleyballtv@proton.me' },
  youtube: {
    handle: '@beachvolleyballtv',
    url: 'https://www.youtube.com/@beachvolleyballtv',
    subscribeUrl: 'https://www.youtube.com/@beachvolleyballtv?sub_confirmation=1',
  },
  instagram: { handle: '@beachvolleyballtv', url: 'https://www.instagram.com/beachvolleyballtv/' },
  tiktok: { handle: '@gepbeachvolleyball', url: 'https://www.tiktok.com/@gepbeachvolleyball' },
  /** Community groups. */
  instagramGroup: 'https://ig.me/j/YmY7KdVv6y4uCYsf/',
  whatsappGroup: 'https://chat.whatsapp.com/GFYWqurPR2ODjwgTqa6paM',
  whatsappCommunity: 'https://chat.whatsapp.com/K04yS88qpQx6QrFAeZanCJ?s=cl&p=i&iam=2',
  /**
   * Contact buttons ("Contact us", "Enquire", the contact form, mailing list…).
   * While false they are shown but do nothing. Set to true to switch them on.
   */
  contactEnabled: false,
  /**
   * Contact form endpoint (Formspree / Web3Forms / Basin URL). Left empty, the
   * form opens the visitor's email app pre-filled to the address above.
   */
  formEndpoint: '',
  ogImage: '/images/og-default.jpg',
};

/** Main navigation (header). */
export const nav = [
  { label: 'Home', href: '/' },
  { label: 'News & Media', href: '/news/' },
  { label: 'Athletes', href: '/athletes/' },
  { label: 'Events', href: '/events/' },
  { label: 'Community', href: '/community/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

/** Every page — used by the mobile menu and footer. */
export const allPages = [
  { label: 'Home', href: '/' },
  { label: 'News & Media', href: '/news/' },
  { label: 'Videos', href: '/youtube/' },
  { label: 'Athletes', href: '/athletes/' },
  { label: 'Events', href: '/events/' },
  { label: 'Community', href: '/community/' },
  { label: 'Partners & Sponsors', href: '/partners/' },
  { label: 'About Us', href: '/about/' },
  { label: 'Get Involved', href: '/get-involved/' },
  { label: 'Contact', href: '/contact/' },
];

export const enquiryTypes = [
  { value: 'general', label: 'General enquiry' },
  { value: 'media', label: 'Media & interviews' },
  { value: 'events', label: 'Events & bookings' },
  { value: 'partnership', label: 'Sponsorship & partnerships' },
  { value: 'community', label: 'Get involved / volunteer' },
];
