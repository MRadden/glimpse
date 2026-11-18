import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseTikTok } from '../src/parsers/tiktok'
import { parseYouTube } from '../src/parsers/youtube'
import { parseInstagram } from '../src/parsers/instagram'
import { parseAll, type ExportFile } from '../src/parsers'
import { buildProfile, pickFeed } from '../src/lib/score'
import { classify, classifyHandle } from '../src/lib/topics'
import { decodeSnapshot, encodeSnapshot } from '../src/share/codec'
import { PERSONAS } from '../src/demo/personas'

function load(dir: string, only?: string[]): ExportFile[] {
  const root = join(__dirname, 'fixtures', dir)
  return readdirSync(root)
    .filter((n) => !only || only.includes(n))
    .map((n) => ({ name: `export/${dir}/${n}`, text: readFileSync(join(root, n), 'utf8') }))
}

describe('topics', () => {
  it('finds topics with word boundaries and hashtags', () => {
    expect(classify('Opening day #BowHunting')).toContain('Hunting & Outdoors')
    expect(classify('category theory')).not.toContain('Pets & Animals')
    expect(classify('my cats')).toContain('Pets & Animals')
  })
})

describe('TikTok parser', () => {
  const r = parseTikTok(load('tiktok'))
  it('reads watched, liked and saved videos', () => {
    expect(r.items.filter((i) => i.signal === 'watched')).toHaveLength(2)
    expect(r.items.filter((i) => i.signal === 'liked')).toHaveLength(1)
    expect(r.items.filter((i) => i.signal === 'saved')).toHaveLength(1)
    expect(r.items[0].embedUrl).toBe('https://www.tiktok.com/embed/v2/7421234567890123456')
    expect(r.items[0].time).toBe(Date.parse('2026-10-01T18:22:10Z'))
  })
  it('reads searches and turns them into topics', () => {
    expect(r.searches.map((s) => s.query)).toEqual(['deer hunting tips', 'easy pasta recipe'])
    expect(r.platformTopics).toEqual(expect.arrayContaining(['Hunting & Outdoors', 'Cooking & Food']))
  })
})

describe('YouTube parser', () => {
  it('reads JSON watch history, skips ads and removed videos, marks likes', () => {
    const r = parseYouTube(load('youtube', ['watch-history.json', 'search-history.json', 'Liked videos-videos.csv']))
    expect(r.items.map((i) => i.id)).toEqual(['yt-abcdEFGH123', 'yt-catCAT12345'])
    expect(r.items[0].title).toBe('Elk Hunting in Colorado: 7 Days in the Backcountry')
    expect(r.items[0].creator).toBe('Outdoor Channel')
    expect(r.items[0].topics[0]).toBe('Hunting & Outdoors')
    expect(r.items[1].signal).toBe('liked')
    expect(r.searches[0].query).toBe('best fishing lures')
  })
  it('reads the HTML format too', () => {
    const r = parseYouTube(load('youtube', ['watch-history.html']))
    expect(r.items).toHaveLength(1)
    expect(r.items[0].title).toBe('Easy Sourdough Bread Recipe')
    expect(r.items[0].creator).toBe('Bread Lab')
    expect(r.items[0].topics).toContain('Cooking & Food')
    expect(r.items[0].time).toBe(Date.parse('2026-10-06T21:15:00Z'))
  })
})

describe('Instagram parser', () => {
  const r = parseInstagram(load('instagram'))
  it('reads liked posts and reels with embed links', () => {
    expect(r.items).toHaveLength(2)
    expect(r.items[0].embedUrl).toBe('https://www.instagram.com/p/CxYz123AbC/embed/')
    expect(r.items[1].embedUrl).toBe('https://www.instagram.com/reel/DaBc456XyZ/embed/')
    expect(r.items[0].creator).toBe('fishing.daily')
    expect(r.items[0].topics).toContain('Fishing')
  })
  it('reads viewed creators and platform topics', () => {
    expect(r.creatorViews).toHaveLength(2)
    expect(r.platformTopics).toEqual(expect.arrayContaining(['Hunting & Outdoors', 'Cooking & Food', 'Pets & Animals']))
  })
})

describe('profile and sharing', () => {
  const all = [...load('tiktok'), ...load('youtube', ['watch-history.json', 'search-history.json']), ...load('instagram')]
  const parsed = parseAll(all)
  const profile = buildProfile(parsed)

  it('detects all three platforms and merges duplicates', () => {
    expect(profile.platforms.sort()).toEqual(['instagram', 'tiktok', 'youtube'])
    // the TikTok video that was watched and liked becomes one liked item
    expect(profile.items.filter((i) => i.id === 'tt-7421234567890123456')).toHaveLength(1)
    expect(profile.items.find((i) => i.id === 'tt-7421234567890123456')!.signal).toBe('liked')
  })

  it('ranks interests that add up to 100%', () => {
    const sum = profile.interests.reduce((a, b) => a + b.share, 0)
    expect(sum).toBeGreaterThan(0.9)
    expect(sum).toBeLessThanOrEqual(1.0001)
    expect(profile.interests[0].topic).toBe('Hunting & Outdoors')
  })

  it('round-trips a snapshot through the share link', () => {
    const snap = {
      owner: 'Alex',
      minutes: 15,
      createdAt: 1_790_000_000_000,
      interests: profile.interests,
      creators: profile.creators,
      items: pickFeed(profile.items),
    }
    const back = decodeSnapshot(encodeSnapshot(snap))!
    expect(back.owner).toBe('Alex')
    expect(back.items.map((i) => i.embedUrl).sort()).toEqual(snap.items.map((i) => i.embedUrl).sort())
    expect(back.interests[0].topic).toBe(snap.interests[0].topic)
  })

  it('keeps a full demo snapshot link small', () => {
    for (const p of PERSONAS) {
      const prof = buildProfile(p.exports)
      const code = encodeSnapshot({ owner: p.name, minutes: 5, createdAt: 0, interests: prof.interests, creators: prof.creators, items: pickFeed(prof.items) })
      expect(code.length).toBeLessThan(6000)
      expect(prof.interests.length).toBeGreaterThan(4)
    }
  })

  it('rejects a broken link', () => {
    expect(decodeSnapshot('not-a-real-snapshot')).toBeNull()
  })
})

describe('Instagram parser, newer export format', () => {
  const r = parseInstagram(load('instagram_new'))
  it('reads posts with nested owner data and prefers the username', () => {
    expect(r.items).toHaveLength(1)
    expect(r.items[0].embedUrl).toBe('https://www.instagram.com/reel/NeW123abc/embed/')
    expect(r.items[0].creator).toBe('bassfishingpro')
    expect(r.items[0].topics).toContain('Fishing')
    expect(r.items[0].time).toBe(1_790_000_000_000)
  })
  it('reads topic lists, keeps unknown content topics, and skips unknown ad categories', () => {
    expect(r.platformTopics).toEqual(expect.arrayContaining(['Pets & Animals', 'Home & DIY', 'Formula Racing', 'Hunting & Outdoors']))
    expect(r.platformTopics).not.toContain('Engaged Shoppers')
    expect(r.platformTopics).not.toContain('Engaged shoppers')
  })
  it('finds topics inside joined-up creator names', () => {
    expect(r.creatorViews[0].name).toBe('dailycomedyclips')
    expect(classifyHandle('dailycomedyclips')).toContain('Comedy')
    expect(classifyHandle('the.cat.lady')).toContain('Pets & Animals')
    expect(classifyHandle('xyz_123')).toEqual([])
  })
  it('makes an interest map from Instagram data alone', () => {
    const prof = buildProfile([r])
    expect(prof.interests.length).toBeGreaterThanOrEqual(4)
  })
})
