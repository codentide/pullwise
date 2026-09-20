import type { Metadata } from 'next'
import { AppHeader } from './_components/AppHeader.tsx'

/**
 * The tool's shell.
 *
 * Nothing under here is indexable, and that is not a compromise: every page is
 * built from the reader's own localStorage, so a crawler sees an empty frame and
 * a deck URL resolves only on the device that made it. The indexable half of the
 * site is the (site) group, which is static and knows nothing about the user.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function AppLayout ({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-dvh'>
      <AppHeader />
      <main className='mx-auto max-w-[1180px] px-4 py-6'>{children}</main>
    </div>
  )
}
