import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, H1, PLATFORM_META, Screen, Serif } from '../components/ui'
import { boldParts, detectDevice, DEVICES, GUIDES, stepSet, type Device } from '../guide/steps'
import type { Platform } from '../types'

const APPS: Platform[] = ['tiktok', 'instagram', 'youtube']

function Rich({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((p, i) =>
        p.bold ? (
          <b key={i} className="font-semibold text-white">
            {p.text}
          </b>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

function checkedLabel(date: string) {
  return new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Guide() {
  const nav = useNavigate()
  const [app, setApp] = useState<Platform>('tiktok')
  const [device, setDevice] = useState<Device>(() => detectDevice(navigator.userAgent))
  const guide = GUIDES[app]
  const oneSet = !!guide.sets.all
  const set = stepSet(guide, device)

  return (
    <Screen back="/" step={[1, 4]} footer={<Button onClick={() => nav('/upload')}>I have my file</Button>}>
      <H1 sub="Ask each app for a copy of your data. Start with one app; you can add more later. The app needs time to prepare your file.">
        Get your <Serif>data</Serif>
      </H1>

      <div className="glass mb-3 grid grid-cols-3 gap-1 rounded-2xl p-1" role="tablist" aria-label="App">
        {APPS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={app === p}
            onClick={() => setApp(p)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition ${app === p ? 'bg-white text-black' : 'text-white/70'}`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[p].color }} />
            {PLATFORM_META[p].name}
          </button>
        ))}
      </div>

      {oneSet ? (
        <p className="mb-4 px-1 text-[13px] text-muted">📱💻 The same steps on a phone and a computer.</p>
      ) : (
        <div className="mb-4 flex items-center gap-2" role="radiogroup" aria-label="Device">
          <span className="px-1 text-[13px] text-muted">On my</span>
          {DEVICES.map((d) => (
            <button
              key={d.id}
              role="radio"
              aria-checked={device === d.id}
              onClick={() => setDevice(d.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${device === d.id ? 'bg-pink/20 text-white ring-1 ring-pink/60' : 'bg-white/[0.05] text-white/70'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/80">⏱ {guide.wait}</span>
          {set.checked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">✓ Checked {checkedLabel(set.checked)}</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-100">Not yet checked on this device</span>
          )}
        </div>
        <ol className="space-y-5">
          {set.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.important ? 'bg-amber text-black' : 'bg-brand'}`}>{i + 1}</span>
              <div className="min-w-0 flex-1 pt-0.5 text-white/85">
                {s.important && <span className="mb-1 block text-[11px] font-semibold tracking-wider text-amber uppercase">Important</span>}
                <Rich text={s.text} />
                {s.image && (
                  <img
                    src={`${import.meta.env.BASE_URL}guide/${s.image}`}
                    alt={`Screen for step ${i + 1}`}
                    loading="lazy"
                    className="mt-3 w-full max-w-[240px] rounded-2xl ring-1 ring-white/10"
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-4">
        <p className="mb-3 text-[13px] font-semibold tracking-wider text-muted uppercase">What happens next</p>
        <ul className="space-y-2.5 text-[14px] leading-snug text-white/85">
          {set.next.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-muted">•</span>
              <span>
                <Rich text={t} />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted">💡 {guide.tip}</p>
      <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted/70">
        {set.source ? `${set.source} ` : ''}Menu names can change when the apps update.
      </p>
    </Screen>
  )
}
