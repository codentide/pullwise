import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { AppHeader } from '@/components/AppHeader.tsx'
import { AppFooter } from '@/components/AppFooter.tsx'

/** The tool's shell: nothing under here is indexable, and that's not a compromise — every page is built from the reader's own localStorage, so a crawler sees an empty frame and a deck URL resolves only on the device that made it. */
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default async function AppLayout ({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Required for every statically rendered page under this segment — without it, AppFooter's getTranslations falls back to reading request headers, forcing the whole route to render dynamically.
  setRequestLocale(locale)

  return (
    <div className='flex min-h-dvh flex-col'>
      <AppHeader />
      <main className='mx-auto w-full max-w-[1180px] flex-1 px-4 py-6'>{children}</main>
      <AppFooter />
    </div>
  )
}
