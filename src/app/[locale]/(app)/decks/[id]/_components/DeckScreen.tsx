'use client'

import { useTranslations } from 'next-intl'
import { DeckEditor } from './DeckEditor.tsx'
import { useStore } from '@/hooks/useStore.ts'
import { useHydrated } from '@/hooks/useHydrated.ts'
import { EmptyState } from '@/components/Panel.tsx'
import { ButtonLink } from '@/components/Button.tsx'
import { Heading } from '@/components/Heading.tsx'

/** Resolves the deck the URL names; the middle of its three states is the whole reason this exists — before hydration the store reports empty on purpose, so "not loaded yet" and "no such deck" look identical and rendering the editor's absence would flash *deck not found* on every load; the third state isn't a 404, since deck ids are local to the browser that made them and a link resolving elsewhere is expected, not broken. */
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
