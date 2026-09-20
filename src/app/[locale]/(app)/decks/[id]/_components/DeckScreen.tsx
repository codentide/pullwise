'use client'

import { useTranslations } from 'next-intl'
import { DeckEditor } from './DeckEditor.tsx'
import { useStore } from '@/hooks/useStore.ts'
import { useHydrated } from '@/hooks/useHydrated.ts'
import { EmptyState } from '@/components/Panel.tsx'
import { ButtonLink } from '@/components/Button.tsx'
import { Heading } from '@/components/Heading.tsx'

/**
 * Resolves the deck the URL names.
 *
 * Three states, and the middle one is the whole reason this component exists.
 * Before hydration the store reports empty on purpose, so "not loaded yet" and
 * "no such deck" look identical — rendering the editor's absence during that
 * window would flash *deck not found* on every single load.
 *
 * The third state is not a 404. Deck ids are local to the browser that made
 * them, so a link that does not resolve here is the expected outcome of opening
 * someone else's URL, not a broken address.
 */
export function DeckScreen ({ id }: { id: string }) {
  const t = useTranslations('editor')
  const state = useStore()
  const hydrated = useHydrated()
  const deck = state.decks.find((candidate) => candidate.id === id)

  if (!hydrated) return <div aria-busy className='min-h-dvh' />
  if (deck == null) {
    return (
      <EmptyState>
        <Heading level='sub' as='p'>{t('notFoundTitle')}</Heading>
        <p className='mx-auto mt-2 max-w-md text-meta leading-relaxed text-ink-mid'>
          {t('notFoundBody')}
        </p>
        <ButtonLink href='/decks' variant='quiet' className='mt-4'>
          {t('notFoundAction')}
        </ButtonLink>
      </EmptyState>
    )
  }

  return <DeckEditor deck={deck} />
}
