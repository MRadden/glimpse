import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CreatorScore, FeedItem, InterestScore, ParsedExport, Platform, Profile, Snapshot } from './types'
import { profileFor } from './lib/platforms'
import { buildProfile, pickFeed } from './lib/score'

export const creatorKey = (c: { platform: string; name: string }) => `${c.platform}:${c.name.toLowerCase()}`

interface Draft {
  /** Built from all uploaded apps. */
  profile: Profile | null
  /** Parsed data for each app, kept so the profile can be rebuilt without an app. */
  exports: ParsedExport[]
  hiddenPlatforms: Set<Platform>
  /** Name of the demo persona, or null for a real upload. */
  demoName: string | null
  owner: string
  minutes: number
  hiddenTopics: Set<string>
  hiddenCreators: Set<string>
  hiddenItems: Set<string>
}

/** The glimpse that the viewer wants to compare with their own. */
export interface CompareTarget {
  id: string
  owner: string
}

const COMPARE_KEY = 'glimpse.compareWith'

function readCompare(): CompareTarget | null {
  try {
    const v = JSON.parse(localStorage.getItem(COMPARE_KEY) ?? 'null')
    return v && typeof v.id === 'string' && typeof v.owner === 'string' ? v : null
  } catch {
    return null
  }
}

interface Store extends Draft {
  compareWith: CompareTarget | null
  setCompareWith: (t: CompareTarget | null) => void
  load: (exports: ParsedExport[], demoName?: string | null) => void
  toggleApp: (p: Platform) => void
  /** Profile from only the apps that will be shared. */
  shareProfile: Profile | null
  setOwner: (s: string) => void
  setMinutes: (m: number) => void
  toggleTopic: (t: string) => void
  toggleCreator: (key: string) => void
  toggleItem: (id: string) => void
  /** Posts after the owner's choices, before the limit. */
  visibleItems: FeedItem[]
  /** The posts that go into the link. */
  feed: FeedItem[]
  interests: InterestScore[]
  creators: CreatorScore[]
  snapshot: () => Snapshot
}

const Ctx = createContext<Store | null>(null)

function toggled(set: Set<string>, v: string): Set<string> {
  const next = new Set(set)
  if (next.has(v)) next.delete(v)
  else next.add(v)
  return next
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<Draft>({
    profile: null,
    exports: [],
    hiddenPlatforms: new Set(),
    demoName: null,
    owner: '',
    minutes: 15,
    hiddenTopics: new Set(),
    hiddenCreators: new Set(),
    hiddenItems: new Set(),
  })

  const [compareWith, setCompareState] = useState<CompareTarget | null>(readCompare)
  const setCompareWith = useCallback((t: CompareTarget | null) => {
    setCompareState(t)
    try {
      if (t) localStorage.setItem(COMPARE_KEY, JSON.stringify(t))
      else localStorage.removeItem(COMPARE_KEY)
    } catch {
      /* storage is blocked; keep it in memory only */
    }
  }, [])

  const load = useCallback((exports: ParsedExport[], demoName: string | null = null) => {
    setD({
      profile: buildProfile(exports),
      exports,
      hiddenPlatforms: new Set(),
      demoName,
      owner: demoName ?? '',
      minutes: 15,
      hiddenTopics: new Set(),
      hiddenCreators: new Set(),
      hiddenItems: new Set(),
    })
  }, [])

  const shareProfile = useMemo(
    () => (d.profile && d.hiddenPlatforms.size ? profileFor(d.exports, d.hiddenPlatforms) : d.profile),
    [d.profile, d.exports, d.hiddenPlatforms],
  )

  const derived = useMemo(() => {
    const p = shareProfile
    if (!p) return { visibleItems: [], feed: [], interests: [], creators: [] }
    const interestsRaw = p.interests.filter((i) => !d.hiddenTopics.has(i.topic))
    const total = interestsRaw.reduce((a, b) => a + b.share, 0) || 1
    const interests = interestsRaw.map((i) => ({ ...i, share: i.share / total }))
    const creators = p.creators.filter((c) => !d.hiddenCreators.has(creatorKey(c)))
    const visibleItems = p.items.filter(
      (it) =>
        !d.hiddenItems.has(it.id) &&
        !it.topics.some((t) => d.hiddenTopics.has(t)) &&
        !(it.creator && d.hiddenCreators.has(creatorKey({ platform: it.platform, name: it.creator }))),
    )
    return { visibleItems, feed: pickFeed(visibleItems), interests, creators }
  }, [d, shareProfile])

  const store: Store = {
    ...d,
    ...derived,
    compareWith,
    setCompareWith,
    load,
    shareProfile,
    toggleApp: (p) =>
      setD((s) => {
        const next = toggled(s.hiddenPlatforms, p) as Set<Platform>
        // Always keep at least one app.
        return next.size >= s.exports.length ? s : { ...s, hiddenPlatforms: next }
      }),
    setOwner: (owner) => setD((s) => ({ ...s, owner })),
    setMinutes: (minutes) => setD((s) => ({ ...s, minutes })),
    toggleTopic: (t) => setD((s) => ({ ...s, hiddenTopics: toggled(s.hiddenTopics, t) })),
    toggleCreator: (k) => setD((s) => ({ ...s, hiddenCreators: toggled(s.hiddenCreators, k) })),
    toggleItem: (id) => setD((s) => ({ ...s, hiddenItems: toggled(s.hiddenItems, id) })),
    snapshot: () => ({
      owner: d.owner.trim() || 'Someone',
      minutes: d.minutes,
      createdAt: Date.now(),
      interests: derived.interests.slice(0, 10),
      creators: derived.creators.slice(0, 10),
      items: derived.feed,
    }),
  }
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be inside StoreProvider')
  return s
}
