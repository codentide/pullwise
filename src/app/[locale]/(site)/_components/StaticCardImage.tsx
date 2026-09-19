import { imageUrl } from '@/lib/gameData.ts'
import type { Card } from '@/lib/types.ts'

/** Stateless card art, for the server-rendered static pages. */
export function StaticCardImage ({
  card,
  className = '',
  priority = false
}: {
  card: Card
  className?: string
  priority?: boolean
}) {
  return (
    <img
      src={imageUrl(card)}
      alt={card.name}
      width={367}
      height={512}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding='async'
      className={`h-auto w-full rounded-surface bg-overlay ${className}`}
    />
  )
}
