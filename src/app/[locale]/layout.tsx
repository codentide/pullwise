import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing.ts'
import { BASE_URL } from '@/i18n/site.ts'
import { fontVariables } from '../fonts.ts'
import { ThemeScript } from '@/components/ThemeToggle.tsx'
import '@/index.css'

export function generateStaticParams () {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata (
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  return {
    metadataBase: new URL(BASE_URL),
    title: { default: t('title'), template: '%s · Pullwise' },
    description: t('description'),
    icons: { icon: '/favicon.svg' }
  }
}

export const viewport: Viewport = {
  // The browser paints the chrome from this before any CSS exists, so it cannot
  // read a token. It must stay in sync with --color-base in src/index.css.
  // eslint-disable-next-line no-restricted-syntax
  themeColor: '#08090a',
  colorScheme: 'dark'
}

export default async function LocaleLayout ({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Required for every statically rendered page under this segment.
  setRequestLocale(locale)

  return (
    /*
      ThemeScript stamps data-theme and color-scheme on this element before
      React hydrates, which is the whole point of it — and which React then
      reports as a mismatch on every light-theme page load. The warning is
      correct and the divergence is deliberate, so it is declared here rather
      than left as a permanent error in the console.
    */
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
