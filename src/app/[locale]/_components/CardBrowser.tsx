import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CardTile, cycleOwned } from './CardTile.tsx'
import { CardFilters } from './CardFilters.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from './useStore.ts'
import { cards as allCards } from '@/lib/gameData.ts'
import { emptyFilters, filterCards, type Filters } from '@/lib/filters.ts'
import { Heading } from '@/components/Heading.tsx'

const PAGE = 80

/**
 * The full catalogue. Any card can be marked but none ever has to be: the "only
 * what I marked" filter turns this same view into your collection, which fills
 * itself in as you build decks.
 */
export function CardBrowser () {
  const t = useTranslations('browser')
  const state = useStore()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  const results = useMemo(
    () => filterCards(allCards, filters, state.knowledge),
    [filters, state.knowledge]
  )

  // Infinite scroll: 3,879 cards in the DOM at once is expensive even with lazy
  // images.
  useEffect(() => {
    const node = sentinel.current
    if (node == null) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setLimit((current) => current + PAGE)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const known = Object.keys(state.knowledge).length

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <Heading level='page'>{t('title')}</Heading>
        <p className='text-label text-ink-low'>
          {known > 0 ? t('marked', { known, total: allCards.length }) : t('unmarked')}
        </p>
      </div>

      <CardFilters
        value={filters}
        onChange={(next) => { setFilters(next); setLimit(PAGE) }}
        showKnownToggle
        resultCount={results.length}
      />

      {results.length === 0
        ? <p className='py-12 text-center text-meta text-ink-low'>{t('noResults')}</p>
        : (
          <>
            <ul className='grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(6.5rem,1fr))]'>
              {results.slice(0, limit).map((card) => (
                <li key={card.id}>
                  <CardTile
                    card={card}
                    owned={state.knowledge[card.id]}
                    onCycle={() => actions.setOwned(card.id, cycleOwned(state.knowledge[card.id], 2))}
                  />
                </li>
              ))}
            </ul>
            <div ref={sentinel} aria-hidden className='h-8' />
          </>
          )}
    </div>
  )
}
