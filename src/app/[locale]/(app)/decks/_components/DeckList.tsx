'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { CardImage } from '@/components/CardImage.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from '@/hooks/useStore.ts'
import { useHydrated } from '@/hooks/useHydrated.ts'
import { cardsById } from '@/lib/gameData.ts'
import { deckSize } from '@/lib/deckRules.ts'
import { missingFor } from '@/lib/deckAnalysis.ts'
import { parseDecklist } from '@/lib/decklist.ts'
import type { Deck } from '@/lib/types.ts'

import { Button } from '@/components/Button.tsx'
import { Panel, EmptyState } from '@/components/Panel.tsx'
import { Heading } from '@/components/Heading.tsx'
import { Notice } from '@/components/Notice.tsx'
import { TextInput, Textarea } from '@/components/Field.tsx'
import { Link, useRouter } from '@/i18n/navigation.ts'

/** The preview always draws five slots, filled or not. */
const PREVIEW_SLOTS = 5

/** Three across at most: at four the preview thumbnails fell to 48px, under what it takes to recognise a card by its art — and recognising the deck at a glance is the only job this card has. */
const DECK_COLUMNS = '[grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]'

export function DeckList () {
  const t = useTranslations('decks')
  const state = useStore()
  const hydrated = useHydrated()
  const router = useRouter()
  const [importing, setImporting] = useState(false)

  /** A new deck is only useful open, so creating one goes straight into it. */
  const openNew = (): void => router.push(`/decks/${actions.createDeck(t('new'))}`)

  // Before hydration `state.decks` is deliberately the empty snapshot (see useStore.ts), indistinguishable from a returning visitor who really has none — rendering DecksEmpty here would flash it on every load.
  if (!hydrated) return <div aria-busy className='min-h-dvh' />

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Heading level='page'>{t('title')}</Heading>
        <div className='ml-auto flex gap-2'>
          <Button variant='quiet' className='px-3 py-2 text-meta' onClick={() => setImporting((open) => !open)}>
            {t('pasteList')}
          </Button>
          <Button onClick={openNew}>
            <Icon name='plus' size={14} />
            {t('new')}
          </Button>
        </div>
      </div>

      {importing && (
        <ImportPanel
          onDone={(id) => router.push(`/decks/${id}`)}
          onClose={() => setImporting(false)}
        />
      )}

      {state.decks.length === 0
        ? <DecksEmpty onImport={() => setImporting(true)} />
        : (
          <ul className={`grid gap-3 ${DECK_COLUMNS}`}>
            {state.decks.map((deck) => (
              <li key={deck.id} className='flex'>
                <DeckCard deck={deck} />
              </li>
            ))}
          </ul>
          )}
    </div>
  )
}

function DeckCard ({ deck }: { deck: Deck }) {
  const t = useTranslations('decks')
  const state = useStore()
  const size = deckSize(deck)
  const missingCount = missingFor(deck, state.knowledge)
    .reduce((total, entry) => total + entry.needed, 0)
  const preview = deck.entries.slice(0, 5).flatMap((entry) => {
    const card = cardsById.get(entry.cardId)
    return card != null ? [card] : []
  })

  return (
    <Link
      href={`/decks/${deck.id}`}
      className='flex w-full flex-col gap-3 rounded-surface border border-line bg-raised p-3 transition-colors duration-150 hover:border-line-strong hover:bg-overlay'
    >
      <div className='flex items-start justify-between gap-2'>
        <span className='truncate font-medium text-ink-high'>{deck.name}</span>
        <span className={`tnum shrink-0 text-meta ${size === 20 ? 'text-ink-low' : 'text-warn'}`}>
          {size}/20
        </span>
      </div>

      <div className='grid grid-cols-5 gap-1'>
        {preview.map((card) => <CardImage key={card.id} card={card} radius='chip' />)}
        {Array.from({ length: PREVIEW_SLOTS - preview.length }, (_, index) => (
          <span
            key={`slot-${index}`}
            className='rounded-chip border border-dashed border-line'
            style={{ aspectRatio: 'var(--aspect-card)' }}
          />
        ))}
      </div>

      {/* What you're short of is information, not a fault — red here used to frame an ordinary half-collected deck as a failure, the trap this app exists to avoid; finishing one still gets its green, an acknowledgement that asks for nothing. */}
      <span className={`mt-auto flex items-center gap-1 text-label ${missingCount > 0 ? 'text-ink-mid' : 'text-valid'}`}>
        {size === 0
          ? '\u00a0'
          : missingCount > 0
            ? <><Icon name='pack' size={11} />{t('missing', { count: missingCount })}</>
            : t('complete')}
      </span>
    </Link>
  )
}

function DecksEmpty ({ onImport }: { onImport: () => void }) {
  const t = useTranslations('decks')
  return (
    <EmptyState>
      <p className='text-body text-ink-high'>{t('emptyTitle')}</p>
      <p className='mx-auto mt-2 max-w-md text-meta leading-relaxed text-ink-mid'>{t('emptyBody')}</p>
      <Button variant='link' onClick={onImport} className='mt-4 text-meta'>
        {t('emptyAction')}
      </Button>
    </EmptyState>
  )
}

function ImportPanel ({ onDone, onClose }: { onDone: (id: string) => void, onClose: () => void }) {
  const t = useTranslations('decks')
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const parsed = text.trim() !== '' ? parseDecklist(text) : null
  const total = parsed?.entries.reduce((sum, entry) => sum + entry.copies, 0) ?? 0

  const submit = (): void => {
    if (parsed == null || parsed.entries.length === 0) return
    const id = actions.createDeck(name.trim() !== '' ? name.trim() : t('importTitle'), parsed.entries, parsed.energy)
    onClose()
    onDone(id)
  }

  return (
    <Panel pad='sm' className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <Heading level='sub'>{t('importTitle')}</Heading>
        <Button variant='ghost' onClick={onClose} aria-label={t('close')} className='p-1'>
          <Icon name='close' />
        </Button>
      </div>

      <TextInput
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t('importName')}
      />

      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        spellCheck={false}
        placeholder={'2 Pikachu ex A1 096\n2 Zapdos ex A1 104\n2 Professor’s Research P-A 007'}
        className='tnum p-2 font-mono'
      />

      {parsed != null && (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-label'>
          <span className='text-ink-mid'>
            {t('importParsed', { distinct: parsed.entries.length, total })}
          </span>
          {parsed.unresolved.length > 0 && (
            <Notice tone='warning'>
              {t('importUnresolved', { list: parsed.unresolved.slice(0, 3).join(' · ') })}
              {parsed.unresolved.length > 3 &&
                ` ${t('importUnresolvedMore', { count: parsed.unresolved.length - 3 })}`}
            </Notice>
          )}
        </div>
      )}

      <Button className='self-start' onClick={submit} disabled={parsed == null || parsed.entries.length === 0}>
        {t('importSubmit')}
      </Button>
    </Panel>
  )
}
