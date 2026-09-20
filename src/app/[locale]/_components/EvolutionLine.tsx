import { useTranslations } from 'next-intl'
import { Pressable } from '@/components/Pressable.tsx'
import { Notice } from '@/components/Notice.tsx'
import { CardImage } from './CardImage.tsx'
import type { ChainLink, LineGap } from '@/lib/deckGroups.ts'
import type { Card } from '@/lib/types.ts'

/**
 * A broken evolution line, drawn as the line itself.
 *
 * "Ivysaur evolves from Bulbasaur, which is not in the deck" is a sentence the
 * reader has to turn back into a picture. The picture is the thing: three slots
 * in a row with one of them empty reads as a missing link before anyone finishes
 * the heading — and the empty slot is where you click to fill it.
 *
 * The hole uses the same dashed treatment as an unmarked card, because it is the
 * same idea: absence, not error.
 *
 * It reads across rather than down. Stacked, three of these put 540px between
 * the search field and the deck; side by side the chain sits in the width the
 * sentence was leaving empty anyway, and each one costs a row.
 */
export function EvolutionLine ({ gap, onAdd }: { gap: LineGap, onAdd: (card: Card) => void }) {
  const t = useTranslations('editor')

  return (
    <Notice tone='warning' pad='md'>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
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
              {index > 0 && (
                <span aria-hidden className='font-mono text-label text-ink-low'>→</span>
              )}

              {link.inDeck != null
                ? (
                  <span className='w-12 opacity-60' title={link.name}>
                    <CardImage card={link.inDeck} radius='chip' />
                  </span>
                  )
                : (
              // One hole, one slot. Showing every printing here turns a chain
              // of three links into a row of seven cards and stops reading as
              // a chain at all. The cheapest printing is the one offered; any
              // other version is a search away.
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
        className='grid w-12 place-items-center rounded-chip border border-dashed border-warn text-label text-warn'
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
      className='relative w-12 rounded-chip transition-transform duration-150 hover:scale-105'
    >
      <span className='block opacity-40'>
        <CardImage card={candidate} radius='chip' />
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
