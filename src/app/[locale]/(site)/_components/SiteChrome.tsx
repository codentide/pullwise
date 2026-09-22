import { AppHeader } from '@/components/AppHeader.tsx'
import { AppFooter } from '@/components/AppFooter.tsx'

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
  return (
    <div className='flex min-h-dvh flex-col'>
      <AppHeader tools={false} />
      <main className='mx-auto w-full max-w-[1180px] flex-1 px-4 py-6'>{children}</main>
      <AppFooter />
    </div>
  )
}
