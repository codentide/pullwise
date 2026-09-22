import { useState } from 'react'
import Image from 'next/image'
import { imageUrl } from '@/lib/gameData.ts'
import type { Card } from '@/lib/types.ts'

/** Reserves its aspect ratio so a grid of hundreds of ~45KB files doesn't jump around while loading; the corner radius is a caller-chosen prop since a fixed radius reads as soft on a 200px card but a lozenge on a 48px thumbnail; `trim` zooms past the artwork's own transparent rounded-corner arc, which below ~60px would read as heavily rounded regardless of box radius, at the cost of a sliver of border nobody looks at. */
const RADIUS = {
  chip: 'rounded-chip',
  control: 'rounded-control',
  surface: 'rounded-surface'
} as const

export function CardImage ({
  card,
  radius = 'surface',
  trim = false,
  className = ''
}: {
  card: Card
  radius?: keyof typeof RADIUS
  trim?: boolean
  className?: string
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  return (
    <div
      className={`relative overflow-hidden ${RADIUS[radius]} bg-overlay ${className}`}
      style={{ aspectRatio: 'var(--aspect-card)' }}
    >
      {state !== 'ready' && (
        <div className='absolute inset-0 grid place-items-center px-1 text-center text-label leading-tight text-ink-low'>
          {state === 'failed' ? card.name : null}
        </div>
      )}
      <Image
        src={imageUrl(card)}
        alt={card.name}
        fill
        loading='lazy'
        decoding='async'
        onLoad={() => setState('ready')}
        onError={() => setState('failed')}
        className={`object-cover transition-opacity duration-200 ${
          trim ? 'scale-[1.18]' : ''
        } ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
