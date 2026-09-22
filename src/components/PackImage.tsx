import Image from 'next/image'
import { packArt } from '@/lib/gameData.ts'

const RADIUS = {
  control: 'rounded-control',
  surface: 'rounded-surface'
} as const

/**
 * Booster artwork, with its own aspect ratio reserved.
 *
 * Same shape as CardImage and for the same reason: the art is real and lands
 * asynchronously, so a fixed box stops the layout jumping while it loads. A
 * pack's proportions are taller and narrower than a card's, hence its own
 * token instead of reusing --aspect-card.
 */
export function PackImage ({
  set,
  pack,
  radius = 'surface',
  className = ''
}: {
  set: string
  pack: string
  radius?: keyof typeof RADIUS
  className?: string
}) {
  return (
    <div
      className={`relative overflow-hidden bg-overlay ${RADIUS[radius]} ${className}`}
      style={{ aspectRatio: 'var(--aspect-pack)' }}
    >
      <Image
        src={packArt(set, pack)}
        alt=''
        fill
        loading='lazy'
        decoding='async'
        className='object-cover'
      />
    </div>
  )
}
