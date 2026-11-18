import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InterestMap } from '../components/InterestMap'
import { Embed } from '../components/PostCard'
import { Button, Card, Logo, PlatformBadge, Screen, SectionTitle, Serif } from '../components/ui'
import { topicDef } from '../lib/topics'
import { loadShortId, ShortLinkError } from '../share/cloud'
import { decodeSnapshot } from '../share/codec'
import type { FeedItem, Snapshot } from '../types'

type Reaction = 'love' | 'nope'
type Phase = 'intro' | 'feed' | 'recap'

/** Old long links: the snapshot is inside the link (#/v/...). */
export default function Viewer() {
  const data = useParams()['*'] ?? ''
  const snap = useMemo(() => decodeSnapshot(data), [data])
  if (!snap) return <BrokenLink />
  return <Glimpse snap={snap} />
}

/** Short links: the snapshot is stored online (#/g/<id>). */
export function ShortViewer() {
  const { id = '' } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ id: string; snap?: Snapshot; error?: ShortLinkError } | null>(null)

  useEffect(() => {
    let live = true
    loadShortId(id)
      .then((snap) => live && setState({ id, snap }))
      .catch((e) => live && setState({ id, error: e instanceof ShortLinkError ? e : new ShortLinkError('server', 'Something went wrong.') }))
    return () => {
      live = false
    }
  }, [id, attempt])

  if (!state || state.id !== id) return <Loading />
  if (state.snap) return <Glimpse snap={state.snap} />
  const err = state.error!
  if (err.kind === 'network')
    return (
      <BrokenLink
        title="No connection"
        message={err.message}
        retry={() => {
          setState(null)
          setAttempt((a) => a + 1)
        }}
      />
    )
  if (err.kind === 'not-found') return <BrokenLink emoji="⌛" title="This glimpse is not available" message="It has expired or the link is not complete. Glimpse links last 7 days. Ask the sender for a new link." />
  return <BrokenLink title="This link does not work" message={err.message} />
}

function Loading() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/15 border-t-pink" />
        <p className="mt-5 text-[15px] text-muted">Opening the glimpse…</p>
      </div>
    </Screen>
  )
}

function Glimpse({ snap }: { snap: Snapshot }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [reactions, setReactions] = useState<Record<string, Reaction>>({})
  const [seen, setSeen] = useState(0)
  const [ended, setEnded] = useState<'time' | 'end' | 'stop'>('time')

  if (phase === 'intro') return <Intro snap={snap} onStart={() => setPhase('feed')} />
  if (phase === 'feed')
    return (
      <Feed
        snap={snap}
        reactions={reactions}
        onReact={(id, r) => setReactions((s) => ({ ...s, [id]: r }))}
        onDone={(why, count) => {
          setSeen(count)
          setEnded(why)
          setPhase('recap')
        }}
      />
    )
  return (
    <Recap
      snap={snap}
      reactions={reactions}
      seen={seen}
      ended={ended}
      onAgain={() => {
        setReactions({})
        setPhase('intro')
      }}
    />
  )
}

function Avatar({ name, size = 'lg' }: { name: string; size?: 'lg' | 'sm' }) {
  const s = size === 'lg' ? 'h-24 w-24 text-4xl' : 'h-8 w-8 text-sm'
  return <div className={`bg-brand flex shrink-0 items-center justify-center rounded-full font-semibold shadow-[0_10px_50px_-10px_rgba(236,72,153,0.7)] ${s}`}>{name.slice(0, 1).toUpperCase()}</div>
}

function Intro({ snap, onStart }: { snap: Snapshot; onStart: () => void }) {
  return (
    <Screen footer={<Button onClick={onStart}>Start my {snap.minutes}-minute glimpse</Button>}>
      <div className="pt-6">
        <Logo />
      </div>
      <div className="mt-10 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
          <Avatar name={snap.owner} />
        </motion.div>
        <h1 className="mt-6 text-[34px] leading-[1.05] font-semibold tracking-tight">
          Step into <br />
          <Serif>
            <span className="text-gradient">{snap.owner}'s feed</span>
          </Serif>
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          {snap.items.length} posts · {snap.minutes} minutes
        </p>
      </div>
      <Card className="mt-8">
        <SectionTitle>What their algorithm shows them</SectionTitle>
        <InterestMap interests={snap.interests} max={5} />
      </Card>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted/80">
        Read-only. Nothing you do here changes {snap.owner}'s real feed.
        <br />
        Tap ❤️ or 🙅 on each post. You get a recap at the end.
      </p>
    </Screen>
  )
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Feed({
  snap,
  reactions,
  onReact,
  onDone,
}: {
  snap: Snapshot
  reactions: Record<string, Reaction>
  onReact: (id: string, r: Reaction) => void
  onDone: (why: 'time' | 'end' | 'stop', seen: number) => void
}) {
  const total = snap.minutes * 60_000
  const endAt = useRef(Date.now() + total)
  const [now, setNow] = useState(Date.now())
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const maxSeen = useRef(1)
  const lastWheel = useRef(0)
  const items = snap.items
  const item: FeedItem | undefined = items[index]
  const remaining = endAt.current - now

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (remaining <= 0) onDone('time', maxSeen.current)
  }, [remaining, onDone])

  const go = useCallback(
    (d: number) => {
      const next = index + d
      if (next < 0) return
      if (next >= items.length) {
        onDone('end', items.length)
        return
      }
      setDir(d)
      setIndex(next)
      maxSeen.current = Math.max(maxSeen.current, next + 1)
    },
    [index, items.length, onDone],
  )

  const react = useCallback(
    (r: Reaction) => {
      if (!item) return
      onReact(item.id, r)
      setTimeout(() => go(1), 380)
    },
    [item, onReact, go],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') go(1)
      if (e.key === 'ArrowUp' || e.key === 'k') go(-1)
      if (e.key === 'l') react('love')
      if (e.key === 'x') react('nope')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, react])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -80 || info.velocity.y < -500) go(1)
    else if (info.offset.y > 80 || info.velocity.y > 500) go(-1)
  }
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 30 || Date.now() - lastWheel.current < 600) return
    lastWheel.current = Date.now()
    go(e.deltaY > 0 ? 1 : -1)
  }

  if (!item) return null
  const def = topicDef(item.topics[0])
  const mine = reactions[item.id]

  return (
    <div className="fixed inset-0 bg-black" onWheel={onWheel}>
      {/* Soft color from the current topic behind the card. */}
      <motion.div
        key={def.label}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 50% at 50% 35%, ${def.colors[0]}66, transparent 70%)` }}
      />
      <div className="relative mx-auto flex h-dvh max-w-md flex-col px-3 pt-[max(env(safe-area-inset-top),10px)] pb-[max(env(safe-area-inset-bottom),12px)]">
        {/* Top bar: time left */}
        <div className="mb-2.5 px-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div className="bg-brand h-full rounded-full transition-[width] duration-300 ease-linear" style={{ width: `${(remaining / total) * 100}%` }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={snap.owner} size="sm" />
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">{snap.owner}'s feed</p>
                <p className="text-[11px] text-white/60 tabular-nums">
                  {index + 1} of {items.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold tabular-nums" aria-label="Time left">
                ⏳ {fmt(remaining)}
              </span>
              <button onClick={() => onDone('stop', maxSeen.current)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm" aria-label="End and see recap">
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* The post */}
        <div className="relative min-h-0 flex-1">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={item.id}
              custom={dir}
              variants={{
                enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0.4, scale: 0.96 }),
                center: { y: 0, opacity: 1, scale: 1 },
                exit: (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0, scale: 0.96 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
              drag={item.demo ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={onDragEnd}
              className="absolute inset-0 overflow-hidden rounded-[28px] bg-panel shadow-2xl ring-1 ring-white/10"
            >
              <Embed item={item} active />
              <PlatformBadge platform={item.platform} className="absolute top-4 right-4" />
              <AnimatePresence>
                {mine && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-[110px] drop-shadow-2xl"
                  >
                    {mine === 'love' ? '❤️' : '🙅'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption and actions */}
        <motion.div drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2} onDragEnd={onDragEnd} className="pt-3">
          <div className="px-1">
            {item.creator && <p className="text-[14px] font-semibold">{item.creator}</p>}
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-white/80">{item.title ?? (item.platform === 'tiktok' ? 'TikTok video' : 'Post')}</p>
            <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
              {item.topics.slice(0, 3).map((t) => (
                <span key={t} className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                  {topicDef(t).emoji} {t}
                </span>
              ))}
              {item.signal !== 'watched' && (
                <span className="shrink-0 rounded-full bg-pink/20 px-2.5 py-1 text-[11px] text-pink-200">{item.signal === 'liked' ? `${snap.owner} liked this` : `${snap.owner} saved this`}</span>
              )}
              {!item.demo && (
                <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                  Open ↗
                </a>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-2">
            <button
              onClick={() => react('nope')}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-95 ${mine === 'nope' ? 'bg-white text-black' : 'bg-white/10'}`}
            >
              🙅 Not for me
            </button>
            <div className="flex flex-col gap-1">
              <button onClick={() => go(-1)} disabled={index === 0} className="flex h-[26px] w-12 items-center justify-center rounded-lg bg-white/10 text-xs disabled:opacity-30" aria-label="Previous post">
                ▲
              </button>
              <button onClick={() => go(1)} className="flex h-[26px] w-12 items-center justify-center rounded-lg bg-white/10 text-xs" aria-label="Next post">
                ▼
              </button>
            </div>
            <button
              onClick={() => react('love')}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-95 ${mine === 'love' ? 'bg-brand' : 'bg-white/10'}`}
            >
              ❤️ Love it
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Recap({ snap, reactions, seen, ended, onAgain }: { snap: Snapshot; reactions: Record<string, Reaction>; seen: number; ended: 'time' | 'end' | 'stop'; onAgain: () => void }) {
  const nav = useNavigate()
  const [copied, setCopied] = useState(false)

  const { loved, noped, match, count } = useMemo(() => {
    const byTopic = new Map<string, { love: number; nope: number }>()
    let love = 0
    let nope = 0
    for (const it of snap.items) {
      const r = reactions[it.id]
      if (!r) continue
      r === 'love' ? love++ : nope++
      for (const t of it.topics.length ? it.topics.slice(0, 1) : ['Other']) {
        const e = byTopic.get(t) ?? { love: 0, nope: 0 }
        e[r]++
        byTopic.set(t, e)
      }
    }
    const entries = [...byTopic.entries()]
    return {
      loved: entries.filter(([, v]) => v.love > v.nope).sort((a, b) => b[1].love - a[1].love).map(([t]) => t),
      noped: entries.filter(([, v]) => v.nope > v.love).sort((a, b) => b[1].nope - a[1].nope).map(([t]) => t),
      match: love + nope ? Math.round((love / (love + nope)) * 100) : null,
      count: love + nope,
    }
  }, [snap, reactions])

  const summary = [
    `I took a glimpse into ${snap.owner}'s feed 👀`,
    match !== null ? `Feed match: ${match}%` : '',
    loved.length ? `❤️ Loved: ${loved.slice(0, 4).join(', ')}` : '',
    noped.length ? `🙅 Not for me: ${noped.slice(0, 4).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const share = async () => {
    try {
      if (typeof navigator.share === 'function') await navigator.share({ text: summary })
      else {
        await navigator.clipboard.writeText(summary)
        setCopied(true)
      }
    } catch {
      /* closed */
    }
  }

  const title = ended === 'time' ? "Time's up!" : ended === 'end' ? 'You saw it all!' : 'Your recap'

  return (
    <Screen
      footer={
        <div className="space-y-3">
          <Button onClick={share}>{copied ? 'Copied ✓' : `Send my reaction to ${snap.owner}`}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={onAgain}>
              Watch again
            </Button>
            <Button variant="ghost" onClick={() => nav('/')}>
              Make my own
            </Button>
          </div>
        </div>
      }
    >
      <div className="pt-6">
        <Logo />
      </div>
      <div className="mt-8 text-center">
        <p className="text-[13px] font-semibold tracking-widest text-muted uppercase">{title}</p>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-semibold tracking-tight">
          You and {snap.owner}, <br />
          <Serif>
            <span className="text-gradient">feed to feed</span>
          </Serif>
        </h1>
      </div>

      <Card className="mt-8 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#ring)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={264}
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - ((match ?? 0) / 100) * 264 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold tabular-nums">{match !== null ? `${match}%` : '–'}</span>
        </div>
        <div>
          <p className="text-[17px] font-semibold">Feed match</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            You saw {seen} of {snap.items.length} posts and reacted to {count}.{match === null ? ' React to posts next time to get a match score.' : ''}
          </p>
        </div>
      </Card>

      {(loved.length > 0 || noped.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <p className="mb-2 text-[13px] font-semibold">❤️ You loved</p>
            {loved.length ? (
              <ul className="space-y-1.5 text-[13px] text-white/85">
                {loved.slice(0, 5).map((t) => (
                  <li key={t}>
                    {topicDef(t).emoji} {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted">Nothing yet</p>
            )}
          </Card>
          <Card className="!p-4">
            <p className="mb-2 text-[13px] font-semibold">🙅 Not for you</p>
            {noped.length ? (
              <ul className="space-y-1.5 text-[13px] text-white/85">
                {noped.slice(0, 5).map((t) => (
                  <li key={t}>
                    {topicDef(t).emoji} {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted">Nothing — easy going!</p>
            )}
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <SectionTitle>{snap.owner}'s top interests</SectionTitle>
        <InterestMap interests={snap.interests} max={6} />
      </Card>
    </Screen>
  )
}

function BrokenLink({
  emoji = '🔗',
  title = 'This link does not work',
  message = 'Part of the link is missing. Ask the sender to copy the full link again.',
  retry,
}: {
  emoji?: string
  title?: string
  message?: string
  retry?: () => void
}) {
  const nav = useNavigate()
  return (
    <Screen
      footer={
        <div className="space-y-3">
          {retry && <Button onClick={retry}>Try again</Button>}
          <Button variant={retry ? 'ghost' : 'primary'} onClick={() => nav('/')}>
            Make my own glimpse
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-6xl">{emoji}</div>
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-[15px] text-muted">{message}</p>
      </div>
    </Screen>
  )
}
