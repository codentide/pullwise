import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { Wordmark } from '@/components/Wordmark.tsx'
import { ButtonLink } from '@/components/Button.tsx'

/**
 * Shell for the public pages: they are the front door from a search engine.
 *
 * `cta` is off on the home page only. One accent per screen is a brand rule, and
 * there the hero already carries the same button — two of them made it two.
 */
export async function SiteChrome (
  { children, cta = true }: { children: React.ReactNode, cta?: boolean }
) {
  const t = await getTranslations()

  return (
    <div className='min-h-dvh'>
      <header className='border-b border-line'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3'>
          <Link href='/' aria-label='Pullwise'>
            <Wordmark />
          </Link>
          {cta && <ButtonLink href='/decks' className='ml-auto'>{t('nav.buildADeck')}</ButtonLink>}
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-4 py-6'>{children}</main>
      <footer className='mx-auto max-w-5xl px-4 py-6 text-label leading-relaxed text-ink-low'>
        {t('footer.disclaimer')}
      </footer>
    </div>
  )
}
