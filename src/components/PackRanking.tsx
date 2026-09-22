import { useState, type CSSProperties, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useFormatter, useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { CardImage } from '@/components/CardImage.tsx'
import { Hint } from '@/components/Hint.tsx'
import { Badge } from '@/components/Indicators.tsx'
import { Heading } from '@/components/Heading.tsx'
import { Notice } from '@/components/Notice.tsx'
import { Pressable } from '@/components/Pressable.tsx'
import { RarityPips } from '@/components/Rarity.tsx'
import { Link } from '@/i18n/navigation.ts'
import { PackImage } from './PackImage.tsx'
import { packHref, packMath, setName } from '@/lib/gameData.ts'
import type { DeckAnalysis } from '@/lib/deckAnalysis.ts'
import type { Card, MissingCard, PackRef } from '@/lib/types.ts'

/** The predicate `coveredHere` already used to count what a pack covers, reused here to name the cards instead. */
const missingIn = (missing: MissingCard[], pack: PackRef): MissingCard[] =>
  missing.filter((entry) => packMath.isInPack(entry.card, pack))

/** PT—01 Pack ranking · PT—03 The figure that resolves. The winner shows its artwork (a pack is recognised by sight before its name; the panel had been hiding the image below 28rem, every width the deck editor's aside has ever been) as a headline, everything else as a league table, with probability and estimated packs always paired — one without the other misleads — and every estimate carrying a "~". */
export function PackRanking ({ analysis }: { analysis: DeckAnalysis }) {
  const t = useTranslations('ranking')
  const format = useFormatter()
  const { ranking, simulation, missing, unobtainable } = analysis
  const [winner, ...rest] = ranking.slice(0, 6)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (key: string): void => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Precision follows magnitude: most packs sit under 10%, and rounding 3.3% to 3% throws away the difference between two packs the ranking is there to compare.
  const percent = (value: number): string =>
    format.number(value, {
      style: 'percent',
      minimumFractionDigits: value < 0.1 ? 1 : 0,
      maximumFractionDigits: value < 0.1 ? 1 : 0
    })

  if (missing.length === 0) {
    return (
      <div className='flex flex-col gap-3'>
        <Notice tone='success'>{t('nothingMissing')}</Notice>
        {unobtainable.length > 0 && <Unobtainable analysis={analysis} />}
      </div>
    )
  }

  if (winner == null) return null

  // How much of what is missing this one pack actually covers — the coach line is only honest if it knows.
  const winnerKey = `${winner.pack.set}/${winner.pack.pack}`
  const winnerMissing = missingIn(missing, winner.pack)
  const coveredHere = winnerMissing.length
  const missingCount = missing.length

  return (
    <div className='flex flex-col gap-6'>
      <section className='@container overflow-hidden rounded-surface border border-line bg-raised'>
        <div className='flex items-center justify-between border-b border-line px-4 py-2'>
          <p className='font-mono text-label uppercase tracking-[0.14em] text-accent'>
            {t('openThis')}
          </p>
          <Hint label={t('recommendationHintLabel')}>{t('recommendationHint')}</Hint>
        </div>

        <Link
          href={packHref(winner.pack.set, winner.pack.pack)}
          className='flex gap-4 p-4 transition-colors duration-150 hover:bg-overlay'
        >
          <PackImage
            set={winner.pack.set}
            pack={winner.pack.pack}
            radius='control'
            className='w-16 shrink-0 self-start @xs:w-20 @sm:w-24'
          />

          <div className='min-w-0 flex-1'>
            <p className='game-name text-label uppercase tracking-[0.1em] text-ink-low'>
              {setName(winner.pack.set)}
            </p>
            <Heading level='gameName' as='h3' className='mt-1'>
              {winner.pack.pack}
            </Heading>
            {winner.estimated && (
              <Badge tone='warn' className='mt-2' title={t('estimatedTitle')}>
                <Icon name='warn' size={10} />
                {t('estimated')}
              </Badge>
            )}

            <div className='mt-4 flex flex-wrap items-end gap-x-6 gap-y-4'>
              <Figure
                value={percent(winner.chanceOfUseful)}
                label={t('perPackLabel')}
                accent
              />
              {simulation != null && (
                <Figure
                  value={`~${simulation.packsMedian}${simulation.censored ? '+' : ''}`}
                  label={t('toFinishLabel')}
                />
              )}
            </div>

            <p className='mt-4 max-w-prose text-meta leading-relaxed text-ink-mid'>
              {rest.length === 0
                ? t('coachOnlyOne')
                : coveredHere === missingCount
                  ? t('coachAllHere', { count: missingCount })
                  : t('coachMostlyHere', { count: missingCount, here: coveredHere })}
            </p>
          </div>
        </Link>

        <div className='border-t border-line px-4 py-3'>
          <Pressable
            aria-expanded={expanded.has(winnerKey)}
            onClick={() => toggle(winnerKey)}
            className='flex items-center gap-1 font-mono text-label uppercase tracking-[0.1em] text-ink-mid transition-colors duration-150 hover:text-ink-high'
          >
            {expanded.has(winnerKey) ? t('hideCards') : t('showCards')}
            <Icon
              name='chevron'
              size={12}
              className={`transition-transform duration-150 ${expanded.has(winnerKey) ? 'rotate-180' : ''}`}
            />
          </Pressable>
          {expanded.has(winnerKey) && (
            <div className='mt-3'>
              <MissingCardChips cards={winnerMissing} />
            </div>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section>
          <Heading level='eyebrow' as='h4' className='px-3'>{t('otherPacks')}</Heading>
          <ol className='mt-2 divide-y divide-line'>
            {rest.map((entry, index) => {
              const key = `${entry.pack.set}/${entry.pack.pack}`
              const rowMissing = missingIn(missing, entry.pack)
              return (
                <li key={key}>
                  <div className='flex items-center gap-1'>
                    <Link
                      href={packHref(entry.pack.set, entry.pack.pack)}
                      className='flex min-w-0 flex-1 items-center gap-4 px-3 py-3 transition-colors duration-150 hover:bg-overlay'
                    >
                      <span className='tnum font-mono text-label text-ink-low'>
                        {String(index + 2).padStart(2, '0')}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <p className='game-name truncate text-meta text-ink-high'>
                          {entry.pack.pack}
                          <span className='text-ink-low'> — {setName(entry.pack.set)}</span>
                        </p>
                        {/* The bar reads relative to the winner's own chance (the big number above), not to 100% or this row's own percentage; `aria-hidden` since the text beside it already says the number. */}
                        <div
                          aria-hidden
                          className='mt-2 h-px bg-line'
                          title={t('relativeToWinner')}
                        >
                          <div
                            className='pw-fill h-px bg-line-control'
                            style={{
                              width: `${Math.max(2, (entry.chanceOfUseful / winner.chanceOfUseful) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      {/* text-body, sized to the row not the word "meta", so this doesn't read as an afterthought squeezed against the taller name-plus-bar block beside it. */}
                      <span className='tnum shrink-0 font-mono text-body text-ink-mid'>
                        {percent(entry.chanceOfUseful)}
                      </span>
                    </Link>
                    <Pressable
                      aria-expanded={expanded.has(key)}
                      aria-label={expanded.has(key) ? t('hideCards') : t('showCards')}
                      onClick={() => toggle(key)}
                      className='shrink-0 p-3 text-ink-low transition-colors duration-150 hover:text-ink-high'
                    >
                      <Icon
                        name='chevron'
                        size={12}
                        className={`transition-transform duration-150 ${expanded.has(key) ? 'rotate-180' : ''}`}
                      />
                    </Pressable>
                  </div>
                  {expanded.has(key) && (
                    <div className='px-3 pb-3'>
                      <MissingCardChips cards={rowMissing} />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <p className='text-label leading-relaxed text-ink-low'>{t('explainer')}</p>

      {unobtainable.length > 0 && <Unobtainable analysis={analysis} />}
    </div>
  )
}

/** A figure and its label. M—01: figures enter from below when they change. */
function Figure ({ value, label, accent = false }: { value: string, label: string, accent?: boolean }) {
  return (
    <div>
      <p
        key={value}
        className={`pw-roll tnum font-display text-title leading-none font-extrabold @md:text-hero ${
          accent ? 'text-accent' : 'text-ink-high'
        }`}
      >
        {value}
      </p>
      <p className='mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-low'>{label}</p>
    </div>
  )
}

/** The specific missing cards a pack covers, named — not just the count `coveredHere` already gave. */
function MissingCardChips ({ cards }: { cards: MissingCard[] }) {
  return (
    <div className='flex flex-wrap gap-1'>
      {cards.map(({ card }) => <CardChip key={card.id} card={card} />)}
    </div>
  )
}

/** A chip that shows the card's own art and its already-known facts (rarity, set, type, weakness, evolves-from — whatever `Card` carries) in a floating preview on hover (desktop) or tap (touch). Positioning is `@floating-ui/react-dom` — already installed, at zero extra weight, as the engine behind `@radix-ui/react-select`'s own popper — rather than hand-rolled measurement: `flip()` and `shift()` keep the panel inside the *viewport*, and `autoUpdate` keeps that correct through scroll/resize for as long as the hover lasts. Note what they don't do: neither knows about arbitrary sibling content, only the viewport edge, so they can't on their own tell "there is room" from "there is room, but the pack's own odds figures are sitting in it." Defaulting to `bottom` rather than `top` is what actually avoids that in practice — the space below a chip is reliably open page, where above it is often another dense card. */
function CardChip ({ card }: { card: Card }) {
  const [open, setOpen] = useState(false)
  // `x`/`y` rather than the bundled `floatingStyles`: that convenience object positions via `transform`,
  // which would fight the entrance animation's own `transform` (both can't own the property at once —
  // the one applied last wins, and the visible symptom is the panel appearing to fly in from the wrong
  // place before settling). Plain `top`/`left` leaves `transform` free for the animation alone.
  const { refs, x, y, strategy } = useFloating({
    open,
    placement: 'bottom',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate
  })

  return (
    <Pressable
      ref={refs.setReference}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((current) => !current)}
      className={`inline-flex items-center gap-1 rounded-control border px-2 py-1 text-label transition-colors duration-150 ${
        open ? 'border-line-strong bg-raised text-ink-high' : 'border-line bg-overlay text-ink-mid hover:border-line-strong'
      }`}
    >
      {card.name}
      <RarityPips rarity={card.rarity} />
      {open && createPortal(
        <CardPreview card={card} ref={refs.setFloating} style={{ position: strategy, top: y ?? 0, left: x ?? 0 }} />,
        document.body
      )}
    </Pressable>
  )
}

/** The floating panel's own content — positioning is entirely the caller's job (`ref`/`style` come straight from `useFloating`), this just lays out what goes inside it. Same shape as the card detail page's own header (`card/[id]/page.tsx`): art on the left in a fixed-width column, facts on the right — just smaller, since this is a hover glance, not the page itself. */
function CardPreview ({ card, ref, style }: { card: Card, ref: Ref<HTMLDivElement>, style: CSSProperties }) {
  const t = useTranslations('cardPage')

  return (
    <div
      ref={ref}
      style={style}
      className='pw-roll pointer-events-none z-50 flex w-60 items-start gap-2 rounded-control border border-line-strong bg-raised p-2'
    >
      <CardImage card={card} radius='control' className='w-20 shrink-0' />
      <div className='min-w-0'>
        <p className='flex flex-wrap items-center gap-1 text-meta font-semibold text-ink-high'>
          {card.name}
          <RarityPips rarity={card.rarity} />
        </p>
        <p className='game-name mt-1 text-label text-ink-mid'>{setName(card.set)}</p>
        {card.element != null && <p className='mt-1 text-label text-ink-mid'>{card.element}</p>}
        {card.weakness != null && <p className='text-label text-ink-mid'>{t('weakTo', { type: card.weakness })}</p>}
        {card.evolvesFrom != null && <p className='text-label text-ink-mid'>{t('evolvesFrom', { name: card.evolvesFrom })}</p>}
      </div>
    </div>
  )
}

function Unobtainable ({ analysis }: { analysis: DeckAnalysis }) {
  const t = useTranslations('ranking')
  return (
    <Notice tone='warning'>
      <p>{t('notFromPacks')}</p>
      <p className='text-label text-ink-mid'>
        {t('notFromPacksBody', {
          list: analysis.unobtainable.map((entry) => entry.card.name).join(' · ')
        })}
      </p>
    </Notice>
  )
}
