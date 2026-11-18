import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, H1, PLATFORM_META, Screen, SectionTitle, Serif } from '../components/ui'
import { topicDef } from '../lib/topics'
import { creatorKey, useStore } from '../store'

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition active:scale-95 ${
        on ? 'bg-white/[0.1] text-white' : 'bg-transparent text-white/35 line-through ring-1 ring-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export default function Curate() {
  const nav = useNavigate()
  const s = useStore()
  const [showAll, setShowAll] = useState(false)
  if (!s.profile) return <Navigate to="/" replace />
  const p = s.profile
  const posts = s.profile.items.filter((it) => it.embedUrl || it.demo)
  const list = showAll ? posts : posts.slice(0, 12)

  return (
    <Screen back="/snapshot" step={[3, 4]} footer={<Button onClick={() => nav('/share')}>Continue with {s.feed.length} posts</Button>}>
      <H1 sub="Tap anything you want to keep private. It is removed from the feed and the interest map.">
        You are in <Serif>control</Serif>
      </H1>

      <Card className="mb-4">
        <SectionTitle right={`${s.hiddenTopics.size} hidden`}>Topics</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {p.interests.map((it) => (
            <Chip key={it.topic} on={!s.hiddenTopics.has(it.topic)} onClick={() => s.toggleTopic(it.topic)}>
              <span aria-hidden>{topicDef(it.topic).emoji}</span> {it.topic}
            </Chip>
          ))}
        </div>
      </Card>

      {p.creators.length > 0 && (
        <Card className="mb-4">
          <SectionTitle right={`${s.hiddenCreators.size} hidden`}>Creators</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {p.creators.map((c) => (
              <Chip key={creatorKey(c)} on={!s.hiddenCreators.has(creatorKey(c))} onClick={() => s.toggleCreator(creatorKey(c))}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_META[c.platform].color }} />
                {c.name}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle right={`${s.hiddenItems.size} hidden`}>Posts</SectionTitle>
        <ul className="-mx-1 divide-y divide-white/5">
          {list.map((it) => {
            const hiddenByRule = it.topics.some((t) => s.hiddenTopics.has(t)) || (it.creator && s.hiddenCreators.has(creatorKey({ platform: it.platform, name: it.creator })))
            const on = !s.hiddenItems.has(it.id) && !hiddenByRule
            return (
              <li key={it.id} className={`flex items-center gap-3 px-1 py-2.5 transition ${on ? '' : 'opacity-35'}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: `linear-gradient(160deg, ${topicDef(it.topics[0]).colors.join(',')})` }}>
                  {topicDef(it.topics[0]).emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">{it.title ?? 'Untitled post'}</p>
                  <p className="truncate text-[12px] text-muted">
                    {PLATFORM_META[it.platform].name}
                    {it.creator ? ` · ${it.creator}` : ''}
                    {it.signal !== 'watched' ? ` · ${it.signal}` : ''}
                  </p>
                </div>
                <button
                  disabled={!!hiddenByRule}
                  onClick={() => s.toggleItem(it.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-sm disabled:opacity-40"
                  aria-label={on ? 'Hide post' : 'Show post'}
                >
                  {on ? '👁' : '🚫'}
                </button>
              </li>
            )
          })}
        </ul>
        {posts.length > 12 && (
          <button onClick={() => setShowAll((v) => !v)} className="mt-2 w-full py-2 text-[13px] font-medium text-pink">
            {showAll ? 'Show less' : `Show all ${posts.length} posts`}
          </button>
        )}
      </Card>
      <p className="mt-4 px-1 text-xs leading-relaxed text-muted">Your searches are never shared. The feed holds a maximum of 120 posts.</p>
    </Screen>
  )
}
