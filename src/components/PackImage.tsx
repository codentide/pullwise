import Image from 'next/image'
import { packArt } from '@/lib/gameData.ts'

const RADIUS = {
  control: 'rounded-control',
  surface: 'rounded-surface'
} as const

/** Same shape as CardImage and for the same reason (a fixed box stops layout jumping while async art loads), with its own `--aspect-pack` token since a pack is taller and narrower than a card. */
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
