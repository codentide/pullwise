import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { CardImage } from './CardImage.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from './useStore.ts'
import { cardsById } from '@/lib/gameData.ts'
import { deckSize } from '@/lib/deckRules.ts'
import { missingFor } from '@/lib/deckAnalysis.ts'
import { parseDecklist } from '@/lib/decklist.ts'
import type { Deck } from '@/lib/types.ts'
import { Button } from '@/components/Button.tsx'
import { Panel, EmptyState } from '@/components/Panel.tsx'
import { Heading } from '@/components/Heading.tsx'
import { TextInput, Textarea } from '@/components/Field.tsx'
import { Pressable } from '@/components/Pressable.tsx'

export function DeckList ({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useTranslations('decks')
  const state = useStore()
  const [importing, setImporting] = useState(false)

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Heading level='page'>{t('title')}</Heading>
        <div className='ml-auto flex gap-2'>
          <Button variant='quiet' className='px-3 py-1.5 text-meta' onClick={() => setImporting((open) => !open)}>
            {t('pasteList')}
          </Button>
          <Button onClick={() => onOpen(actions.createDeck(t('new')))}>
            <Icon name='plus' size={14} />
            {t('new')}
          </Button>
        </div>
      </div>

      {importing && <ImportPanel onDone={onOpen} onClose={() => setImporting(false)} />}

      {state.decks.length === 0
        ? <DecksEmpty onImport={() => setImporting(true)} />
        : (
          <ul className='grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]'>
            {state.decks.map((deck) => (
              <li key={deck.id}>
                <DeckCard deck={deck} onOpen={() => onOpen(deck.id)} />
              </li>
            ))}
          </ul>
          )}
    </div>
  )
}

function DeckCard ({ deck, onOpen }: { deck: Deck, onOpen: () => void }) {
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
    <Pressable
      onClick={onOpen}
      className='flex w-full flex-col gap-3 rounded-none border border-line bg-raised p-3 text-left transition-colors duration-150 hover:border-line-strong hover:bg-overlay'
    >
      <div className='flex items-start justify-between gap-2'>
        <span className='truncate font-medium text-ink-high'>{deck.name}</span>
        <span className={`tnum shrink-0 text-meta ${size === 20 ? 'text-ink-low' : 'text-warn'}`}>
          {size}/20
        </span>
      </div>

      {preview.length > 0
        ? (
          <div className='flex gap-1'>
            {preview.map((card) => <CardImage key={card.id} card={card} className='w-1/5' />)}
          </div>
          )
        : <p className='py-4 text-center text-meta text-ink-low'>{t('empty')}</p>}

      <span className={`text-label ${missingCount > 0 ? 'text-invalid' : 'text-valid'}`}>
        {missingCount > 0 ? t('missing', { count: missingCount }) : t('complete')}
      </span>
    </Pressable>
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
    const id = actions.createDeck(name.trim() !== '' ? name.trim() : t('importTitle'), parsed.entries)
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
            <span className='text-warn'>
              {t('importUnresolved', { list: parsed.unresolved.slice(0, 3).join(' · ') })}
              {parsed.unresolved.length > 3 &&
                ` ${t('importUnresolvedMore', { count: parsed.unresolved.length - 3 })}`}
            </span>
          )}
        </div>
      )}

      <Button className='self-start' onClick={submit} disabled={parsed == null || parsed.entries.length === 0}>
        {t('importSubmit')}
      </Button>
    </Panel>
  )
}
