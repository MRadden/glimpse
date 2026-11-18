import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, H1, PLATFORM_META, Screen, Serif } from '../components/ui'
import type { Platform } from '../types'

const GUIDES: Record<Platform, { wait: string; steps: string[]; tip: string }> = {
  tiktok: {
    wait: 'Usually ready in a few hours',
    steps: [
      'Open TikTok and go to your Profile.',
      'Tap the ☰ menu, then Settings and privacy.',
      'Tap Account, then Download your data.',
      'Select the JSON file format and All data.',
      'Tap Request data.',
      'When it is ready, open the Download data tab and save the ZIP file.',
    ],
    tip: 'TikTok keeps your full list of watched videos. This gives the most real feed.',
  },
  youtube: {
    wait: 'Ready in minutes to a few days',
    steps: [
      'Go to takeout.google.com and sign in.',
      'Tap Deselect all, then select YouTube and YouTube Music.',
      'Tap Multiple formats. For History, select JSON.',
      'Tap All YouTube data included. Keep history, playlists and subscriptions.',
      'Tap Next step, then Create export.',
      'Google sends you an email. Download the ZIP file from the link.',
    ],
    tip: 'HTML format also works, but JSON is faster and more accurate.',
  },
  instagram: {
    wait: 'Usually ready in under an hour',
    steps: [
      'Open Instagram, go to your Profile, then tap ☰.',
      'Tap Accounts Center, then Your information and permissions.',
      'Tap Download your information, then Download or transfer information.',
      'Select your Instagram account and Some of your information.',
      'Select Your activity, Preferences and Ads information.',
      'Tap Download to device. Set the format to JSON and the date range to Last 3 months.',
      'Tap Create files. Download the ZIP file when it is ready.',
    ],
    tip: 'Instagram adds a list of topics it thinks you like. We use it for your interest map.',
  },
}

export default function Guide() {
  const nav = useNavigate()
  const [tab, setTab] = useState<Platform>('tiktok')
  const g = GUIDES[tab]
  return (
    <Screen back="/" step={[1, 4]} footer={<Button onClick={() => nav('/upload')}>I have my file</Button>}>
      <H1 sub="Each app lets you download a copy of your own data. Start with one app. You can add more later.">
        Get your <Serif>data</Serif>
      </H1>

      <div className="glass mb-4 grid grid-cols-3 gap-1 rounded-2xl p-1" role="tablist">
        {(Object.keys(GUIDES) as Platform[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={tab === p}
            onClick={() => setTab(p)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition ${tab === p ? 'bg-white text-black' : 'text-white/70'}`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[p].color }} />
            {PLATFORM_META[p].name}
          </button>
        ))}
      </div>

      <Card>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/80">⏱ {g.wait}</p>
        <ol className="space-y-4">
          {g.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug">
              <span className="bg-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted">💡 {g.tip}</p>
      <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted/70">Menu names can change when the apps update.</p>
    </Screen>
  )
}
