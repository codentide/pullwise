import { getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/AppHeader.tsx'

/**
 * Shell for the public pages: they are the front door from a search engine.
 *
 * It wears the same header as the tool. A person arriving on a card page from a
 * search is in the same product as a person building a deck, and giving them a
 * header with no navigation in it left them with one link out. The "build a
 * deck" button it used to carry is gone with it: the Decks tab goes to the same
 * place, and two accents on one screen is one too many.
 */
export async function SiteChrome ({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()

  return (
    <div className='min-h-dvh'>
      <AppHeader />
      <main className='mx-auto max-w-[1180px] px-4 py-6'>{children}</main>
      <footer className='mx-auto max-w-[1180px] px-4 py-6 text-label leading-relaxed text-ink-low'>
        {t('footer.disclaimer')}
      </footer>
    </div>
  )
}
