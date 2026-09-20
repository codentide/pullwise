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
 *
 * `trim` is for the smallest thumbnails. The artwork carries the physical card's
 * own rounded corner — a transparent arc about a tenth of the width — so below
 * roughly 60px the tile reads as heavily rounded no matter what radius the box
 * has, and 3px is already the bottom of the scale. Zooming past the frame clips
 * that arc off. It costs a sliver of white border, which is the one part of a
 * card nobody is looking at.
 */
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
      <img
        src={imageUrl(card)}
        alt={card.name}
        loading='lazy'
        decoding='async'
        onLoad={() => setState('ready')}
        onError={() => setState('failed')}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          trim ? 'scale-[1.18]' : ''
        } ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
