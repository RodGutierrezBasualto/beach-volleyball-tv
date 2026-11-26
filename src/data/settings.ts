// Site-wide contact details and links. Edited in the admin (Settings), saved to
// content/settings.json. Read through `site` in src/data/site.ts.

export interface SettingsContent {
  contact: { email: string; partnershipsName: string; partnershipsEmail: string };
  social: { instagramHandle: string; instagramUrl: string; youtubeHandle: string; youtubeUrl: string; tiktokHandle: string; tiktokUrl: string };
  community: { instagramGroupUrl: string; whatsappGroupUrl: string; whatsappCommunityUrl: string };
  site: { footerText: string; description: string };
}

export const defaultSettings: SettingsContent = {
  contact: {
    email: 'info@beachvolleyballtv.com.au',
    partnershipsName: 'Christie',
    partnershipsEmail: 'beachvolleyballtv@proton.me',
  },
  social: {
    instagramHandle: '@beachvolleyballtv',
    instagramUrl: 'https://www.instagram.com/beachvolleyballtv/',
    youtubeHandle: '@beachvolleyballtv',
    youtubeUrl: 'https://www.youtube.com/@beachvolleyballtv',
    tiktokHandle: '@gepbeachvolleyball',
    tiktokUrl: 'https://www.tiktok.com/@gepbeachvolleyball',
  },
  community: {
    instagramGroupUrl: 'https://ig.me/j/YmY7KdVv6y4uCYsf/',
    whatsappGroupUrl: 'https://chat.whatsapp.com/GFYWqurPR2ODjwgTqa6paM',
    whatsappCommunityUrl: 'https://chat.whatsapp.com/K04yS88qpQx6QrFAeZanCJ?s=cl&p=i&iam=2',
  },
  site: {
    footerText: 'A world of entertainment, inspiration, sport and business. Born in Bondi — sharing beach volleyball stories from Australia and around the world.',
    description: 'Your home for beach volleyball news, weekly broadcasts, athlete interviews, tournament highlights and inspiring stories from Australia and around the world.',
  },
};
