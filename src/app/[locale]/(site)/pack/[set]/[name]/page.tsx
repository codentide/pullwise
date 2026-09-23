import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { routing } from '@/i18n/routing.ts'
import { SiteChrome } from '../../../_components/SiteChrome.tsx'
import { CardGridLinks } from '../../../_components/CardGridLinks.tsx'
import { allPacks, cardsInPack, packMath, rarityBreakdown, setName, setsByCode } from '@/lib/gameData.ts'
import { Heading } from '@/components/Heading.tsx'
import { PackImage } from '@/components/PackImage.tsx'
import { localeAlternates } from '@/i18n/site.ts'

export const dynamicParams = true

export function generateStaticParams (): Array<{ locale: string, set: string, name: string }> {
  // The raw name, not `encodeURIComponent(pack.pack)`: Next matches this list against the already-decoded route segment, so encoding it registered "Pulsing%20Aura" as the valid param while the real decoded request never matched — invisible until a pack name with a space was requested (single-word names encode to themselves).
  return routing.locales.flatMap((locale) =>
    allPacks.map((pack) => ({ locale, set: pack.set, name: pack.pack }))
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
      canonical: path,
      languages: localeAlternates(path)
    }
  }
}

export default async function PackPage ({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const pack = await resolve(params)
  if (pack == null) notFound()

  const t = await getTranslations('packPage')
  const tSet = await getTranslations('setPage')
  const format = await getFormatter()
  const cards = cardsInPack(pack.set, pack.pack)
  const breakdown = rarityBreakdown(pack.set, pack.pack)
  const set = setsByCode.get(pack.set)
  const siblingPacks = set?.packs.filter((name) => name !== pack.pack) ?? []

  return (
    <SiteChrome>
      <header className='flex gap-6'>
        <PackImage
          set={pack.set}
          pack={pack.pack}
          className='w-24 shrink-0 self-start sm:w-32'
        />
        <div>
          <Heading level='page'>
            {t('title', { pack: pack.pack })}
          </Heading>
          <p className='mt-1 text-meta text-ink-mid'>
            <Link href={`/set/${pack.set}`} className='text-accent hover:underline'>
              {setName(pack.set)}
            </Link>
            {' · '}{t('cardCount', { count: cards.length })}
            {set != null && ` · ${tSet('released', { date: format.dateTime(new Date(set.releaseDate), { dateStyle: 'long' }) })}`}
          </p>
          {siblingPacks.length > 0 && (
            <ul className='mt-3 flex flex-wrap gap-2'>
              {siblingPacks.map((siblingPack) => (
                <li key={siblingPack}>
                  <Link
                    href={`/pack/${pack.set}/${encodeURIComponent(siblingPack)}`}
                    className='flex items-center gap-2 rounded-control border border-line-control py-1 pl-1 pr-2 text-label text-ink-mid transition-colors duration-150 hover:border-accent hover:text-ink-high'
                  >
                    <PackImage set={pack.set} pack={siblingPack} radius='control' className='w-6' />
                    {siblingPack}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <section className='mt-6'>
        <Heading level='sub' as='h2'>{t('contents')}</Heading>
        <ul className='mt-2 flex flex-wrap gap-2'>
          {breakdown.map(([rarity, count]) => (
            <li
              key={rarity}
              className='tnum rounded-control border border-line bg-raised px-3 py-1 text-meta text-ink-mid'
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
        <Heading level='sub' as='h2'>{t('allCards')}</Heading>
        <CardGridLinks cards={cards} />
      </section>

      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('title', { pack: pack.pack }),
            isPartOf: { '@type': 'CollectionPage', name: setName(pack.set) },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: cards.length
            }
          }).replace(/</g, '\\u003c')
        }}
      />
    </SiteChrome>
  )
}
