/**
 * Local topic dictionary. Each topic has keywords that we look for in
 * titles, hashtags, creator names, searches and platform topic lists.
 * Simple and private: nothing leaves the device.
 */
export interface TopicDef {
  label: string
  emoji: string
  /** Two colors for gradients. */
  colors: [string, string]
  keywords: string[]
}

export const TOPICS: TopicDef[] = [
  { label: 'Comedy', emoji: '😂', colors: ['#f59e0b', '#ef4444'], keywords: ['comedy', 'funny', 'meme', 'memes', 'prank', 'standup', 'stand-up', 'sketch', 'skit', 'lol', 'joke', 'jokes', 'humor', 'humour', 'parody', 'roast'] },
  { label: 'Hunting & Outdoors', emoji: '🦌', colors: ['#65a30d', '#3f6212'], keywords: ['hunting', 'hunt', 'deer', 'elk', 'bowhunting', 'archery', 'duck season', 'turkey season', 'camping', 'hiking', 'outdoors', 'backpacking', 'wilderness', 'survival', 'bushcraft', 'trail'] },
  { label: 'Fishing', emoji: '🎣', colors: ['#0891b2', '#1e40af'], keywords: ['fishing', 'bass', 'fly fishing', 'catch', 'angler', 'trout', 'kayak fishing', 'ice fishing', 'lure'] },
  { label: 'Pets & Animals', emoji: '🐾', colors: ['#fb923c', '#ec4899'], keywords: ['dog', 'dogs', 'puppy', 'cat', 'cats', 'kitten', 'pet', 'pets', 'animal', 'animals', 'rescue', 'wildlife', 'zoo', 'bird', 'horse', 'golden retriever'] },
  { label: 'Cooking & Food', emoji: '🍳', colors: ['#f97316', '#dc2626'], keywords: ['recipe', 'recipes', 'cooking', 'cook', 'food', 'baking', 'bake', 'chef', 'dinner', 'breakfast', 'pasta', 'bbq', 'barbecue', 'grill', 'foodie', 'restaurant', 'mukbang', 'meal prep', 'sourdough'] },
  { label: 'Fitness', emoji: '💪', colors: ['#22c55e', '#0ea5e9'], keywords: ['workout', 'gym', 'fitness', 'lifting', 'weightlifting', 'crossfit', 'running', 'marathon', 'yoga', 'pilates', 'protein', 'bodybuilding', 'calisthenics', 'cardio'] },
  { label: 'Sports', emoji: '🏈', colors: ['#2563eb', '#7c3aed'], keywords: ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'hockey', 'golf', 'tennis', 'ufc', 'mma', 'f1', 'formula 1', 'highlights', 'world cup', 'premier league'] },
  { label: 'Music', emoji: '🎵', colors: ['#a855f7', '#ec4899'], keywords: ['music', 'song', 'songs', 'cover', 'concert', 'guitar', 'piano', 'singer', 'album', 'rapper', 'rap', 'hip hop', 'country music', 'live performance', 'band', 'drums', 'remix'] },
  { label: 'Dance', emoji: '💃', colors: ['#ec4899', '#f43f5e'], keywords: ['dance', 'dancing', 'choreography', 'dancer', 'dance challenge'] },
  { label: 'Gaming', emoji: '🎮', colors: ['#6366f1', '#06b6d4'], keywords: ['gaming', 'gamer', 'video games', 'minecraft', 'fortnite', 'xbox', 'playstation', 'nintendo', 'zelda', 'speedrun', 'twitch', 'esports', 'call of duty', 'valorant', 'roblox', 'gameplay'] },
  { label: 'Tech', emoji: '💻', colors: ['#0ea5e9', '#6366f1'], keywords: ['tech', 'technology', 'iphone', 'android', 'apple', 'laptop', 'coding', 'programming', 'software', 'ai', 'chatgpt', 'claude', 'gadget', 'gadgets', 'unboxing', 'review', 'pc build', 'developer'] },
  { label: 'Money & Business', emoji: '📈', colors: ['#10b981', '#065f46'], keywords: ['investing', 'stocks', 'finance', 'money', 'budget', 'crypto', 'bitcoin', 'real estate', 'entrepreneur', 'business', 'side hustle', 'startup', 'personal finance', 'retirement'] },
  { label: 'Fashion & Style', emoji: '👗', colors: ['#f472b6', '#c026d3'], keywords: ['fashion', 'outfit', 'outfits', 'ootd', 'style', 'streetwear', 'sneakers', 'thrift', 'haul', 'grwm', 'get ready with me'] },
  { label: 'Beauty & Skincare', emoji: '💄', colors: ['#fda4af', '#e11d48'], keywords: ['makeup', 'skincare', 'beauty', 'hair', 'nails', 'lipstick', 'skin care', 'routine', 'tutorial makeup'] },
  { label: 'Travel', emoji: '✈️', colors: ['#38bdf8', '#14b8a6'], keywords: ['travel', 'trip', 'vacation', 'beach', 'italy', 'japan', 'paris', 'flight', 'hotel', 'road trip', 'backpacker', 'island', 'tour'] },
  { label: 'Cars & Trucks', emoji: '🛻', colors: ['#64748b', '#ef4444'], keywords: ['car', 'cars', 'truck', 'trucks', 'jeep', 'mustang', 'tesla', 'offroad', 'off-road', 'drift', 'mechanic', 'engine', 'motorcycle', 'detailing', 'diesel'] },
  { label: 'Home & DIY', emoji: '🔨', colors: ['#d97706', '#78350f'], keywords: ['diy', 'renovation', 'home decor', 'woodworking', 'garden', 'gardening', 'cleaning', 'organize', 'organization', 'interior', 'build', 'tiny house', 'homestead', 'homesteading'] },
  { label: 'Parenting & Family', emoji: '👶', colors: ['#fbbf24', '#f472b6'], keywords: ['mom', 'dad', 'parenting', 'baby', 'toddler', 'kids', 'family', 'pregnancy', 'momlife', 'dadlife'] },
  { label: 'Relationships', emoji: '💞', colors: ['#f43f5e', '#a855f7'], keywords: ['relationship', 'relationships', 'dating', 'boyfriend', 'girlfriend', 'couple', 'couples', 'marriage', 'wedding', 'husband', 'wife'] },
  { label: 'News & Politics', emoji: '📰', colors: ['#475569', '#1e293b'], keywords: ['news', 'politics', 'election', 'congress', 'senate', 'president', 'policy', 'breaking', 'debate', 'government'] },
  { label: 'Science & Learning', emoji: '🔭', colors: ['#3b82f6', '#8b5cf6'], keywords: ['science', 'space', 'nasa', 'physics', 'history', 'documentary', 'explained', 'education', 'learning', 'facts', 'biology', 'chemistry', 'astronomy', 'psychology'] },
  { label: 'Movies & TV', emoji: '🎬', colors: ['#e11d48', '#7c2d12'], keywords: ['movie', 'movies', 'film', 'trailer', 'netflix', 'series', 'tv show', 'marvel', 'star wars', 'reaction', 'anime', 'episode', 'cinema'] },
  { label: 'Art & Design', emoji: '🎨', colors: ['#f59e0b', '#8b5cf6'], keywords: ['art', 'artist', 'drawing', 'painting', 'design', 'illustration', 'sketchbook', 'photography', 'pottery', 'ceramics', 'tattoo'] },
  { label: 'Books', emoji: '📚', colors: ['#a16207', '#7c3aed'], keywords: ['book', 'books', 'booktok', 'reading', 'novel', 'author', 'library', 'book review'] },
  { label: 'Wellness & Mental Health', emoji: '🧘', colors: ['#2dd4bf', '#818cf8'], keywords: ['mental health', 'therapy', 'anxiety', 'wellness', 'meditation', 'self care', 'selfcare', 'mindfulness', 'healing', 'motivation', 'self improvement'] },
  { label: 'Faith & Spirituality', emoji: '🕊️', colors: ['#fde68a', '#93c5fd'], keywords: ['faith', 'church', 'bible', 'jesus', 'god', 'prayer', 'christian', 'spirituality', 'astrology', 'tarot', 'zodiac'] },
  { label: 'Country Life', emoji: '🤠', colors: ['#b45309', '#57534e'], keywords: ['country', 'ranch', 'farm', 'farming', 'cowboy', 'rodeo', 'tractor', 'cattle', 'farmer'] },
]

export const TOPIC_BY_LABEL: Record<string, TopicDef> = Object.fromEntries(TOPICS.map((t) => [t.label, t]))

export const FALLBACK_TOPIC: TopicDef = {
  label: 'Other',
  emoji: '✨',
  colors: ['#6366f1', '#ec4899'],
  keywords: [],
}

export function topicDef(label?: string): TopicDef {
  return (label && TOPIC_BY_LABEL[label]) || FALLBACK_TOPIC
}

// Build one regex for each topic. Word boundaries stop "cat" from matching "category".
const MATCHERS = TOPICS.map((t) => ({
  label: t.label,
  re: new RegExp(
    `(^|[^a-z0-9])(${t.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(s)?(?=$|[^a-z0-9])`,
    'i',
  ),
}))

/** Return the topics that a piece of text is about, best match first. */
export function classify(...texts: (string | undefined)[]): string[] {
  const text = texts
    .filter(Boolean)
    .join(' ')
    .replace(/#/g, ' ')
    // split camelCase hashtags: #BassFishing -> Bass Fishing
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
  if (!text.trim()) return []
  const found: string[] = []
  for (const m of MATCHERS) if (m.re.test(text)) found.push(m.label)
  return found
}

// Long keywords can be found inside joined-up names like "bassfishingpro".
const LONG_KEYWORDS: [string, string][] = TOPICS.flatMap((t) =>
  t.keywords.filter((k) => k.length >= 5 && !/[\s-]/.test(k)).map((k) => [k, t.label] as [string, string]),
)

/** Topics from a creator name or handle, such as "fishing.daily" or "bassfishingpro". */
export function classifyHandle(name?: string): string[] {
  if (!name) return []
  const direct = classify(name.replace(/[._]+/g, ' '))
  if (direct.length) return direct
  const flat = name.toLowerCase().replace(/[^a-z]/g, '')
  const found = new Set<string>()
  for (const [k, label] of LONG_KEYWORDS) if (flat.includes(k)) found.add(label)
  return [...found]
}
