import type { FeedItem } from '../types'
import { topicDef } from '../lib/topics'
import { PlatformBadge } from './ui'

/** Styled art for demo posts (no real video). */
export function DemoArt({ item, compact = false }: { item: FeedItem; compact?: boolean }) {
  const def = topicDef(item.topics[0])
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${def.colors[0]} 0%, ${def.colors[1]} 100%)` }}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: 'radial-gradient(60% 50% at 30% 20%, white, transparent 70%)' }} />
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-black/15 blur-2xl" />
      <span className={compact ? 'text-4xl' : 'text-[120px] drop-shadow-2xl'} aria-hidden>
        {def.emoji}
      </span>
      {!compact && (
        <span className="absolute top-4 left-4 rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur">
          Demo post
        </span>
      )}
    </div>
  )
}

/** The real post, shown with the platform's own embed player. */
export function Embed({ item, active }: { item: FeedItem; active: boolean }) {
  if (item.demo || !item.embedUrl) return <DemoArt item={item} />
  if (!active) return <div className="h-full w-full bg-black" />
  const youtube = item.platform === 'youtube'
  return (
    <div className={`flex h-full w-full items-center justify-center bg-black ${youtube ? '' : 'overflow-y-auto'}`}>
      <iframe
        key={item.id}
        src={youtube ? `${item.embedUrl}&autoplay=1&mute=1` : item.embedUrl}
        title={item.title ?? 'Post'}
        className={youtube ? 'aspect-video w-full' : 'h-full w-full max-w-[420px]'}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

/** Small tile for previews and lists. */
export function PostTile({ item }: { item: FeedItem }) {
  const def = topicDef(item.topics[0])
  const thumb = item.platform === 'youtube' && !item.demo ? `https://i.ytimg.com/vi/${item.id.slice(3)}/mqdefault.jpg` : null
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-panel">
      {thumb ? (
        <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : item.demo ? (
        <DemoArt item={item} compact />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl" style={{ background: `linear-gradient(160deg, ${def.colors[0]}55, ${def.colors[1]}55)` }}>
          {def.emoji}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
        <p className="line-clamp-2 text-[11px] leading-tight font-medium">{item.title ?? item.creator ?? 'Post'}</p>
      </div>
      <PlatformBadge platform={item.platform} className="absolute top-1.5 left-1.5 !px-2 !py-0.5 !text-[9px]" />
    </div>
  )
}
