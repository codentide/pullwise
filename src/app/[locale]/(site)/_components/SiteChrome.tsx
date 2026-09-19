import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'

/** Shell for the public pages: they are the front door from a search engine. */
export async function SiteChrome ({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()

  return (
    <div className='min-h-dvh'>
      <header className='border-b border-line'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5'>
          <Link href='/' className='text-body font-semibold tracking-tight text-ink-high'>
            Pullwise
          </Link>
          <Link
            href='/'
            className='ml-auto rounded-control bg-accent px-3 py-1.5 text-meta font-medium text-accent-ink transition-opacity duration-150 hover:opacity-90'
          >
            {t('nav.buildADeck')}
          </Link>
        </div>
      </header>
      <main className='mx-auto max-w-5xl px-4 py-6'>{children}</main>
      <footer className='mx-auto max-w-5xl px-4 py-8 text-label leading-relaxed text-ink-low'>
        {t('footer.disclaimer')}
      </footer>
    </div>
  )
}
