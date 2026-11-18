import { motion } from 'framer-motion'
import type { InterestScore } from '../types'
import { topicDef } from '../lib/topics'

export function InterestMap({ interests, max = 8 }: { interests: InterestScore[]; max?: number }) {
  const top = interests.slice(0, max)
  const peak = top[0]?.share || 1
  if (!top.length) return <p className="text-sm text-muted">No interests found yet.</p>
  return (
    <ul className="space-y-3.5">
      {top.map((it, i) => {
        const def = topicDef(it.topic)
        return (
          <li key={it.topic}>
            <div className="mb-1.5 flex items-center justify-between text-[14px]">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-base" aria-hidden>
                  {def.emoji}
                </span>
                {it.topic}
              </span>
              <span className="text-muted tabular-nums">{Math.round(it.share * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${def.colors[0]}, ${def.colors[1]})` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, (it.share / peak) * 100)}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
