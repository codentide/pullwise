import { useTranslations } from 'next-intl'
import { CardImage } from './CardImage.tsx'
import { Icon } from '@/components/Icon.tsx'
import { RarityPips } from '@/components/Rarity.tsx'
import type { Card } from '@/lib/types.ts'
import { Pressable } from '@/components/Pressable.tsx'
import { Button } from '@/components/Button.tsx'

/**
 * A card's state relative to your collection. `undefined` means UNKNOWN and is
 * shown differently from zero on purpose: the app never assumes you lack a card
 * just because you never marked it.
 */
export type Owned = number | undefined

/** Ownership cycle: complete -> partial -> none -> complete. */
export function cycleOwned (current: Owned, max: number): number {
  if (current === undefined || current >= max) return max - 1 >= 0 ? max - 1 : 0
  if (current <= 0) return max
  return current - 1
}

export function OwnedPill ({
  owned,
  needed,
  onClick,
  cardName
}: {
  owned: Owned
  needed: number
  onClick: () => void
  cardName: string
}) {
  const t = useTranslations('card')
  const have = owned ?? needed
  const complete = have >= needed
  const none = have <= 0

  const tone = complete
    ? 'bg-valid/12 text-valid'
    : none
      ? 'bg-invalid/12 text-invalid'
      : 'bg-warn/12 text-warn'

  return (
    <Pressable
      onClick={onClick}
      aria-label={t('ownership', { name: cardName, have, needed })}
      title={t('ownershipTitle', { have, needed })}
      className={`tnum flex w-full items-center justify-center gap-1 rounded-control py-0.5 text-label font-medium transition-colors duration-150 ${tone}`}
    >
      {complete && <Icon name='check' size={11} />}
      {have}/{needed}
    </Pressable>
  )
}

/** Catalogue tile: browse and, if you feel like it, mark. Never asks you to. */
export function CardTile ({
  card,
  owned,
  onCycle
}: {
  card: Card
  owned: Owned
  onCycle: () => void
}) {
  const t = useTranslations('card')
  const state = owned === undefined ? t('unmarked') : t('youHave', { count: owned })

  return (
    <div className='group flex flex-col gap-1'>
      <Pressable
        onClick={onCycle}
        aria-label={t('markAria', { name: card.name, state })}
        className='relative block w-full rounded-surface ring-offset-2 ring-offset-base transition-transform duration-150 hover:scale-[1.03]'
      >
        <CardImage
          card={card}
          className={
            owned === 0
              ? 'opacity-45 saturate-50 outline outline-1 outline-invalid'
              : owned === undefined
                ? 'outline outline-1 outline-dashed outline-line-control'
                : undefined
          }
        />
        {owned !== undefined && (
          <span
            className={`absolute right-1 top-1 rounded-chip px-1 text-label font-semibold tabular-nums ${
              owned > 0 ? 'bg-valid text-bg' : 'bg-invalid text-bg'
            }`}
          >
            {owned > 0 ? `×${owned}` : '0'}
          </span>
        )}
      </Pressable>
      <div className='flex items-baseline justify-between gap-1 px-0.5'>
        <span className='truncate text-label text-ink-mid' title={card.name}>
          {card.name}
        </span>
        <RarityPips rarity={card.rarity} />
      </div>
    </div>
  )
}

/** Deck editor tile: copies the deck asks for, plus copies you own. */
export function DeckCardTile ({
  card,
  copies,
  owned,
  onCycleOwned,
  onCopies,
  onRemove
}: {
  card: Card
  copies: number
  owned: Owned
  onCycleOwned: () => void
  onCopies: (next: number) => void
  onRemove: () => void
}) {
  const t = useTranslations('card')
  const have = owned ?? copies
  const short = have < copies

  return (
    <div className='group flex flex-col gap-1'>
      <div className='relative'>
        <Pressable
          onClick={onCycleOwned}
          aria-label={t('ownership', { name: card.name, have, needed: copies })}
          className='block w-full'
        >
          <CardImage
            card={card}
            className={`transition-all duration-150 ${
              short ? 'opacity-50 saturate-50 ring-1 ring-invalid' : 'group-hover:brightness-110'
            }`}
          />
        </Pressable>

        <div className='absolute left-1 top-1 flex items-center gap-px rounded-chip bg-base/85 opacity-0 backdrop-blur transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100'>
          <Button variant='ghost' onClick={() => onCopies(copies - 1)} aria-label={t('removeCopy', { name: card.name })} className='px-1 py-0.5'>
            <Icon name='minus' size={11} />
          </Button>
          <span className='tnum min-w-[1.1rem] text-center text-label text-ink-high'>{copies}</span>
          <Button variant='ghost' onClick={() => onCopies(copies + 1)} disabled={copies >= 2} aria-label={t('addCopy', { name: card.name })} className='px-1 py-0.5'>
            <Icon name='plus' size={11} />
          </Button>
        </div>

        <Pressable
          onClick={onRemove}
          aria-label={t('removeCard', { name: card.name })}
          className='absolute right-1 top-1 rounded-chip bg-base/85 p-0.5 text-ink-mid opacity-0 backdrop-blur transition-opacity duration-150 hover:text-invalid focus-visible:opacity-100 group-hover:opacity-100'
        >
          <Icon name='close' size={11} />
        </Pressable>
      </div>

      <OwnedPill owned={owned} needed={copies} onClick={onCycleOwned} cardName={card.name} />
    </div>
  )
}
