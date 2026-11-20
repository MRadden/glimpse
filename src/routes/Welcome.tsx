import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, Logo, Screen, Serif } from '../components/ui'
import { useStore } from '../store'

const STEPS = [
  { emoji: '📦', title: 'Get your data', text: 'Ask TikTok, Instagram or YouTube for a copy of your history. It is your data, and it is free.' },
  { emoji: '🙈', title: 'You choose', text: 'Hide any topic, creator or post. Nothing leaves your phone until you approve it.' },
  { emoji: '⏳', title: 'Share a glimpse', text: 'Send a link. They scroll your feed for 5, 15 or 30 minutes. Your real algorithm does not change.' },
]

/** Usual waiting times. They change with how busy each app is. */
const WAITS: [string, string][] = [
  ['TikTok', 'usually a few hours, sometimes days'],
  ['Instagram', 'usually under a day, sometimes days'],
  ['YouTube (Google)', 'minutes to a few days, most the same day'],
]

export default function Welcome() {
  const nav = useNavigate()
  const { compareWith } = useStore()
  return (
    <Screen
      footer={
        <div className="space-y-3">
          <Button onClick={() => nav('/guide')}>Get my data</Button>
          <Button variant="ghost" onClick={() => nav('/upload')}>
            I already have my files
          </Button>
          <button onClick={() => nav('/demo')} className="w-full py-1 text-center text-[14px] font-medium text-white/70 underline-offset-4 hover:underline">
            Try a demo first
          </button>
        </div>
      }
    >
      <div className="pt-6">
        <Logo />
      </div>
      {compareWith && (
        <button onClick={() => nav('/compare')} className="glass mt-6 flex w-full items-center gap-3 rounded-2xl p-3.5 text-left">
          <span className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{compareWith.owner.slice(0, 1).toUpperCase()}</span>
          <span className="flex-1 text-[14px] leading-snug">
            <span className="font-semibold">Compare with {compareWith.owner}</span>
            <span className="block text-[12px] text-muted">Make your glimpse to see your feeds side by side.</span>
          </span>
          <span className="text-muted">›</span>
        </button>
      )}
      <div className={compareWith ? 'mt-8' : 'mt-14'}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-4 text-[13px] font-semibold tracking-widest text-muted uppercase">
          Your feed says a lot
        </motion.p>
        <h1 className="text-[44px] leading-[1.02] font-semibold tracking-tight">
          See the world <br />
          <Serif>
            <span className="text-gradient">through their feed.</span>
          </Serif>
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted">
          A private, read-only glimpse of what someone sees every day — the funny, the weird, and the things they never mention.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 rounded-3xl border border-amber/30 bg-amber/[0.07] p-5"
        aria-labelledby="before-you-start"
      >
        <p id="before-you-start" className="flex items-center gap-2 text-[15px] font-semibold">
          <span aria-hidden>⏳</span> Before you start
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-white/80">
          You ask each app for a copy of your data. It can take <b className="text-white">a few hours to a few days</b> to be ready.
        </p>
        <details className="group mt-2 text-[13px]">
          <summary className="cursor-pointer list-none font-medium text-amber/90 [&::-webkit-details-marker]:hidden">
            How long does each app take? <span className="inline-block transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="mt-3 space-y-1.5 text-white/75">
            {WAITS.map(([app, wait]) => (
              <li key={app} className="flex justify-between gap-3">
                <span className="font-medium text-white/90">{app}</span>
                <span className="text-right text-muted">{wait}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 leading-snug text-muted">It depends on how busy the app&apos;s servers are. Ask today, then come back when the app tells you the file is ready.</p>
        </details>
      </motion.section>

      <div className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass flex gap-4 rounded-3xl p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-xl">{s.emoji}</div>
            <div>
              <p className="font-semibold">
                <span className="mr-2 text-muted tabular-nums">{i + 1}</span>
                {s.title}
              </p>
              <p className="mt-1 text-[14px] leading-snug text-muted">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted/80">🔒 Your files are read on this device. No account needed.</p>
    </Screen>
  )
}
