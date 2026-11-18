import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CreatorScore, FeedItem, InterestScore, Profile, Snapshot } from './types'
import { pickFeed } from './lib/score'

export const creatorKey = (c: { platform: string; name: string }) => `${c.platform}:${c.name.toLowerCase()}`

interface Draft {
  profile: Profile | null
  /** Name of the demo persona, or null for a real upload. */
  demoName: string | null
  owner: string
  minutes: number
  hiddenTopics: Set<string>
  hiddenCreators: Set<string>
  hiddenItems: Set<string>
}

interface Store extends Draft {
  load: (profile: Profile, demoName?: string | null) => void
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
    demoName: null,
    owner: '',
    minutes: 15,
    hiddenTopics: new Set(),
    hiddenCreators: new Set(),
    hiddenItems: new Set(),
  })

  const load = useCallback((profile: Profile, demoName: string | null = null) => {
    setD({ profile, demoName, owner: demoName ?? '', minutes: 15, hiddenTopics: new Set(), hiddenCreators: new Set(), hiddenItems: new Set() })
  }, [])

  const derived = useMemo(() => {
    const p = d.profile
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
  }, [d])

  const store: Store = {
    ...d,
    ...derived,
    load,
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
