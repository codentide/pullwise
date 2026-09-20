import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Button } from '@/components/Button.tsx'
import { Pressable } from '@/components/Pressable.tsx'
import { TextInput } from '@/components/Field.tsx'
import { ConfirmDialog } from '@/components/Dialog.tsx'
import { Heading } from '@/components/Heading.tsx'
import { EmptyState } from '@/components/Panel.tsx'
import { Badge } from '@/components/Indicators.tsx'
import { Notice, NoticeList, type NoticeTone } from '@/components/Notice.tsx'
import { DeckCardTile } from './CardTile.tsx'
import { CardImage } from './CardImage.tsx'
import { PackRanking } from './PackRanking.tsx'
import { EvolutionLine } from './EvolutionLine.tsx'
import { actions } from '@/lib/store.ts'
import { useStore } from './useStore.ts'
import { DECK_SIZE, deckSize, validateDeck, type DeckIssue } from '@/lib/deckRules.ts'
import { groupDeck, lineGaps, quickSearch } from '@/lib/deckGroups.ts'
import { parseDecklist } from '@/lib/decklist.ts'
import { analyzeDeck } from '@/lib/deckAnalysis.ts'
import type { Card, Deck } from '@/lib/types.ts'

/**
 * The deck reads as a deck, not as a catalogue: enough columns that all twenty
 * cards are on screen at once. The count comes from the column's own width, not
 * the viewport's — the same grid sits beside the ranking on a desktop and alone
 * on a tablet, and a viewport breakpoint cannot tell those apart. It kept the
 * tiles at 200px and a full deck at two screens tall.
 */
const DECK_GRID =
  'grid gap-2 grid-cols-3 @xs:grid-cols-4 @md:grid-cols-5 @xl:grid-cols-6 @3xl:grid-cols-7 @4xl:grid-cols-8'

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
  // Two of the six issue codes are already on screen, and in a better form, so
  // the aside would only be repeating itself:
  //   · `tooFewCards` — the empty slots under the deck draw the same shortfall,
  //     and a red error while you are still adding cards reads as a scolding.
  //   · `evolutionWithoutBase` — EvolutionLine draws the broken chain above the
  //     deck with a button that fixes it. `lineGaps` groups by the missing base,
  //     so it covers every card this code would have flagged.
  const SAID_ELSEWHERE = ['tooFewCards', 'evolutionWithoutBase']
  const issues = validateDeck(deck).filter((issue) => !SAID_ELSEWHERE.includes(issue.code))
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
        <Button variant='ghost' onClick={onBack} className='px-2'>
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
          className='p-2 text-ink-low hover:text-invalid'
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
        <div className='@container flex flex-col gap-6'>
          <CardSearch deck={deck} onAdd={add} />

          {gaps.length > 0 && (
            <NoticeList>
              {gaps.map((gap) => (
                <EvolutionLine key={gap.missingName} gap={gap} onAdd={add} />
              ))}
            </NoticeList>
          )}

          {groups.map((group) => (
            <section key={group.id}>
              <Heading level='eyebrow' as='h3'>
                {groupName(group.id)} · {group.count}
              </Heading>
              <ul className={`mt-2 ${DECK_GRID}`}>
                {group.entries.map(({ card, copies }) => (
                  <li key={card.id}>
                    <DeckCardTile
                      card={card}
                      copies={copies}
                      owned={state.knowledge[card.id]}
                      onSetOwned={(owned) => actions.setOwned(card.id, owned)}
                      onCopies={(next) => actions.setCopies(deck.id, card.id, next)}
                      onRemove={() => actions.setCopies(deck.id, card.id, 0)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/*
            An empty deck is not a deck with twenty holes in it. Twenty dashed
            boxes and a green "you are not missing anything" is what the editor
            used to greet a new deck with — a wall of nothing, and a reassurance
            about a deck that does not exist yet. It gets a sentence instead.
          */}
          {size === 0
            ? (
              <EmptyState>
                <p className='mx-auto max-w-md text-meta leading-relaxed text-ink-mid'>{t('empty')}</p>
              </EmptyState>
              )
            : <EmptySlots remaining={DECK_SIZE - size} />}
        </div>

        <aside className='flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start'>
          {issues.length > 0 && (
            <NoticeList>
              {issues.map((issue, index) => <IssueRow key={index} issue={issue} />)}
            </NoticeList>
          )}
          {size > 0 && <PackRanking analysis={analysis} />}
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
          className='w-full py-3 pl-6 pr-3 text-body'
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
                          radius='control'
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
 * The room that is left. Slots are drawn, not counted: six placeholders are
 * read, "14/20" has to be worked out.
 *
 * Drawn small, though. At card size, eight empty slots took up more of the page
 * than the twelve cards above them, so a half-built deck looked mostly absent —
 * the opposite of what this app is for. A tray keeps the reading and gives the
 * absence the weight it deserves.
 */
function EmptySlots ({ remaining }: { remaining: number }) {
  const t = useTranslations('editor')
  if (remaining <= 0) {
    return (
      <p className='flex items-center gap-2 font-mono text-label uppercase tracking-[0.14em] text-valid'>
        <Icon name='check' size={12} />
        {t('full')}
      </p>
    )
  }

  return (
    <section>
      <Heading level='eyebrow' as='h3'>{t('emptySlots', { count: remaining })}</Heading>
      <ul aria-hidden className='mt-2 flex flex-wrap gap-2'>
        {Array.from({ length: remaining }, (_, index) => (
          <li
            key={index}
            className='w-12 rounded-control border border-dashed border-line-strong'
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
  const tone: NoticeTone =
    issue.level === 'error' ? 'error' : issue.level === 'warning' ? 'warning' : 'info'

  // Card and pack names render in mono in both locales — that is how the player
  // sees them in the game. The message catalogue marks them with <n>, so the
  // domain still knows nothing about typography.
  const gameName = (chunks: ReactNode): ReactNode => (
    <span className='game-name'>{chunks}</span>
  )

  const message = (): ReactNode => {
    switch (issue.code) {
      case 'tooFewCards':
      case 'tooManyCards':
        return t(issue.code, { count: issue.count, size: issue.size })
      case 'tooManyCopies':
        return t.rich(issue.code, { name: issue.name, copies: issue.copies, max: issue.max, n: gameName })
      case 'noBasic':
        return t(issue.code)
      case 'evolutionWithoutBase':
        return t.rich(issue.code, { name: issue.name, from: issue.from, n: gameName })
      case 'unknownMetadata':
        return t(issue.code, { count: issue.count })
    }
  }

  return <Notice tone={tone}>{message()}</Notice>
}
