import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing.ts'
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
    title: { default: t('title'), template: '%s · Pullwise' },
    description: t('description'),
    icons: { icon: '/favicon.svg' }
  }
}

export const viewport: Viewport = {
  // The browser paints the chrome from this before any CSS exists, so it cannot
  // read a token. It must stay in sync with --color-bg in src/index.css.
  // eslint-disable-next-line no-restricted-syntax
  themeColor: '#0e1013',
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
    <html lang={locale} className={fontVariables}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
