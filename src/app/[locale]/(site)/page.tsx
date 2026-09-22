import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { SiteChrome } from './_components/SiteChrome.tsx'
import { ButtonLink } from '@/components/Button.tsx'
import { Heading } from '@/components/Heading.tsx'
import { sets } from '@/lib/gameData.ts'
import { localeAlternates } from '@/i18n/site.ts'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: { absolute: t('title') },
    description: t('description'),
    // '' as canonical would be falsy and Next silently drops it (resolveCanonicalUrl returns null for any falsy value) — '/' is the shortest truthy path that still resolves to the site root.
    alternates: { canonical: '/', languages: localeAlternates('') }
  }
}

/** The front door: sits in (site), not the app, because it's the one page a crawler can actually read (the tool renders empty from localStorage) — hence the set list too, linking into the 3,879 static pages the sitemap promises. Deliberately plain: a stub standing in for a designed landing page, not the finished article. */
export default async function HomePage ({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'home' })
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return (
    <SiteChrome>
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
