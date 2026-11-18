import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, H1, Logo, Screen, SectionTitle, Serif } from '../components/ui'
import { compareInterests, type CompareRow } from '../lib/compare'
import { topicDef } from '../lib/topics'
import { loadShortId, ShortLinkError } from '../share/cloud'
import { useStore } from '../store'
import type { Snapshot } from '../types'
import { BrokenLink, Loading } from './Viewer'

const A_COLOR = 'linear-gradient(90deg, #a78bfa, #8b5cf6)'
const B_COLOR = 'linear-gradient(90deg, #f472b6, #f59e0b)'

/** Step between the recap and the viewer's own snapshot. */
export function CompareStart() {
  const nav = useNavigate()
  const { compareWith, setCompareWith } = useStore()
  if (!compareWith) return <Navigate to="/" replace />
  return (
    <Screen
      back
      footer={
        <div className="space-y-3">
          <Button onClick={() => nav('/guide')}>Use my own data</Button>
          <Button variant="ghost" onClick={() => nav('/demo')}>
            Try it with a sample person
          </Button>
        </div>
      }
    >
      <H1 sub={`Make your own glimpse. Then you both see your interest maps side by side, with the topics you share and the ones that are only yours.`}>
        You and {compareWith.owner}, <Serif>side by side</Serif>
      </H1>
      <Card className="space-y-4">
        {[
          ['📦', 'Get your data', 'Download your data from TikTok, YouTube or Instagram. It can take a few hours.'],
          ['🧠', 'We remember', `This phone remembers that you want to compare with ${compareWith.owner}. Come back when your file is ready.`],
          ['🔗', 'Share the result', `When your link is ready, tap “Compare with ${compareWith.owner}” and send them the comparison.`],
        ].map(([emoji, title, text]) => (
          <div key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-lg">{emoji}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-[14px] leading-snug text-muted">{text}</p>
            </div>
          </div>
        ))}
      </Card>
      <button
        onClick={() => {
          setCompareWith(null)
          nav('/')
        }}
        className="mt-5 text-center text-[13px] text-muted underline underline-offset-4"
      >
        Stop comparing
      </button>
    </Screen>
  )
}

/** The comparison page. Both people can open it: #/c/<A id>/<B id>. */
export function CompareView() {
  const { a = '', b = '' } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string; snaps?: [Snapshot, Snapshot]; error?: ShortLinkError } | null>(null)
  const key = `${a}/${b}`

  useEffect(() => {
    let live = true
    Promise.all([loadShortId(a), loadShortId(b)])
      .then((snaps) => live && setState({ key, snaps }))
      .catch((e) => live && setState({ key, error: e instanceof ShortLinkError ? e : new ShortLinkError('server', 'Something went wrong.') }))
    return () => {
      live = false
    }
  }, [a, b, key, attempt])

  if (!state || state.key !== key) return <Loading />
  if (state.snaps) return <ComparePage a={state.snaps[0]} b={state.snaps[1]} ids={[a, b]} />
  const err = state.error!
  if (err.kind === 'network') return <BrokenLink title="No connection" message={err.message} retry={() => (setState(null), setAttempt((n) => n + 1))} />
  if (err.kind === 'not-found')
    return <BrokenLink emoji="⌛" title="This comparison is not available" message="One of the two glimpses has expired. Glimpse links last 7 days. Make new glimpses to compare again." />
  return <BrokenLink title="This link does not work" message={err.message} />
}

function Pair({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex">
      <span className="z-10 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-ink" style={{ background: A_COLOR }}>
        {a.slice(0, 1).toUpperCase()}
      </span>
      <span className="-ml-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-ink" style={{ background: B_COLOR }}>
        {b.slice(0, 1).toUpperCase()}
      </span>
    </div>
  )
}

function TopicList({ rows, side, empty }: { rows: CompareRow[]; side: 'a' | 'b'; empty: string }) {
  if (!rows.length) return <p className="text-[13px] text-muted">{empty}</p>
  return (
    <ul className="space-y-1.5 text-[13px] text-white/85">
      {rows.slice(0, 5).map((r) => (
        <li key={r.topic} className="flex justify-between gap-2">
          <span className="truncate">
            {topicDef(r.topic).emoji} {r.topic}
          </span>
          <span className="text-muted tabular-nums">{Math.round(r[side] * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}

function ComparePage({ a, b, ids }: { a: Snapshot; b: Snapshot; ids: [string, string] }) {
  const nav = useNavigate()
  const [copied, setCopied] = useState(false)
  const c = useMemo(() => compareInterests(a.interests, b.interests), [a, b])
  const rows = c.rows.slice(0, 10)
  const peak = Math.max(0.01, ...rows.map((r) => Math.max(r.a, r.b)))
  const verdict = c.score >= 70 ? 'Very alike' : c.score >= 45 ? 'A lot in common' : c.score >= 20 ? 'Some common ground' : 'Very different feeds'

  const share = async () => {
    const url = window.location.href
    const text = `${a.owner} & ${b.owner}: our feeds are a ${c.score}% match 👀`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ text, url })
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        setCopied(true)
      }
    } catch {
      /* closed */
    }
  }

  return (
    <Screen
      footer={
        <div className="space-y-3">
          <Button onClick={share}>{copied ? 'Copied ✓' : 'Send this comparison'}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => nav(`/g/${ids[0]}`)}>
              {a.owner}'s feed
            </Button>
            <Button variant="ghost" onClick={() => nav(`/g/${ids[1]}`)}>
              {b.owner}'s feed
            </Button>
          </div>
        </div>
      }
    >
      <div className="pt-6">
        <Logo />
      </div>
      <div className="mt-8 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
          <Pair a={a.owner} b={b.owner} />
        </motion.div>
        <h1 className="mt-5 text-[32px] leading-[1.05] font-semibold tracking-tight">
          {a.owner} & {b.owner}, <br />
          <Serif>
            <span className="text-gradient">feed to feed</span>
          </Serif>
        </h1>
      </div>

      <Card className="mt-7 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
            <defs>
              <linearGradient id="cmpRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#cmpRing)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={264}
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (c.score / 100) * 264 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold tabular-nums">{c.score}%</span>
        </div>
        <div>
          <p className="text-[17px] font-semibold">{verdict}</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">How much your two algorithms show you the same kinds of things.</p>
        </div>
      </Card>

      {c.shared.length > 0 && (
        <Card className="mt-4">
          <SectionTitle>You both see</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {c.shared.slice(0, 8).map((r) => (
              <span key={r.topic} className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[13px]">
                {topicDef(r.topic).emoji} {r.topic}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between text-[12px] font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: A_COLOR }} /> {a.owner}
          </span>
          <span className="tracking-wider text-muted uppercase">Interests</span>
          <span className="flex items-center gap-1.5">
            {b.owner} <span className="h-2 w-2 rounded-full" style={{ background: B_COLOR }} />
          </span>
        </div>
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li key={r.topic}>
              <p className="mb-1 text-center text-[13px] font-medium">
                {topicDef(r.topic).emoji} {r.topic}
              </p>
              <div className="grid grid-cols-[2.25rem_1fr_1fr_2.25rem] items-center gap-1.5">
                <span className="text-right text-[11px] text-muted tabular-nums">{Math.round(r.a * 100)}%</span>
                <div className="flex h-2 justify-end overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div className="h-full rounded-full" style={{ background: A_COLOR }} initial={{ width: 0 }} animate={{ width: `${(r.a / peak) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }} />
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div className="h-full rounded-full" style={{ background: B_COLOR }} initial={{ width: 0 }} animate={{ width: `${(r.b / peak) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }} />
                </div>
                <span className="text-[11px] text-muted tabular-nums">{Math.round(r.b * 100)}%</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <p className="mb-2 text-[13px] font-semibold">Only in {a.owner}'s feed</p>
          <TopicList rows={c.onlyA} side="a" empty="Nothing only theirs." />
        </Card>
        <Card className="!p-4">
          <p className="mb-2 text-[13px] font-semibold">Only in {b.owner}'s feed</p>
          <TopicList rows={c.onlyB} side="b" empty="Nothing only theirs." />
        </Card>
      </div>
    </Screen>
  )
}
