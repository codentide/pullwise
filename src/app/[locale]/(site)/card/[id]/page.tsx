import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { routing } from '@/i18n/routing.ts'
import { SiteChrome } from '../../_components/SiteChrome.tsx'
import { StaticCardImage } from '../../_components/StaticCardImage.tsx'
import { CardGridLinks } from '../../_components/CardGridLinks.tsx'
import { cards, cardsById, setName } from '@/lib/gameData.ts'
import { cardOdds } from '@/lib/deckAnalysis.ts'
import { Heading } from '@/components/Heading.tsx'

export const dynamicParams = false

export function generateStaticParams (): Array<{ locale: string, id: string }> {
  return routing.locales.flatMap((locale) => cards.map((card) => ({ locale, id: card.id })))
}

interface Props { params: Promise<{ locale: string, id: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const card = cardsById.get(id)
  if (card == null) return {}

  const t = await getTranslations({ locale, namespace: 'cardPage' })
  const format = await getFormatter({ locale })
  const best = cardOdds(card)[0]

  const where = best != null
    ? t('metaFound', {
      pack: best.pack.pack,
      set: setName(best.pack.set),
      chance: format.number(best.chance, { style: 'percent', maximumFractionDigits: 2 }),
      packs: best.expectedPacks ?? 0
    })
    : t('metaNotFound')

  return {
    title: t('metaTitle', { name: card.name, id: card.id }),
    description: t('metaDescription', { name: card.name, rarity: card.rarity, set: setName(card.set), where }),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((other) => [other, `/${other}/card/${card.id}`])
      )
    },
    openGraph: { title: `${card.name} — ${setName(card.set)}`, description: where, type: 'article' }
  }
}

export default async function CardPage ({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const card = cardsById.get(id)
  if (card == null) notFound()

  const t = await getTranslations('cardPage')
  const format = await getFormatter()
  const odds = cardOdds(card)
  const best = odds[0]
  const sameSet = cards.filter((other) => other.set === card.set && other.id !== card.id).slice(0, 12)

  const percent = (value: number): string =>
    format.number(value, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <SiteChrome>
      <article className='grid gap-6 sm:grid-cols-[14rem_1fr]'>
        <div><StaticCardImage card={card} priority /></div>

        <div className='flex flex-col gap-5'>
          <header>
            <Heading level='page'>{card.name}</Heading>
            <p className='mt-1 text-meta text-ink-mid'>
              <Link href={`/set/${card.set}`} className='text-accent hover:underline'>
                {setName(card.set)}
              </Link>
              {' · '}{t('cardNumber', { number: card.number })}
              {' · '}{t('rarity', { rarity: card.rarity })}
              {card.element != null && ` · ${card.element}`}
              {card.weakness != null && ` · ${t('weakTo', { type: card.weakness })}`}
            </p>
            {card.evolvesFrom != null && (
              <p className='mt-1 text-meta text-ink-mid'>{t('evolvesFrom', { name: card.evolvesFrom })}</p>
            )}
          </header>

          <section>
            <Heading level='sub'>{t('whichPack')}</Heading>
            {odds.length === 0
              ? <p className='mt-2 text-meta leading-relaxed text-ink-mid'>{t('notFromPacks')}</p>
              : (
                <>
                  <ul className='mt-2 flex flex-col gap-px overflow-hidden rounded-surface border border-line bg-line'>
                    {odds.map((entry) => (
                      <li
                        key={`${entry.pack.set}/${entry.pack.pack}`}
                        className='flex items-center gap-3 bg-raised px-3 py-2.5'
                      >
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-meta text-ink-high'>{entry.pack.pack}</p>
                          <p className='truncate text-label text-ink-low'>
                            {setName(entry.pack.set)}
                            {entry.estimated && ` · ${t('estimatedOdds')}`}
                          </p>
                        </div>
                        <div className='tnum shrink-0 text-right'>
                          <p className='text-body font-semibold leading-tight text-accent'>
                            {percent(entry.chance)}
                          </p>
                          <p className='text-label text-ink-low'>{t('perPack')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {best?.expectedPacks != null && (
                    <p className='mt-2 text-meta leading-relaxed text-ink-mid'>
                      {t.rich('expected', {
                        pack: best.pack.pack,
                        packs: best.expectedPacks,
                        b: (chunks) => <strong className='tnum font-semibold text-ink-high'>{chunks}</strong>
                      })}
                    </p>
                  )}
                </>
                )}
          </section>

          <section className='rounded-surface border border-line bg-raised p-3'>
            <p className='text-meta leading-relaxed text-ink-mid'>{t('ctaBody')}</p>
            <Link
              href='/'
              className='mt-2 inline-block rounded-control bg-accent px-3 py-1.5 text-meta font-medium text-accent-ink'
            >
              {t('ctaAction')}
            </Link>
          </section>
        </div>
      </article>

      {sameSet.length > 0 && (
        <section className='mt-8'>
          <Heading level='sub'>{t('moreFrom', { set: setName(card.set) })}</Heading>
          <CardGridLinks cards={sameSet} showRarity={false} />
        </section>
      )}
    </SiteChrome>
  )
}
