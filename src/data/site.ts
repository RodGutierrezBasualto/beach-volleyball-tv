// Central site settings and navigation.
// Contact details, social links, community group links, the footer text and the
// search engine description are edited in the admin (Settings) and saved to
// content/settings.json; their defaults are in src/data/settings.ts. The getters
// below read the saved values, so they're always current.
import { getPage } from '../lib/content';

const settings = () => getPage('settings');
const subscribeUrl = (url: string) => `${url}${url.includes('?') ? '&' : '?'}sub_confirmation=1`;

export const site = {
  name: 'Beach Volleyball TV',
  shortName: 'BVTV',
  tagline: 'Community. Sport. Stories.',
  get footerText() { return settings().site.footerText; },
  get description() { return settings().site.description; },
  url: 'https://beachvolleyballtv.com.au',
  locale: 'en_AU',
  get email() { return settings().contact.email; },
  /** Partnerships & sponsorship contact. */
  get partnerships() { const c = settings().contact; return { name: c.partnershipsName, email: c.partnershipsEmail }; },
  get youtube() { const s = settings().social; return { handle: s.youtubeHandle, url: s.youtubeUrl, subscribeUrl: subscribeUrl(s.youtubeUrl) }; },
  get instagram() { const s = settings().social; return { handle: s.instagramHandle, url: s.instagramUrl }; },
  get tiktok() { const s = settings().social; return { handle: s.tiktokHandle, url: s.tiktokUrl }; },
  /** Community groups. */
  get instagramGroup() { return settings().community.instagramGroupUrl; },
  get whatsappGroup() { return settings().community.whatsappGroupUrl; },
  get whatsappCommunity() { return settings().community.whatsappCommunityUrl; },
  /**
   * Contact buttons ("Contact us", "Enquire", the contact form, mailing list…).
   * While false they are shown but do nothing. Set to true to switch them on.
   */
  contactEnabled: true,
  /**
   * Contact form endpoint (Formspree / Web3Forms / Basin URL). Left empty, the
   * form opens the visitor's email app pre-filled and addressed to the right
   * inbox for the enquiry type (see enquiryTypes below).
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

/** Which inbox each enquiry goes to: `site.email` unless `to` says otherwise. */
export const enquiryTypes = [
  { value: 'general', label: 'General enquiry' },
  { value: 'media', label: 'Media & interviews' },
  { value: 'events', label: 'Events & bookings' },
  { value: 'partnership', label: 'Sponsorship & partnerships', get to() { return site.partnerships.email; } },
  { value: 'community', label: 'Get involved / volunteer' },
];

export const recipientFor = (type: string) => enquiryTypes.find((t) => t.value === type)?.to ?? site.email;
