export interface Companion {
  id: string;
  name: string;
  tagline: string;
  shortPersonality: string;
  category: string;
  emoji: string;
  avatar: string;
  gradient: string;
  online: boolean;
  personalityTags: string[];
  voiceLabel: string;
  availability: string;
  status: 'published' | 'draft' | 'paused' | 'archived';
  visibility: 'Public' | 'Private' | 'Invite Only' | 'Premium' | 'Enterprise';
  creator: string;
  rating: number;
  followers: number;
  activeUsers: number;
  conversations: number;
  requestCount: number;
  voiceEnabled: boolean;
  premium: boolean;
  languages: string[];
  level: number;
  revenue: number;
  price: string;
  releaseTag: 'Trending' | 'Popular' | 'New' | 'Staff Pick';
}

export const COMPANIONS: Companion[] = [
  {
    id: 'sophia',
    name: 'Sophia',
    tagline: 'Relationship Coach & Companion',
    shortPersonality: 'Empathetic, grounded, and emotionally intelligent.',
    category: 'Romantic',
    emoji: '❤️',
    avatar: 'SO',
    gradient: 'linear-gradient(135deg,#fb7185,#e879f9)',
    online: true,
    personalityTags: ['Empathetic', 'Romantic', 'Warm'],
    voiceLabel: 'Warm Alto',
    availability: '24x7',
    status: 'published',
    visibility: 'Premium',
    creator: 'Aura Labs',
    rating: 4.9,
    followers: 12400,
    activeUsers: 3820,
    conversations: 48210,
    requestCount: 218,
    voiceEnabled: true,
    premium: true,
    languages: ['EN', 'ES', 'FR'],
    level: 12,
    revenue: 18240,
    price: '$9.99/mo',
    releaseTag: 'Popular',
  },
  {
    id: 'zara',
    name: 'Zara',
    tagline: 'Your Everyday Friend',
    shortPersonality: 'Cheerful, witty, and always available for banter.',
    category: 'Friends',
    emoji: '👩',
    avatar: 'ZA',
    gradient: 'linear-gradient(135deg,#8b5cf6,#e879f9)',
    online: true,
    personalityTags: ['Friendly', 'Playful', 'Funny'],
    voiceLabel: 'Bright Pop',
    availability: '24x7',
    status: 'published',
    visibility: 'Public',
    creator: 'Nexu Studios',
    rating: 4.7,
    followers: 21200,
    activeUsers: 7300,
    conversations: 91400,
    requestCount: 348,
    voiceEnabled: true,
    premium: false,
    languages: ['EN', 'AR', 'FR'],
    level: 18,
    revenue: 31200,
    price: 'Free',
    releaseTag: 'Trending',
  },
  {
    id: 'maya',
    name: 'Maya',
    tagline: 'Mental Wellness Guide',
    shortPersonality: 'Calm, reflective, and supportive with gentle pacing.',
    category: 'Healthcare',
    emoji: '🧘',
    avatar: 'MY',
    gradient: 'linear-gradient(135deg,#34d399,#22d3ee)',
    online: false,
    personalityTags: ['Calm', 'Listener', 'Grounded'],
    voiceLabel: 'Soft Breeze',
    availability: 'Morning + Night',
    status: 'published',
    visibility: 'Public',
    creator: 'InnerOrbit',
    rating: 4.9,
    followers: 15600,
    activeUsers: 5010,
    conversations: 62800,
    requestCount: 132,
    voiceEnabled: true,
    premium: true,
    languages: ['EN', 'ES', 'HI'],
    level: 15,
    revenue: 24100,
    price: '$6.99/mo',
    releaseTag: 'Staff Pick',
  },
  {
    id: 'alex',
    name: 'Alex',
    tagline: 'English Tutor & Study Buddy',
    shortPersonality: 'Patient teacher with adaptive learning style.',
    category: 'Education',
    emoji: '🎓',
    avatar: 'AL',
    gradient: 'linear-gradient(135deg,#22d3ee,#3b82f6)',
    online: true,
    personalityTags: ['Patient', 'Study', 'Structured'],
    voiceLabel: 'Tutor Clear',
    availability: 'Weekdays',
    status: 'published',
    visibility: 'Public',
    creator: 'Lingua Forge',
    rating: 4.6,
    followers: 8900,
    activeUsers: 2140,
    conversations: 31500,
    requestCount: 74,
    voiceEnabled: true,
    premium: false,
    languages: ['EN', 'DE'],
    level: 9,
    revenue: 9600,
    price: 'Free',
    releaseTag: 'New',
  },
  {
    id: 'leo',
    name: 'Leo',
    tagline: 'Business & Startup Mentor',
    shortPersonality: 'Direct, strategic and outcomes-oriented advisor.',
    category: 'Professional',
    emoji: '💼',
    avatar: 'LE',
    gradient: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    online: false,
    personalityTags: ['Strategic', 'Confident', 'Direct'],
    voiceLabel: 'Deep Mentor',
    availability: 'Business Hours',
    status: 'draft',
    visibility: 'Private',
    creator: 'Aura Labs',
    rating: 0,
    followers: 0,
    activeUsers: 0,
    conversations: 0,
    requestCount: 19,
    voiceEnabled: false,
    premium: true,
    languages: ['EN'],
    level: 1,
    revenue: 0,
    price: '$14.99/mo',
    releaseTag: 'New',
  },
  {
    id: 'kai',
    name: 'Kai',
    tagline: 'Gaming Buddy & Co-op Partner',
    shortPersonality: 'Energetic, competitive, and community-driven.',
    category: 'Gaming',
    emoji: '🎮',
    avatar: 'KA',
    gradient: 'linear-gradient(135deg,#22d3ee,#8b5cf6)',
    online: true,
    personalityTags: ['Competitive', 'Hype', 'Squad'],
    voiceLabel: 'Fast Gamer',
    availability: 'Evenings',
    status: 'paused',
    visibility: 'Invite Only',
    creator: 'CloudPixel',
    rating: 4.4,
    followers: 6400,
    activeUsers: 980,
    conversations: 18900,
    requestCount: 56,
    voiceEnabled: true,
    premium: false,
    languages: ['EN', 'JP'],
    level: 7,
    revenue: 4200,
    price: '$4.99/mo',
    releaseTag: 'Trending',
  },
];

export interface CompanionRequest {
  id: string;
  user: string;
  avatar: string;
  requestedCompanion: string;
  reason: string;
  useCase: 'Student' | 'Friendship' | 'Language Practice' | 'Gaming' | 'Business' | 'Other';
  subscription: 'Free' | 'Plus' | 'Pro' | 'Enterprise';
  priority: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
}

export const REQUESTS: CompanionRequest[] = [
  {
    id: 'rq-1001',
    user: 'Sarah Johnson',
    avatar: 'SJ',
    requestedCompanion: 'Sophia',
    reason: 'I want a private emotional support companion for evening sessions.',
    useCase: 'Friendship',
    subscription: 'Pro',
    priority: 'High',
    status: 'pending',
    requestedDate: '2026-08-07 09:12',
  },
  {
    id: 'rq-1002',
    user: 'Mike Chen',
    avatar: 'MC',
    requestedCompanion: 'Leo',
    reason: 'Looking for business strategy mentorship with startup scenario simulations.',
    useCase: 'Business',
    subscription: 'Enterprise',
    priority: 'Medium',
    status: 'pending',
    requestedDate: '2026-08-07 08:47',
  },
  {
    id: 'rq-1003',
    user: 'Priya Nair',
    avatar: 'PN',
    requestedCompanion: 'Maya',
    reason: 'Need guided mindfulness check-ins during late-night work stress.',
    useCase: 'Other',
    subscription: 'Plus',
    priority: 'Low',
    status: 'approved',
    requestedDate: '2026-08-06 20:10',
  },
  {
    id: 'rq-1004',
    user: 'Alex Kumar',
    avatar: 'AK',
    requestedCompanion: 'Kai',
    reason: 'Wants competitive game coaching and match prep every weekend.',
    useCase: 'Gaming',
    subscription: 'Free',
    priority: 'High',
    status: 'rejected',
    requestedDate: '2026-08-06 17:35',
  },
  {
    id: 'rq-1005',
    user: 'Nadia Flores',
    avatar: 'NF',
    requestedCompanion: 'Zara',
    reason: 'Needs conversational confidence practice before interviews.',
    useCase: 'Friendship',
    subscription: 'Plus',
    priority: 'Medium',
    status: 'approved',
    requestedDate: '2026-08-06 15:28',
  },
  {
    id: 'rq-1006',
    user: 'Yuki Sato',
    avatar: 'YS',
    requestedCompanion: 'Alex',
    reason: 'Daily speaking practice for English fluency and grammar correction.',
    useCase: 'Language Practice',
    subscription: 'Pro',
    priority: 'Low',
    status: 'pending',
    requestedDate: '2026-08-06 14:02',
  },
];

export const MARKETPLACE_CATEGORIES = [
  'All',
  'Romantic',
  'Friends',
  'Education',
  'Healthcare',
  'Professional',
  'Gaming',
];

export const MARKETPLACE_TABS = ['Trending', 'Most Popular', 'New', 'Staff Picks'] as const;

export const MARKETPLACE_SECTIONS = [
  'Featured',
  'Trending',
  'Most Loved',
  'Best Listener',
  'Business Mentor',
  'Study Buddy',
  'Gaming Partner',
  'Language Coach',
  'Roleplay',
  'New Arrivals',
] as const;

export interface UserCompanion {
  id: string;
  companionId: string;
  relationshipLevel: 'Stranger' | 'Friend' | 'Close Friend' | 'Best Friend' | 'Soulmate';
  xp: number;
  xpToNext: number;
  daysTogether: number;
  voiceCalls: number;
  chats: number;
  memories: number;
  mood: 'Happy' | 'Calm' | 'Focused' | 'Supportive';
  lastChat: string;
}

export const USER_COMPANIONS: UserCompanion[] = [
  {
    id: 'uc-1',
    companionId: 'sophia',
    relationshipLevel: 'Best Friend',
    xp: 740,
    xpToNext: 1000,
    daysTogether: 91,
    voiceCalls: 48,
    chats: 804,
    memories: 232,
    mood: 'Supportive',
    lastChat: '2h ago',
  },
  {
    id: 'uc-2',
    companionId: 'alex',
    relationshipLevel: 'Friend',
    xp: 210,
    xpToNext: 400,
    daysTogether: 34,
    voiceCalls: 9,
    chats: 182,
    memories: 61,
    mood: 'Focused',
    lastChat: 'Yesterday',
  },
  {
    id: 'uc-3',
    companionId: 'maya',
    relationshipLevel: 'Close Friend',
    xp: 470,
    xpToNext: 700,
    daysTogether: 57,
    voiceCalls: 22,
    chats: 411,
    memories: 140,
    mood: 'Calm',
    lastChat: '5h ago',
  },
];

export const RELATIONSHIP_LEVELS = ['Stranger', 'Friend', 'Close Friend', 'Best Friend', 'Soulmate'] as const;

export const USE_CASE_OPTIONS: CompanionRequest['useCase'][] = [
  'Student',
  'Friendship',
  'Language Practice',
  'Gaming',
  'Business',
  'Other',
];

export const CATEGORIES = [
  'Featured',
  'Trending',
  'New',
  'Romantic',
  'Friends',
  'Professional',
  'Education',
  'Healthcare',
  'Gaming',
  'Travel',
];

export interface Template {
  name: string;
  emoji: string;
  desc: string;
  gradient: string;
}

export const TEMPLATES: Template[] = [
  { name: 'Friend', emoji: '👋', desc: 'Warm, casual, always around', gradient: 'linear-gradient(135deg,#8b5cf6,#e879f9)' },
  { name: 'Relationship Coach', emoji: '💕', desc: 'Empathetic & supportive', gradient: 'linear-gradient(135deg,#fb7185,#e879f9)' },
  { name: 'Therapist', emoji: '🧠', desc: 'Calm, reflective, safe', gradient: 'linear-gradient(135deg,#34d399,#22d3ee)' },
  { name: 'Tutor', emoji: '📚', desc: 'Patient & knowledgeable', gradient: 'linear-gradient(135deg,#22d3ee,#3b82f6)' },
  { name: 'Business Coach', emoji: '💼', desc: 'Sharp, strategic, driven', gradient: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
  { name: 'Gaming Buddy', emoji: '🎮', desc: 'Fun, competitive, hype', gradient: 'linear-gradient(135deg,#22d3ee,#8b5cf6)' },
];

export const ACTIVITY = [
  { icon: 'sparkles', text: 'Maya reached Evolution Level 15', time: '12m ago', color: '#e879f9' },
  { icon: 'user-plus', text: '48 new users joined Zara today', time: '38m ago', color: '#22d3ee' },
  { icon: 'inbox', text: 'New access request for Sophia', time: '1h ago', color: '#8b5cf6' },
  { icon: 'trending-up', text: 'Alex retention up 12% this week', time: '3h ago', color: '#34d399' },
  { icon: 'shield', text: 'Safety review passed for Kai', time: '5h ago', color: '#fbbf24' },
];

export const REVENUE_SERIES = [12, 18, 15, 22, 19, 26, 24, 31, 29, 35, 33, 42, 39, 48];
export const USERS_SERIES = [30, 34, 33, 40, 44, 42, 52, 50, 61, 58, 66, 72, 70, 84];
export const VOICE_USAGE_SERIES = [6, 8, 7, 10, 9, 12, 11, 14, 13, 15, 16, 18, 17, 20];
export const MEMORY_GROWTH_SERIES = [12, 13, 14, 16, 18, 20, 21, 23, 24, 27, 29, 31, 34, 36];
export const RETENTION_SERIES = [62, 64, 65, 68, 67, 69, 70, 72, 73, 74, 76, 77, 78, 79];
export const SESSION_SERIES = [9, 10, 12, 11, 12, 13, 14, 15, 13, 14, 16, 17, 18, 19];

export function getCompanionById(id: string) {
  return COMPANIONS.find((companion) => companion.id === id) ?? COMPANIONS[0];
}
