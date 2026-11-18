import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, Logo, Screen, Serif } from '../components/ui'

const STEPS = [
  { emoji: '📦', title: 'Get your data', text: 'Download your history from TikTok, YouTube or Instagram. It is your data, and it is free.' },
  { emoji: '🙈', title: 'You choose', text: 'Hide any topic, creator or post. Nothing leaves your phone until you approve it.' },
  { emoji: '⏳', title: 'Share a glimpse', text: 'Send a link. They scroll your feed for 5, 15 or 30 minutes. Your real algorithm does not change.' },
]

export default function Welcome() {
  const nav = useNavigate()
  return (
    <Screen
      footer={
        <div className="space-y-3">
          <Button onClick={() => nav('/guide')}>Share my feed</Button>
          <Button variant="ghost" onClick={() => nav('/demo')}>
            Try a demo first
          </Button>
        </div>
      }
    >
      <div className="pt-6">
        <Logo />
      </div>
      <div className="mt-14">
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

      <div className="mt-10 space-y-3">
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
