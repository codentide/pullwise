import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DeckList } from './_components/DeckList.tsx'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: (await getTranslations({ locale, namespace: 'decks' }))('title') }
}

export default async function DecksPage ({ params }: Props) {
  setRequestLocale((await params).locale)
  return <DeckList />
}
