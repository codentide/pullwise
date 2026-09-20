import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CardBrowser } from './_components/CardBrowser.tsx'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: (await getTranslations({ locale, namespace: 'browser' }))('title') }
}

export default async function CardsPage ({ params }: Props) {
  setRequestLocale((await params).locale)
  return <CardBrowser />
}
