// About page wording and photos. Edited in the admin (About page), saved to
// content/about.json. These defaults are used for anything not saved there yet.
import type { Headline } from './home';

export interface TeamMember { name: string; role: string; photo: string; photoAlt: string; bio: string }
/** An empty team member: the boxes each one has. */
export const emptyTeamMember: TeamMember = { name: '', role: '', photo: '', photoAlt: '', bio: '' };

export interface AboutContent {
  header: Headline & { eyebrow: string; lede: string; photo: string; photoAlt: string };
  story: Headline & {
    eyebrow: string; paragraphs: string[]; linkLabel: string;
    visionTitle: string; visionText: string; missionTitle: string; missionText: string;
  };
  /** Instagram figures. Also shown on the Partners page. */
  growth: Headline & { show: boolean; eyebrow: string; text: string; period: string; stats: { value: string; label: string; change: string }[] };
  values: Headline & { show: boolean; eyebrow: string; items: { title: string; text: string }[] };
  team: Headline & {
    show: boolean; eyebrow: string;
    name: string; role: string; photo: string; photoAlt: string; photoCredit: string;
    paragraphs: string[]; quote: string;
    /** Optional other team members, shown under the main profile. */
    members: TeamMember[];
  };
}

export const defaultAbout: AboutContent = {
  header: {
    eyebrow: 'About us',
    title: 'Born in Bondi,',
    em: 'made for the community',
    lede: 'Beach Volleyball TV was born in Bondi from social games and tournaments, eventually leading to interviews — and now Beach Volleyball TV.',
    photo: 'yt-u9tlUaKomis',
    photoAlt: 'A player passing the ball on Bondi Beach',
  },
  story: {
    eyebrow: 'Our story',
    title: 'From a social group',
    em: 'to an international page',
    paragraphs: [
      'What began as a social beach volleyball group page evolved into an international Beach Volleyball TV page in October 2026.',
      'We started posting interviews that became popular, with strong community engagement that led to many people wanting to be part of helping grow our sport. Instagram is where we connect with our community, and through collaboration we help support the work of others as well.',
    ],
    linkLabel: 'Check out our growing Instagram page',
    visionTitle: 'Vision',
    visionText: 'To help grow beach volleyball into one of the most watched sports on earth, and to inspire businesses to invest and collaborate with beach volleyball.',
    missionTitle: 'Mission',
    missionText: 'To be a beautiful, fresh breeze of entertainment, stories and a place of edification and support for the beach volleyball community.',
  },
  growth: {
    show: true,
    eyebrow: 'Growing fast',
    title: 'Our latest',
    em: 'Instagram statistics',
    text: 'Over the past 30 days our Instagram platform has experienced significant growth, demonstrating increasing interest in our content and community initiatives.',
    period: '18 October – 16 November 2026',
    stats: [
      { value: '294,008', label: 'views in the past 30 days', change: '+95.8%' },
      { value: '962', label: 'followers', change: '+31.4%' },
      { value: '217', label: 'net new followers this period', change: '' },
      { value: '~9,800', label: 'views per day on average', change: '' },
    ],
  },
  values: {
    show: true,
    eyebrow: 'What we stand for',
    title: 'Our values',
    em: '',
    items: [
      { title: 'Uplift & Edify', text: 'We inspire, encourage and build others up through positive words, actions and meaningful stories.' },
      { title: 'Serve Others', text: 'We lead with humility and selflessness, placing the needs and wellbeing of others above our own.' },
      { title: 'Support Others', text: 'We stand alongside individuals and communities, helping them grow, overcome challenges and achieve their goals.' },
      { title: 'Transparency & Authenticity', text: 'We communicate openly, share genuine stories and remain true to who we are and what we stand for.' },
      { title: 'Trust & Integrity', text: 'We act with honesty, accountability and consistency, honouring our commitments and doing what is right.' },
      { title: 'Teamwork', text: 'We work together with unity, mutual respect and a shared purpose, recognising that we achieve more when we support one another.' },
    ],
  },
  team: {
    show: true,
    eyebrow: 'Team',
    title: 'The people behind',
    em: 'Beach Volleyball TV',
    name: 'Christie Mokotupu',
    role: 'Founder & Managing Director | Beach Volleyball TV',
    photo: 'christie',
    photoAlt: 'Christie Mokotupu smiling on the sand in a visor and sunglasses',
    photoCredit: 'Photo: @kirana_design_photo',
    paragraphs: [
      'Christie Mokotupu is a Sydney 2000 Australian Volleyball Olympian who represented Australia in more than 200 international matches. Her sporting career includes playing professionally for A2 Padova in Italy in 2002, competing at the 2002 Volleyball World Championships and participating in the World Beach Volleyball Tour in 2005.',
      'In 2015, Christie publicly shared her journey of overcoming drug and alcohol addiction and reaching rock bottom in an interview with *The Sydney Morning Herald*. Her story of resilience, recovery and personal transformation led her into public speaking, advocacy and community campaigns, where she has sought to inspire and encourage others facing adversity.',
      'A born-again Christian, Christie is also a qualified Commercial Helicopter Pilot and is currently pursuing a double degree in Law and Theology.',
      'As a single mother to an 18-year-old son, Christie places family, faith, and service to others as her highest values.',
      'Today, as Founder and Managing Director of **Beach Volleyball TV**, Christie combines her experience in elite sport, media, advocacy and community engagement to create a platform that celebrates athletes, shares meaningful stories and brings people together through sport.',
    ],
    quote: 'Her mission is to uplift, serve and support others through sport.',
    members: [],
  },
};
