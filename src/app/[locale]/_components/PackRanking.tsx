import { useFormatter, useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Badge } from '@/components/Indicators.tsx'
import { Heading } from '@/components/Heading.tsx'
import { Notice } from '@/components/Notice.tsx'
import { packMath, setName } from '@/lib/gameData.ts'
import type { DeckAnalysis } from '@/lib/deckAnalysis.ts'

/**
 * PT—01 Pack ranking · PT—03 The figure that resolves.
 *
 * One winner treated as a headline; everything else as a league table. The big
 * number never repeats below. Probability and estimated packs always appear
 * together — one without the other misleads — and under them a line of why, in
 * a coach's voice.
 *
 * Every estimate carries a "~". An exact number where there is chance is a
 * design lie.
 */
export function PackRanking ({ analysis }: { analysis: DeckAnalysis }) {
  const t = useTranslations('ranking')
  const format = useFormatter()
  const { ranking, simulation, missing, unobtainable } = analysis
  const [winner, ...rest] = ranking.slice(0, 6)

  // Precision follows magnitude. The brand document shows 34%, where a decimal
  // would be noise — but most packs sit under 10%, and rounding 3.3% to 3% throws
  // away the difference between two packs the ranking is there to compare.
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

  // How much of what is missing this one pack actually covers — the coach line
  // is only honest if it knows.
  const coveredHere = missing.filter((entry) => packMath.isInPack(entry.card, winner.pack)).length
  const missingCount = missing.length

  return (
    <div className='flex flex-col gap-6'>
      <section className='@container border border-line bg-raised'>
        <p className='border-b border-line px-4 py-2 font-mono text-label uppercase tracking-[0.14em] text-accent'>
          {t('openThis')}
        </p>

        <div className='p-4'>
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
      </section>

      {rest.length > 0 && (
        <section>
          <Heading level='eyebrow' as='h4'>{t('otherPacks')}</Heading>
          <ol className='mt-2'>
            {rest.map((entry, index) => (
              <li
                key={`${entry.pack.set}/${entry.pack.pack}`}
                className='flex items-center gap-3 border-b border-line py-3'
              >
                <span className='tnum font-mono text-label text-ink-low'>
                  {String(index + 2).padStart(2, '0')}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='game-name truncate text-meta text-ink-high'>
                    {entry.pack.pack}
                    <span className='text-ink-low'> — {setName(entry.pack.set)}</span>
                  </p>
                  <div className='mt-2 h-px bg-line'>
                    <div
                      className='pw-fill h-px bg-line-control'
                      style={{
                        width: `${Math.max(2, (entry.chanceOfUseful / winner.chanceOfUseful) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                <span className='tnum shrink-0 text-meta text-ink-mid'>
                  {percent(entry.chanceOfUseful)}
                </span>
              </li>
            ))}
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

function Unobtainable ({ analysis }: { analysis: DeckAnalysis }) {
  const t = useTranslations('ranking')
  return (
    <div className='border border-line bg-raised p-3'>
      <p className='flex items-center gap-2 text-label text-warn'>
        <Icon name='warn' size={12} />
        {t('notFromPacks')}
      </p>
      <p className='mt-1 text-label leading-relaxed text-ink-mid'>
        {t('notFromPacksBody', {
          list: analysis.unobtainable.map((entry) => entry.card.name).join(' · ')
        })}
      </p>
    </div>
  )
}
