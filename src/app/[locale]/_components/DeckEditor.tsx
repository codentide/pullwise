import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Button } from '@/components/Button.tsx'
import { TextInput } from '@/components/Field.tsx'
import { ConfirmDialog } from '@/components/Dialog.tsx'
import { Panel, EmptyState } from '@/components/Panel.tsx'
import { CardImage } from './CardImage.tsx'
import { DeckCardTile, cycleOwned } from './CardTile.tsx'
import { CardFilters } from './CardFilters.tsx'
import { PackRanking } from './PackRanking.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from './useStore.ts'
import { cards as allCards } from '@/lib/gameData.ts'
import { emptyFilters, filterCards, type Filters } from '@/lib/filters.ts'
import { DECK_SIZE, deckCards, deckSize, validateDeck, type DeckIssue } from '@/lib/deckRules.ts'
import { analyzeDeck } from '@/lib/deckAnalysis.ts'
import type { Deck } from '@/lib/types.ts'
import { Pressable } from '@/components/Pressable.tsx'

export function DeckEditor ({ deck, onBack }: { deck: Deck, onBack: () => void }) {
  const t = useTranslations('editor')
  const state = useStore()
  const [adding, setAdding] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const entries = deckCards(deck)
  const size = deckSize(deck)
  const issues = validateDeck(deck)
  const analysis = useMemo(() => analyzeDeck(deck, state.knowledge), [deck, state.knowledge])

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button variant='ghost' onClick={onBack} className='px-1.5'>
          <Icon name='back' size={14} />
          {t('back')}
        </Button>

        <TextInput
          value={deck.name}
          onChange={(event) => actions.renameDeck(deck.id, event.target.value)}
          aria-label={t('deckName')}
          className='min-w-0 flex-1 border-transparent bg-transparent px-2 py-1 text-section font-semibold tracking-tight hover:border-line'
        />

        <span
          className={`tnum rounded-control px-2 py-1 text-meta ${
            size === DECK_SIZE ? 'text-ink-mid' : 'bg-warn/12 text-warn'
          }`}
        >
          {size}/{DECK_SIZE}
        </span>

        <Button
          variant='ghost'
          onClick={() => setConfirmingDelete(true)}
          aria-label={t('delete')}
          className='p-1.5 text-ink-low hover:text-invalid'
        >
          <Icon name='trash' />
        </Button>

        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t('confirmDelete', { name: deck.name })}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          destructive
          onConfirm={() => { actions.deleteDeck(deck.id); onBack() }}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-[1fr_20rem]'>
        <div className='flex flex-col gap-3'>
          {entries.length === 0
            ? (
              <EmptyState className='py-10 text-meta text-ink-mid'>{t('empty')}</EmptyState>
              )
            : (
              <ul className='grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr))]'>
                {entries.map(({ card, copies }) => (
                  <li key={card.id}>
                    <DeckCardTile
                      card={card}
                      copies={copies}
                      owned={state.knowledge[card.id]}
                      onCycleOwned={() =>
                        actions.setOwned(card.id, cycleOwned(state.knowledge[card.id], copies))}
                      onCopies={(next) => actions.setCopies(deck.id, card.id, next)}
                      onRemove={() => actions.setCopies(deck.id, card.id, 0)}
                    />
                  </li>
                ))}
              </ul>
              )}

          <Button variant='dashed' onClick={() => setAdding((open) => !open)}>
            <Icon name={adding ? 'close' : 'plus'} size={14} />
            {adding ? t('closeSearch') : t('addCards')}
          </Button>

          {adding && <CardPicker deck={deck} />}
        </div>

        <aside className='flex flex-col gap-3 lg:sticky lg:top-16 lg:self-start'>
          {issues.length > 0 && (
            <ul className='flex flex-col gap-1.5 rounded-none border border-line bg-raised p-3'>
              {issues.map((issue, index) => <IssueRow key={index} issue={issue} />)}
            </ul>
          )}

          <PackRanking analysis={analysis} />
        </aside>
      </div>
    </div>
  )
}

/**
 * Validation issues arrive as codes with parameters, never as sentences: the
 * domain must not know what language the interface speaks.
 */
function IssueRow ({ issue }: { issue: DeckIssue }) {
  const t = useTranslations('issues')
  const tone =
    issue.level === 'error'
      ? 'text-invalid'
      : issue.level === 'warning'
        ? 'text-warn'
        : 'text-ink-low'

  const message = (): string => {
    switch (issue.code) {
      case 'tooFewCards':
      case 'tooManyCards':
        return t(issue.code, { count: issue.count, size: issue.size })
      case 'tooManyCopies':
        return t(issue.code, { name: issue.name, copies: issue.copies, max: issue.max })
      case 'noBasic':
        return t(issue.code)
      case 'evolutionWithoutBase':
        return t(issue.code, { name: issue.name, from: issue.from })
      case 'unknownMetadata':
        return t(issue.code, { count: issue.count })
    }
  }

  return (
    <li className={`flex gap-1.5 text-label leading-relaxed ${tone}`}>
      {issue.level !== 'info' && <Icon name='warn' size={12} className='mt-px shrink-0' />}
      {message()}
    </li>
  )
}

/** Search panel for adding cards. One click adds; the next adds the second copy. */
function CardPicker ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const state = useStore()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [limit, setLimit] = useState(60)

  const results = useMemo(
    () => filterCards(allCards, filters, state.knowledge),
    [filters, state.knowledge]
  )
  const inDeck = new Map(deck.entries.map((entry) => [entry.cardId, entry.copies]))

  return (
    <Panel pad='sm' className='flex flex-col gap-3'>
      <CardFilters
        value={filters}
        onChange={(next) => { setFilters(next); setLimit(60) }}
        resultCount={results.length}
      />

      <ul className='grid max-h-[26rem] gap-2 overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(5.5rem,1fr))]'>
        {results.slice(0, limit).map((card) => {
          const copies = inDeck.get(card.id) ?? 0
          return (
            <li key={card.id}>
              <Pressable
                onClick={() => actions.setCopies(deck.id, card.id, Math.min(2, copies + 1))}
                aria-label={t('addToDeck', { name: card.name, count: copies })}
                className='group relative block w-full'
              >
                <CardImage
                  card={card}
                  className='transition-transform duration-150 group-hover:scale-[1.04]'
                />
                {copies > 0 && (
                  <span className='tnum absolute right-1 top-1 rounded-chip bg-accent px-1 text-label font-semibold text-accent-ink'>
                    ×{copies}
                  </span>
                )}
              </Pressable>
            </li>
          )
        })}
      </ul>

      {results.length > limit && (
        <Button variant='link' onClick={() => setLimit((current) => current + 120)} className='self-center'>
          {t('showMore', { count: results.length - limit })}
        </Button>
      )}
    </Panel>
  )
}
