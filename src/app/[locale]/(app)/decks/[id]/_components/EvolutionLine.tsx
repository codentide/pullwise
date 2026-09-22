import { useTranslations } from 'next-intl'
import { Pressable } from '@/components/Pressable.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Notice } from '@/components/Notice.tsx'
import { CardImage } from '@/components/CardImage.tsx'
import type { ChainLink, LineGap } from '@/lib/deckGroups.ts'
import type { Card } from '@/lib/types.ts'

/** A broken evolution line, drawn as the line itself instead of a sentence like "Ivysaur evolves from Bulbasaur, which is not in the deck": a row of slots with one empty reads as a missing link at a glance, and that slot is where you click to fill it; the hole uses the same dashed treatment as an unmarked card (absence, not error), and reads across rather than down so three of these don't stack 540px between the search field and the deck. */
export function EvolutionLine ({ gap, onAdd }: { gap: LineGap, onAdd: (card: Card) => void }) {
  const t = useTranslations('editor')

  return (
    <Notice tone='warning' pad='md'>
      <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-3'>
        <div className='min-w-0'>
          <p className='text-ink-high'>
            {t.rich('lineGapTitle', {
              name: gap.needs.name,
              from: gap.missingName,
              n: (chunks) => <span className='game-name'>{chunks}</span>
            })}
          </p>
          <p className='text-label text-ink-mid'>{t('lineGapBody')}</p>
        </div>

        <ol className='flex shrink-0 flex-wrap items-center gap-2'>
          {gap.chain.map((link, index) => (
            <li key={link.name} className='flex items-center gap-2'>
              {index > 0 && <Icon name='evolvesTo' size={12} className='text-ink-low' />}

              {link.inDeck != null
                ? (
                  <span className='w-10 opacity-60' title={link.name}>
                    <CardImage card={link.inDeck} radius='chip' trim />
                  </span>
                  )
                : (
              // One hole, one slot: showing every printing here turns a chain of three links into a row of seven cards; the cheapest printing is offered, any other version is a search away.
                  <Hole link={link} onAdd={onAdd} />
                  )}
            </li>
          ))}
        </ol>
      </div>
    </Notice>
  )
}

function Hole ({ link, onAdd }: { link: ChainLink, onAdd: (card: Card) => void }) {
  const t = useTranslations('editor')
  const candidate = link.candidates?.[0]

  if (candidate == null) {
    return (
      <span
        className='grid w-10 place-items-center rounded-chip border border-dashed border-warn text-label text-warn'
        style={{ aspectRatio: 'var(--aspect-card)' }}
      >
        ?
      </span>
    )
  }

  return (
    <Pressable
      onClick={() => onAdd(candidate)}
      aria-label={t('addOne', { name: candidate.name })}
      title={`${candidate.name} · ${candidate.set}`}
      className='relative w-10 rounded-chip transition-transform duration-150 hover:scale-105'
    >
      <span className='block opacity-40'>
        <CardImage card={candidate} radius='chip' trim />
      </span>
      <span
        aria-hidden
        className='absolute inset-0 grid place-items-center rounded-chip border border-dashed border-warn bg-base/40 font-mono text-section text-warn'
      >
        +
      </span>
    </Pressable>
  )
}
