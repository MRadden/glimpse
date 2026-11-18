import type { FeedItem, ParsedExport, Platform, Signal } from '../types'
import { classify } from '../lib/topics'

/**
 * Made-up people for the demo. Their posts are not real posts, so the
 * viewer draws a styled card for each one in place of an embedded video.
 */
export interface Persona {
  key: string
  name: string
  tagline: string
  avatar: string
  exports: ParsedExport[]
}

type Row = [Platform, string, string, Signal?]

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 15)

function build(key: string, rows: Row[], extraTopics: string[], searches: string[]): ParsedExport[] {
  const by: Record<Platform, ParsedExport> = {
    tiktok: { platform: 'tiktok', items: [], searches: [], platformTopics: [], creatorViews: [], files: [] },
    youtube: { platform: 'youtube', items: [], searches: [], platformTopics: [], creatorViews: [], files: [] },
    instagram: { platform: 'instagram', items: [], searches: [], platformTopics: [], creatorViews: [], files: [] },
  }
  rows.forEach(([platform, title, creator, signal = 'watched'], i) => {
    const item: FeedItem = {
      id: `demo-${key}-${i}`,
      platform,
      url: '',
      title,
      creator,
      time: NOW - ((i * 37) % 60) * DAY - i * 3_600_000,
      signal,
      topics: classify(title, creator),
      demo: true,
    }
    by[platform].items.push(item)
  })
  by.instagram.platformTopics.push(...extraTopics.flatMap((t) => classify(t)))
  searches.forEach((q, i) => by.tiktok.searches.push({ platform: 'tiktok', query: q, time: NOW - i * DAY }))
  return Object.values(by).filter((e) => e.items.length)
}

export const PERSONAS: Persona[] = [
  {
    key: 'jordan',
    name: 'Jordan',
    tagline: 'Up before sunrise. Usually in a tree stand.',
    avatar: '🦌',
    exports: build(
      'jordan',
      [
        ['tiktok', 'Opening morning of deer season — he came in at 40 yards 🦌 #hunting #bowhunting', '@timberline.tom', 'liked'],
        ['tiktok', 'How I set up a tree stand in under 10 minutes #hunting #outdoors', '@ridge.runner'],
        ['youtube', 'Elk Hunting in Colorado: 7 Days in the Backcountry', 'Meat Eater Outdoors', 'liked'],
        ['tiktok', 'POV: your dog hears you grab the duck calls 😂 #funny #dog', '@labradorlife', 'liked'],
        ['instagram', 'Sunrise on the marsh. Duck season is here.', 'marsh.mornings', 'saved'],
        ['tiktok', 'Biggest bass of my life on a topwater frog 🎣 #bassfishing', '@kayak.kyle', 'liked'],
        ['youtube', 'Ice Fishing for Walleye — Catch and Cook on the Ice', 'North Country Angler'],
        ['tiktok', 'Smoked brisket, 14 hours, worth every minute #bbq #grill', '@pitmaster.pete', 'liked'],
        ['tiktok', 'Truck camping setup tour — sleep anywhere #camping #truck', '@overland.ollie'],
        ['youtube', 'Restoring a 1978 Ford F-150 — Full Engine Rebuild', 'Garage Grease'],
        ['tiktok', 'Grandpa reacts to modern country music 😂 #comedy #country', '@farmhouse.funnies', 'liked'],
        ['instagram', 'Fresh venison backstrap on the grill. Field to table.', 'wild.game.kitchen', 'liked'],
        ['tiktok', 'Calling in a turkey with a box call — listen to this gobble #hunting', '@spring.gobbler'],
        ['youtube', 'NFL Week 11 Highlights — Every Touchdown', 'NFL Highlights'],
        ['tiktok', 'Morning chores on the ranch with 200 head of cattle #ranch #farm', '@cattle.co'],
        ['tiktok', 'When your wife says pick one hobby 😂 #funny #hunting', '@camo.comedy', 'liked'],
        ['instagram', 'Fly fishing the Madison River at golden hour', 'trout.bum.diaries'],
        ['youtube', 'Survival Shelter Build in the Wilderness — No Tools', 'Bushcraft Basics'],
        ['tiktok', 'Live performance: country song written on my porch 🎸 #countrymusic', '@porch.songs', 'saved'],
        ['tiktok', 'Truck detailing satisfying clean #truck #detailing', '@shine.shop'],
        ['instagram', 'Rodeo weekend. Best 8 seconds of the year.', 'rodeo.dust'],
        ['youtube', 'Best Budget Hunting Rifles of 2026 — Review', 'Range Day Reviews'],
        ['tiktok', 'Golden retriever learns to retrieve ducks 🐶 #dog #duck season', '@gundog.goldie', 'liked'],
        ['tiktok', 'Cast iron cornbread like grandma made #cooking #recipe', '@southern.skillet'],
        ['youtube', 'Building a Cabin by Myself — Part 6', 'Off Grid Builds'],
        ['tiktok', 'Off-road trail in the Ozarks gets muddy #offroad #jeep', '@mud.season'],
        ['instagram', 'Packing list for a 5-day backpacking hunt', 'backcountry.packs', 'saved'],
        ['tiktok', 'Standup bit about camping with in-laws 😂 #standup #comedy', '@trailside.laughs'],
      ],
      ['Hunting', 'Fishing', 'Trucks', 'Country music', 'Barbecue'],
      ['deer hunting tips', 'best fishing lures', 'smoked brisket recipe', 'jeep trail ozarks'],
    ),
  },
  {
    key: 'maya',
    name: 'Maya',
    tagline: 'Will send you a recipe at 1 a.m.',
    avatar: '🍜',
    exports: build(
      'maya',
      [
        ['tiktok', 'Crispy chili oil noodles in 10 minutes 🌶️ #recipe #cooking', '@noodle.nights', 'liked'],
        ['instagram', 'Sunday sourdough. Open crumb finally!', 'crumb.club', 'saved'],
        ['tiktok', 'My cat judging my cooking every night 🐈 #cats #funny', '@mochi.the.cat', 'liked'],
        ['youtube', 'A Week of Street Food in Tokyo', 'Wander Bites', 'liked'],
        ['tiktok', 'Rescue kitten sees snow for the first time 😭 #kitten #rescue', '@paws.and.purrs', 'liked'],
        ['tiktok', 'Grocery haul + meal prep for the week #mealprep #food', '@prep.with.priya'],
        ['instagram', 'Hidden beach in Portugal — save for later', 'tiny.passport', 'saved'],
        ['tiktok', 'Sketch: when your friend says "I\'m not hungry" 😂 #comedy #skit', '@brunch.bunch', 'liked'],
        ['youtube', 'Gordon-style Beef Wellington — Step by Step', 'Kitchen Theory'],
        ['tiktok', 'My 5-minute skincare routine for glowing skin #skincare', '@dewy.days'],
        ['instagram', 'Pasta from scratch with my nonna 🍝', 'nonna.knows', 'liked'],
        ['tiktok', 'Booktok: 5 books that made me cry #booktok #books', '@chapter.cozy', 'saved'],
        ['youtube', 'Why Japanese Convenience Stores Are So Good — Explained', 'Culture Explained'],
        ['tiktok', 'Couples try each other\'s comfort food 😂 #couple #food', '@two.forks', 'liked'],
        ['tiktok', 'Thrift haul: vintage finds under $20 #thrift #fashion', '@second.stitch'],
        ['instagram', 'Matcha latte art practice, day 47', 'whisk.and.foam'],
        ['tiktok', 'Dog meets the new cat for the first time 🐶🐈 #pets', '@the.full.house', 'liked'],
        ['youtube', 'Italy Road Trip — Amalfi Coast Travel Vlog', 'Slow Travel Co'],
        ['tiktok', 'Pottery wheel fails and wins 😅 #pottery #art', '@clay.days'],
        ['tiktok', 'Korean fried chicken at home — the double fry trick #cooking', '@crunch.lab', 'saved'],
        ['instagram', 'Morning yoga flow by the window', 'soft.stretch'],
        ['tiktok', 'Self care Sunday reset routine #selfcare #wellness', '@slow.sunday'],
        ['youtube', 'Stand-up: My Mom Reads My Texts', 'Laugh Factory Clips', 'liked'],
        ['tiktok', 'Tiny apartment kitchen organization #organization #home decor', '@small.space.sam'],
      ],
      ['Cooking', 'Travel', 'Cats', 'Books', 'Skincare'],
      ['easy dinner recipe', 'tokyo travel', 'cat toys', 'book recommendations'],
    ),
  },
  {
    key: 'sam',
    name: 'Sam',
    tagline: 'Has opinions about keyboards.',
    avatar: '🎧',
    exports: build(
      'sam',
      [
        ['youtube', 'I Built the Quietest Gaming PC Possible', 'Silent Rigs', 'liked'],
        ['tiktok', 'This AI tool writes my code reviews now #ai #coding', '@dev.dan', 'liked'],
        ['youtube', 'Zelda: Every Secret in the New Update', 'Hyrule Hunter'],
        ['tiktok', '5-day gym split that finally worked for me #gym #fitness', '@lift.log', 'saved'],
        ['tiktok', 'Investing $100 a month for 10 years — the math #investing #personal finance', '@money.minute', 'liked'],
        ['instagram', 'Desk setup 2026 — minimal and clean', 'desk.goals'],
        ['youtube', 'iPhone vs Pixel — Camera Review', 'Tech Weekly'],
        ['tiktok', 'Speedrun world record reaction 🤯 #speedrun #gaming', '@frame.perfect', 'liked'],
        ['tiktok', 'Marathon training week 12 — long run day #running', '@miles.with.max'],
        ['youtube', 'Black Holes Explained in 12 Minutes', 'Cosmic Curious', 'liked'],
        ['tiktok', 'Anime fights that live rent free in my head #anime', '@otaku.oracle'],
        ['instagram', 'Mechanical keyboard sound test — lubed switches', 'clack.lab', 'saved'],
        ['tiktok', 'When the code works on the first try 😂 #programming #meme', '@stack.overflowing', 'liked'],
        ['youtube', 'NBA Top 10 Plays of the Week', 'NBA Highlights'],
        ['tiktok', 'High protein meal prep for the gym #protein #mealprep', '@macro.mike'],
        ['tiktok', 'Startup founder day in the life #startup #entrepreneur', '@seed.stage'],
        ['youtube', 'History of the Roman Empire — Documentary', 'Deep Past'],
        ['tiktok', 'Calisthenics progression: first muscle-up 💪 #calisthenics', '@bar.brothers', 'liked'],
        ['instagram', 'Film photography walk through the city', 'grain.and.light'],
        ['tiktok', 'Lofi remix of a game soundtrack 🎧 #music #remix', '@pixel.beats', 'saved'],
        ['youtube', 'Netflix Series Trailer Breakdown', 'Screen Rant Clips'],
        ['tiktok', 'Unboxing the new handheld console #gaming #unboxing', '@handheld.hub'],
      ],
      ['Video games', 'Technology', 'Fitness', 'Investing'],
      ['best gaming laptop', 'muscle up tutorial', 'index funds explained'],
    ),
  },
]
