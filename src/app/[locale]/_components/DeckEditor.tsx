import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Button } from '@/components/Button.tsx'
import { Pressable } from '@/components/Pressable.tsx'
import { TextInput } from '@/components/Field.tsx'
import { ConfirmDialog } from '@/components/Dialog.tsx'
import { Heading } from '@/components/Heading.tsx'
import { Badge } from '@/components/Indicators.tsx'
import { DeckCardTile, cycleOwned } from './CardTile.tsx'
import { CardImage } from './CardImage.tsx'
import { PackRanking } from './PackRanking.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from './useStore.ts'
import { DECK_SIZE, deckSize, validateDeck, type DeckIssue } from '@/lib/deckRules.ts'
import { groupDeck, lineGaps, quickSearch } from '@/lib/deckGroups.ts'
import { parseDecklist } from '@/lib/decklist.ts'
import { analyzeDeck } from '@/lib/deckAnalysis.ts'
import type { Card, Deck } from '@/lib/types.ts'

/**
 * The deck editor.
 *
 * The search field is permanent rather than hidden behind a button: building a
 * deck is one continuous act of adding cards, and a picker that has to be opened
 * turns it into twelve separate ones. Results appear under the field as soon as
 * there is a query and take no room otherwise.
 *
 * Empty slots are drawn rather than counted. "Six placeholders" is read; "14/20"
 * has to be found and subtracted.
 *
 * Layout follows the brand system: 8/4, the deck leads and the recommendation
 * sits fixed on the right, recalculating on its own. There is never a save step
 * before seeing the number.
 */
export function DeckEditor ({ deck, onBack }: { deck: Deck, onBack: () => void }) {
  const t = useTranslations('editor')
  const groupName = useTranslations('groups')
  const state = useStore()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const size = deckSize(deck)
  const issues = validateDeck(deck)
  const groups = groupDeck(deck)
  const gaps = lineGaps(deck)
  const analysis = useMemo(() => analyzeDeck(deck, state.knowledge), [deck, state.knowledge])

  const add = (card: Card): void => {
    const current = deck.entries.find((entry) => entry.cardId === card.id)?.copies ?? 0
    actions.setCopies(deck.id, card.id, Math.min(2, current + 1))
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button variant='ghost' onClick={onBack} className='px-1.5'>
          <Icon name='back' size={14} />
          {t('back')}
        </Button>

        <TextInput
          value={deck.name}
          onChange={(event) => actions.renameDeck(deck.id, event.target.value)}
          aria-label={t('deckName')}
          className='min-w-0 flex-1 border-transparent bg-transparent px-2 py-1 font-display text-section font-semibold tracking-tight hover:border-line'
        />

        <span className={`tnum font-mono text-meta ${size === DECK_SIZE ? 'text-ink-mid' : 'text-warn'}`}>
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

      <div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
        <div className='flex flex-col gap-5'>
          <CardSearch deck={deck} onAdd={add} />

          {gaps.length > 0 && <LineGaps deck={deck} onAdd={add} />}

          {groups.map((group) => (
            <section key={group.id}>
              <Heading level='eyebrow' as='h3'>
                {groupName(group.id)} · {group.count}
              </Heading>
              <ul className='mt-2 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]'>
                {group.entries.map(({ card, copies }) => (
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
            </section>
          ))}

          <EmptySlots remaining={DECK_SIZE - size} />
        </div>

        <aside className='flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start'>
          {issues.length > 0 && (
            <ul className='flex flex-col gap-1.5 border border-line bg-raised p-3'>
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
 * Permanent search. Enter adds the first result and the field keeps its text, so
 * the next card is one correction away rather than a fresh start. Pasting more
 * than one line is treated as a decklist.
 */
function CardSearch ({ deck, onAdd }: { deck: Deck, onAdd: (card: Card) => void }) {
  const t = useTranslations('editor')
  const [query, setQuery] = useState('')
  const [pasted, setPasted] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => quickSearch(query), [query])
  const inDeck = new Map(deck.entries.map((entry) => [entry.cardId, entry.copies]))

  const handlePaste = (text: string): boolean => {
    if (!text.includes('\n')) return false
    const parsed = parseDecklist(text)
    if (parsed.entries.length === 0) return false
    actions.addEntries(deck.id, parsed.entries)
    setPasted(parsed.entries.length)
    setTimeout(() => setPasted(null), 4000)
    return true
  }

  return (
    <section className='flex flex-col gap-2'>
      <div className='relative'>
        <Icon
          name='search'
          size={15}
          className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-low'
        />
        <TextInput
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onPaste={(event) => {
            if (handlePaste(event.clipboardData.getData('text'))) event.preventDefault()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0] != null) {
              event.preventDefault()
              onAdd(results[0])
            }
            if (event.key === 'Escape') setQuery('')
          }}
          placeholder={t('searchPlaceholder')}
          className='w-full py-2.5 pl-8 pr-3 text-body'
        />
      </div>

      {pasted != null && (
        <p className='text-label text-valid'>{t('pastedList', { count: pasted })}</p>
      )}

      {query.trim() !== '' && (
        results.length === 0
          ? <p className='py-3 text-meta text-ink-low'>{t('noResults', { query })}</p>
          : (
            <>
              <p className='font-mono text-label text-ink-low'>{t('searchHint')}</p>
              <ul className='grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(5rem,1fr))]'>
                {results.map((card, index) => {
                  const copies = inDeck.get(card.id) ?? 0
                  return (
                    <li key={card.id}>
                      <Pressable
                        onClick={() => onAdd(card)}
                        aria-label={t('addOne', { name: card.name })}
                        className='group relative block w-full'
                      >
                        <CardImage
                          card={card}
                          className={`transition-transform duration-150 group-hover:scale-[1.04] ${
                            index === 0 ? 'outline outline-1 outline-accent' : ''
                          }`}
                        />
                        {copies > 0 && (
                          <Badge tone='accent' className='absolute right-1 top-1 tabular-nums'>
                            ×{copies}
                          </Badge>
                        )}
                      </Pressable>
                    </li>
                  )
                })}
              </ul>
            </>
            )
      )}
    </section>
  )
}

/**
 * An evolution with no pre-evolution. The validator already reports it; this
 * makes it fixable in one click, which is the difference between a warning and
 * a tool.
 */
function LineGaps ({ deck, onAdd }: { deck: Deck, onAdd: (card: Card) => void }) {
  const t = useTranslations('editor')
  const gaps = lineGaps(deck)

  return (
    <section className='flex flex-col gap-2 border border-warn/40 bg-warn/5 p-3'>
      {gaps.map((gap) => (
        <div key={gap.missingName} className='flex flex-wrap items-center gap-x-3 gap-y-2'>
          <div className='min-w-0 flex-1'>
            <p className='text-meta text-ink-high'>
              {t('lineGapTitle', { name: gap.needs.name, from: gap.missingName })}
            </p>
            <p className='text-label text-ink-mid'>{t('lineGapBody')}</p>
          </div>
          <div className='flex gap-1.5'>
            {gap.candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                onClick={() => onAdd(candidate)}
                aria-label={t('addOne', { name: candidate.name })}
                className='w-12 transition-transform duration-150 hover:scale-105'
              >
                <CardImage card={candidate} />
              </Pressable>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/** Slots are drawn, not counted: six placeholders are read, "14/20" is worked out. */
function EmptySlots ({ remaining }: { remaining: number }) {
  const t = useTranslations('editor')
  if (remaining <= 0) {
    return <p className='font-mono text-label uppercase tracking-[0.14em] text-valid'>{t('full')}</p>
  }

  return (
    <section>
      <Heading level='eyebrow' as='h3'>{t('emptySlots', { count: remaining })}</Heading>
      <ul
        aria-hidden
        className='mt-2 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]'
      >
        {Array.from({ length: Math.min(remaining, 20) }, (_, index) => (
          <li
            key={index}
            className='rounded-surface border border-dashed border-line-strong'
            style={{ aspectRatio: 'var(--aspect-card)' }}
          />
        ))}
      </ul>
    </section>
  )
}

/** Issues arrive as codes with parameters: the domain does not know the language. */
function IssueRow ({ issue }: { issue: DeckIssue }) {
  const t = useTranslations('issues')
  const tone =
    issue.level === 'error' ? 'text-invalid' : issue.level === 'warning' ? 'text-warn' : 'text-ink-low'

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
