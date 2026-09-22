import { AppHeader } from '@/components/AppHeader.tsx'
import { AppFooter } from '@/components/AppFooter.tsx'

/** Shell for the public pages, wearing the same header as the tool since a person landing on a card page from search is in the same product as one building a deck; the header's old "build a deck" button is gone since the Decks tab goes to the same place and two accents on one screen is one too many. */
export async function SiteChrome ({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-dvh flex-col'>
      <AppHeader tools={false} />
      <main className='mx-auto w-full max-w-[1180px] flex-1 px-4 py-6'>{children}</main>
      <AppFooter />
    </div>
  )
}
