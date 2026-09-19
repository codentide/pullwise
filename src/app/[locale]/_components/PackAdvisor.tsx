import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PackRanking } from './PackRanking.tsx'
import { useStore } from './useStore.ts'
import { analyzeMissing, missingAcrossDecks, missingFor } from '@/lib/deckAnalysis.ts'
import { EmptyState } from '@/components/Panel.tsx'
import { Select } from '@/components/Select.tsx'
import { Heading } from '@/components/Heading.tsx'

/**
 * The ranking, for one deck or all of them at once. With several decks in flight
 * the question stops being "what do I need for this one" and becomes "which pack
 * helps me most right now", which is what this answers.
 */
export function PackAdvisor () {
  const t = useTranslations('advisor')
  const state = useStore()
  const [scope, setScope] = useState<string>('all')

  const deck = state.decks.find((candidate) => candidate.id === scope)
  const analysis = useMemo(() => {
    const missing = deck != null
      ? missingFor(deck, state.knowledge)
      : missingAcrossDecks(state.decks, state.knowledge)
    return analyzeMissing(missing)
  }, [deck, state.decks, state.knowledge])

  if (state.decks.length === 0) {
    return (
      <EmptyState>
        <p className='text-body text-ink-high'>{t('emptyTitle')}</p>
        <p className='mx-auto mt-2 max-w-md text-meta leading-relaxed text-ink-mid'>{t('emptyBody')}</p>
      </EmptyState>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Heading level='page'>{t('title')}</Heading>
        <Select
          value={scope}
          onChange={setScope}
          aria-label={t('allDecks')}
          className='ml-auto'
          options={[
            { value: 'all', label: t('allDecks') },
            ...state.decks.map((candidate) => ({ value: candidate.id, label: candidate.name }))
          ]}
        />
      </div>

      <div className='max-w-2xl'>
        <PackRanking analysis={analysis} />
      </div>
    </div>
  )
}
