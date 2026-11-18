import { Navigate, useNavigate } from 'react-router-dom'
import { InterestMap } from '../components/InterestMap'
import { PostTile } from '../components/PostCard'
import { Button, Card, H1, PLATFORM_META, Screen, SectionTitle, Serif } from '../components/ui'
import { useStore } from '../store'

export default function Snapshot() {
  const nav = useNavigate()
  const s = useStore()
  if (!s.profile) return <Navigate to="/" replace />
  const p = s.profile
  const stats = [
    { label: 'Posts', value: p.items.length },
    { label: 'Liked & saved', value: p.stats.liked },
    { label: 'Searches', value: p.stats.searches },
  ]
  return (
    <Screen back={s.demoName ? '/demo' : '/upload'} step={[2, 4]} footer={<Button onClick={() => nav('/curate')}>Review what to share</Button>}>
      <H1 sub={`Built from ${p.platforms.map((x) => PLATFORM_META[x].name).join(', ')}. Only you can see this page.`}>
        {s.demoName ? `${s.demoName}'s` : 'Your'} algorithm, <Serif>at a glance</Serif>
      </H1>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {stats.map((x) => (
          <div key={x.label} className="glass rounded-2xl px-3 py-3.5">
            <p className="text-[22px] font-semibold tabular-nums">{x.value.toLocaleString()}</p>
            <p className="text-[11px] text-muted">{x.label}</p>
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <SectionTitle right="share of your feed">Interest map</SectionTitle>
        <InterestMap interests={p.interests} />
      </Card>

      {p.creators.length > 0 && (
        <Card className="mb-4">
          <SectionTitle>Creators you see most</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {p.creators.slice(0, 10).map((c) => (
              <span key={c.platform + c.name} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[c.platform].color }} />
                {c.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {p.searches.length > 0 && (
        <Card className="mb-4">
          <SectionTitle right="not shared">Recent searches</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {p.searches.slice(0, 8).map((q, i) => (
              <span key={i} className="rounded-full border border-white/10 px-3 py-1.5 text-[13px] text-white/80">
                🔍 {q.query}
              </span>
            ))}
          </div>
        </Card>
      )}

      <SectionTitle right={`${s.feed.length} in the feed`}>Feed preview</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {s.feed.slice(0, 9).map((it) => (
          <PostTile key={it.id} item={it} />
        ))}
      </div>
    </Screen>
  )
}
