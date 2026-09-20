import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DeckScreen } from './_components/DeckScreen.tsx'

interface Props { params: Promise<{ locale: string, id: string }> }

/**
 * The deck's own name lives in the reader's browser, so the server cannot put it
 * in the title. A generic one is the honest answer; inventing a title from the
 * id would be worse than a plain word.
 */
export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: (await getTranslations({ locale, namespace: 'editor' }))('pageTitle') }
}

export default async function DeckPage ({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  return <DeckScreen id={id} />
}
