import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { H1, Screen, Serif } from '../components/ui'
import { PERSONAS } from '../demo/personas'
import { buildProfile } from '../lib/score'
import { topicDef } from '../lib/topics'
import { useStore } from '../store'

export default function Demo() {
  const nav = useNavigate()
  const { load } = useStore()
  return (
    <Screen back="/">
      <H1 sub="Pick a sample person. You will see their snapshot, then you can share and view it like a real one.">
        Meet a <Serif>sample</Serif> feed
      </H1>
      <div className="space-y-3">
        {PERSONAS.map((p, i) => {
          const prof = buildProfile(p.exports)
          return (
            <motion.button
              key={p.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => {
                load(prof, p.name)
                nav('/snapshot')
              }}
              className="glass flex w-full items-center gap-4 rounded-3xl p-4 text-left transition hover:bg-white/[0.07] active:scale-[0.99]"
            >
              <div className="bg-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl">{p.avatar}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold">{p.name}</p>
                <p className="truncate text-[13px] text-muted">{p.tagline}</p>
                <div className="mt-2 flex gap-1.5">
                  {prof.interests.slice(0, 3).map((it) => (
                    <span key={it.topic} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/80">
                      {topicDef(it.topic).emoji} {it.topic}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xl text-muted">›</span>
            </motion.button>
          )
        })}
      </div>
    </Screen>
  )
}
