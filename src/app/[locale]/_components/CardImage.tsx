import { useState } from 'react'
import { imageUrl } from '@/lib/gameData.ts'
import type { Card } from '@/lib/types.ts'

/**
 * Card art with its space already reserved: each file is ~45 KB and the grid
 * shows hundreds, so without a fixed aspect ratio the page jumps around the
 * whole time they load.
 *
 * The corner scales with the tile. A 10px radius reads as a soft corner on a
 * 200px card in the catalogue and as a lozenge on a 48px thumbnail in a deck
 * preview, so the caller says how big the art is going to be.
 */
const RADIUS = {
  chip: 'rounded-chip',
  control: 'rounded-control',
  surface: 'rounded-surface'
} as const

export function CardImage ({
  card,
  radius = 'surface',
  className = ''
}: {
  card: Card
  radius?: keyof typeof RADIUS
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
      <img
        src={imageUrl(card)}
        alt={card.name}
        loading='lazy'
        decoding='async'
        onLoad={() => setState('ready')}
        onError={() => setState('failed')}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          state === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
