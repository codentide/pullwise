import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { routing } from '@/i18n/routing.ts'
import { SiteChrome } from '../../../_components/SiteChrome.tsx'
import { CardGridLinks } from '../../../_components/CardGridLinks.tsx'
import { allPacks, cardsInPack, packMath, rarityBreakdown, setName } from '@/lib/gameData.ts'
import { Heading } from '@/components/Heading.tsx'

export const dynamicParams = false

export function generateStaticParams (): Array<{ locale: string, set: string, name: string }> {
  return routing.locales.flatMap((locale) =>
    allPacks.map((pack) => ({ locale, set: pack.set, name: encodeURIComponent(pack.pack) }))
  )
}

interface Props { params: Promise<{ locale: string, set: string, name: string }> }

const resolve = async (params: Props['params']) => {
  const { set, name } = await params
  const packName = decodeURIComponent(name)
  return allPacks.find((pack) => pack.set === set && pack.pack === packName) ?? null
}

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const pack = await resolve(params)
  if (pack == null) return {}

  const t = await getTranslations({ locale, namespace: 'packPage' })
  const count = cardsInPack(pack.set, pack.pack).length
  const path = `/pack/${pack.set}/${encodeURIComponent(pack.pack)}`

  return {
    title: t('metaTitle', { pack: pack.pack, set: setName(pack.set) }),
    description: t('metaDescription', { count, pack: pack.pack, set: setName(pack.set) }),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((other) => [other, `/${other}${path}`]))
    }
  }
}

export default async function PackPage ({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const pack = await resolve(params)
  if (pack == null) notFound()

  const t = await getTranslations('packPage')
  const cards = cardsInPack(pack.set, pack.pack)
  const breakdown = rarityBreakdown(pack.set, pack.pack)

  return (
    <SiteChrome>
      <header>
        <Heading level='page'>
          {t('title', { pack: pack.pack })}
        </Heading>
        <p className='mt-1 text-meta text-ink-mid'>
          <Link href={`/set/${pack.set}`} className='text-accent hover:underline'>
            {setName(pack.set)}
          </Link>
          {' · '}{t('cardCount', { count: cards.length })}
        </p>
      </header>

      <section className='mt-5'>
        <Heading level='sub'>{t('contents')}</Heading>
        <ul className='mt-2 flex flex-wrap gap-2'>
          {breakdown.map(([rarity, count]) => (
            <li
              key={rarity}
              className='tnum rounded-control border border-line bg-raised px-2.5 py-1 text-meta text-ink-mid'
            >
              <span className='font-medium text-ink-high'>{rarity}</span> · {count}
            </li>
          ))}
        </ul>
        {packMath.usesEstimatedRates(pack.set) && (
          <p className='mt-2 text-label text-warn'>{t('estimatedNote')}</p>
        )}
      </section>

      <section className='mt-6'>
        <Heading level='sub'>{t('allCards')}</Heading>
        <CardGridLinks cards={cards} />
      </section>
    </SiteChrome>
  )
}
