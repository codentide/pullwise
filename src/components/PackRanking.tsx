import { useState } from 'react'
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
import type { MissingCard, PackRef } from '@/lib/types.ts'

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

/** The specific missing cards a pack covers, named — not just the count `coveredHere` already gave. Wraps rather than scrolling: a scrollable box would clip each chip's own hover-art tooltip at its edge, and in practice a pack's missing-card count stays well within a few wrapped rows (`DECK_SIZE` caps a single deck at 20). */
function MissingCardChips ({ cards }: { cards: MissingCard[] }) {
  return (
    <div className='flex flex-wrap gap-1'>
      {cards.map(({ card }) => <CardChip key={card.id} card={card} />)}
    </div>
  )
}

/** A chip that shows the card's own art on hover (desktop) or tap (touch) — same hover/tap-toggle pattern as `Hint.tsx`, just with the whole chip as the trigger instead of an icon, and artwork instead of prose. */
function CardChip ({ card }: { card: MissingCard['card'] }) {
  const [open, setOpen] = useState(false)

  return (
    <Pressable
      onClick={() => setOpen((current) => !current)}
      onBlur={() => setOpen(false)}
      className='group/chip relative inline-flex items-center gap-1 rounded-control border border-line bg-overlay px-2 py-1 text-label text-ink-mid transition-colors duration-150 hover:border-line-strong'
    >
      {card.name}
      <RarityPips rarity={card.rarity} />
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-24 -translate-x-1/2 rounded-control border border-line-strong bg-raised p-1 transition-opacity duration-150 ${
          open ? 'opacity-100' : 'opacity-0 group-hover/chip:opacity-100'
        }`}
      >
        <CardImage card={card} radius='control' />
      </span>
    </Pressable>
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
