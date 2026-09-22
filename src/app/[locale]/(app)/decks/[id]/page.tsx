import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DeckScreen } from './_components/DeckScreen.tsx'

interface Props { params: Promise<{ locale: string, id: string }> }

/** The deck's own name lives in the reader's browser, so the server can't put it in the title — a generic one is the honest answer, better than inventing one from the id. */
export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: (await getTranslations({ locale, namespace: 'editor' }))('pageTitle') }
}

export default async function DeckPage ({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  return <DeckScreen id={id} />
}
