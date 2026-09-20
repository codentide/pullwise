import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { SiteChrome } from './_components/SiteChrome.tsx'
import { ButtonLink } from '@/components/Button.tsx'
import { Heading } from '@/components/Heading.tsx'
import { sets } from '@/lib/gameData.ts'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return { title: { absolute: t('title') }, description: t('description') }
}

/**
 * The front door.
 *
 * It sits in the (site) group rather than the app because it is the one page a
 * search engine can actually read: the tool behind it is built from the reader's
 * own localStorage and renders empty to a crawler. That is also why the set list
 * is here — it is the link into the 3,879 static pages the sitemap promises.
 *
 * Deliberately plain. This is a stub standing in for a designed landing page,
 * not the finished article.
 */
export default async function HomePage ({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'home' })
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return (
    <SiteChrome cta={false}>
      <section className='max-w-2xl py-12'>
        <Heading level='title'>{t('headline')}</Heading>
        <p className='mt-4 text-body leading-relaxed text-ink-mid'>{t('body')}</p>
        <ButtonLink href='/decks' className='mt-6'>{nav('buildADeck')}</ButtonLink>
      </section>

      <section className='border-t border-line pt-6'>
        <Heading level='eyebrow' as='h2'>{t('setsTitle')}</Heading>
        <ul className='mt-3 flex flex-wrap gap-2'>
          {sets.map((set) => (
            <li key={set.code}>
              <Link
                href={`/set/${set.code}`}
                className='game-name inline-block rounded-control border border-line px-3 py-2 text-meta text-ink-mid transition-colors duration-150 hover:border-line-strong hover:text-ink-high'
              >
                {set.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SiteChrome>
  )
}
