import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, H1, Screen, Serif } from '../components/ui'
import { FOCUS_CITY, FOCUS_CITY_LABEL } from '../config'
import { AGE_RANGES, joinWaitlist, waitlistProblems, type AgeRange } from '../dating/api'
import { ShortLinkError } from '../share/cloud'

type State = { status: 'form' } | { status: 'busy' } | { status: 'done'; count: number; city: string } | { status: 'error'; message: string }

const HOW = [
  ['🧠', 'Your feed, not a bio', 'We compare interest maps, not what people say about themselves.'],
  ['📍', 'One city at a time', 'Matching opens in a city when enough people there join.'],
  ['💌', 'A few strong matches', 'You get a small number of people who really see the same world as you.'],
]

export default function MatchMe() {
  const nav = useNavigate()
  const glimpseId = (useLocation().state as { glimpseId?: string } | null)?.glimpseId
  const [email, setEmail] = useState('')
  const [city, setCity] = useState(FOCUS_CITY)
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('')
  const [adult, setAdult] = useState(false)
  const [consent, setConsent] = useState(false)
  const [tried, setTried] = useState(false)
  const [state, setState] = useState<State>({ status: 'form' })

  const problems = waitlistProblems({ email, city, ageRange: ageRange || undefined, adult, consent })

  const submit = async () => {
    setTried(true)
    if (problems.length) return
    setState({ status: 'busy' })
    try {
      const count = await joinWaitlist({ email, city, ageRange: ageRange as AgeRange, glimpseId })
      setState({ status: 'done', count, city: city.trim() })
    } catch (e) {
      setState({ status: 'error', message: e instanceof ShortLinkError ? e.message : 'Something went wrong. Try again.' })
    }
  }

  if (state.status === 'done')
    return (
      <Screen footer={<Button onClick={() => nav('/')}>Back to Glimpse</Button>}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl">
            💌
          </motion.div>
          <h1 className="mt-6 text-[30px] leading-tight font-semibold tracking-tight">
            You&apos;re on <Serif>the list</Serif>
          </h1>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted">
            {state.count === 1 ? `You are the first person in ${state.city}.` : `${state.count} people in ${state.city} are waiting to be matched.`} We will email you when matching opens there.
          </p>
          <p className="mt-6 text-[13px] text-muted/80">Tell a friend in {state.city}: the more people join, the sooner it opens.</p>
        </div>
      </Screen>
    )

  return (
    <Screen
      back
      footer={
        <Button onClick={submit} disabled={state.status === 'busy'}>
          {state.status === 'busy' ? 'Joining…' : 'Join the waitlist'}
        </Button>
      }
    >
      <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-pink/15 px-3 py-1 text-[12px] font-semibold text-pink-200">Coming soon</span>
      <H1 sub="Get matched with people whose feeds look like yours. Join the waitlist, and we will tell you when matching opens in your city.">
        Match me by <Serif>my feed</Serif>
      </H1>

      {FOCUS_CITY_LABEL && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-pink/10 px-4 py-3 text-[14px] text-pink-100 ring-1 ring-pink/25">
          <span aria-hidden>📍</span> Matching opens first in <b className="font-semibold text-white">{FOCUS_CITY_LABEL}</b>.
        </p>
      )}
      <Card className="mb-4 space-y-4">
        {HOW.map(([emoji, title, text]) => (
          <div key={title} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-lg">{emoji}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-[14px] leading-snug text-muted">{text}</p>
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold tracking-wider text-muted uppercase">Email</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl bg-white/[0.05] px-4 text-[16px] ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-pink/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold tracking-wider text-muted uppercase">City</span>
          <input
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="For example: Denver"
            className="h-12 w-full rounded-xl bg-white/[0.05] px-4 text-[16px] ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-pink/60"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold tracking-wider text-muted uppercase">Your age</span>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Your age">
            {AGE_RANGES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={ageRange === r}
                onClick={() => setAgeRange(r)}
                className={`h-11 rounded-xl text-[13px] font-semibold transition ${ageRange === r ? 'bg-white text-black' : 'bg-white/[0.05] text-white/80'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-start gap-3 text-[14px] leading-snug text-white/85">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-pink-500" />
          I am 18 or older.
        </label>
        <label className="flex items-start gap-3 text-[14px] leading-snug text-white/85">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-pink-500" />
          Glimpse can email me when matching opens in my city. I can ask to be removed at any time.
        </label>
      </Card>

      {tried && problems.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-[14px] text-red-100">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-[14px] text-red-100">
          {state.message}
        </p>
      )}
      <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted/80">
        🔒 We store only your email, city and age range. We do not store your feed for matching yet, and we never sell your data.
      </p>
    </Screen>
  )
}
