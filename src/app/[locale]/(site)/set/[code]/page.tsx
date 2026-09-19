import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { routing } from '@/i18n/routing.ts'
import { SiteChrome } from '../../_components/SiteChrome.tsx'
import { CardGridLinks } from '../../_components/CardGridLinks.tsx'
import { cards, sets, setsByCode } from '@/lib/gameData.ts'
import { Heading } from '@/components/Heading.tsx'

export const dynamicParams = false

export function generateStaticParams (): Array<{ locale: string, code: string }> {
  return routing.locales.flatMap((locale) => sets.map((set) => ({ locale, code: set.code })))
}

interface Props { params: Promise<{ locale: string, code: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params
  const set = setsByCode.get(code)
  if (set == null) return {}

  const t = await getTranslations({ locale, namespace: 'setPage' })
  const count = cards.filter((card) => card.set === set.code).length

  return {
    title: t('metaTitle', { name: set.name, code: set.code, count }),
    description: t('metaDescription', { name: set.name }),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((other) => [other, `/${other}/set/${set.code}`])
      )
    }
  }
}

export default async function SetPage ({ params }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)

  const set = setsByCode.get(code)
  if (set == null) notFound()

  const t = await getTranslations('setPage')
  const format = await getFormatter()
  const setCards = cards.filter((card) => card.set === set.code).sort((a, b) => a.number - b.number)

  return (
    <SiteChrome>
      <header>
        <Heading level='page'>{set.name}</Heading>
        <p className='mt-1 text-meta text-ink-mid'>
          {set.code}
          {' · '}{t('cardCount', { count: setCards.length })}
          {' · '}{t('released', { date: format.dateTime(new Date(set.releaseDate), { dateStyle: 'long' }) })}
        </p>
      </header>

      {set.packs.length > 0 && (
        <section className='mt-5'>
          <Heading level='sub'>{t('packs')}</Heading>
          <ul className='mt-2 flex flex-wrap gap-2'>
            {set.packs.map((pack) => (
              <li key={pack}>
                <Link
                  href={`/pack/${set.code}/${encodeURIComponent(pack)}`}
                  className='block rounded-control border border-line-control px-3 py-1.5 text-meta text-ink-high transition-colors duration-150 hover:border-accent hover:text-accent'
                >
                  {pack}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className='mt-6'>
        <Heading level='sub'>{t('allCards')}</Heading>
        <CardGridLinks cards={setCards} />
      </section>
    </SiteChrome>
  )
}
