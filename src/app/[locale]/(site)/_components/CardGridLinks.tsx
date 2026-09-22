import { Link } from '@/i18n/navigation.ts'
import { StaticCardImage } from './StaticCardImage.tsx'
import { RarityPips } from '@/components/Rarity.tsx'
import type { Card } from '@/lib/types.ts'

/** A grid of cards linking to their own pages. Shared by all three site pages. */
export function CardGridLinks ({ cards, showRarity = true }: { cards: Card[], showRarity?: boolean }) {
  return (
    <ul className='mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(5.5rem,1fr))]'>
      {cards.map((card) => (
        <li key={card.id}>
          <Link href={`/card/${card.id}`} className='block' prefetch={false}>
            <StaticCardImage card={card} />
            <span className='mt-1 flex items-baseline justify-between gap-1'>
              <span className='truncate text-label text-ink-mid'>{card.name}</span>
              {showRarity && <RarityPips rarity={card.rarity} />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
