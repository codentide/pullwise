import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PackAdvisor } from './_components/PackAdvisor.tsx'

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata ({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { title: (await getTranslations({ locale, namespace: 'advisor' }))('title') }
}

export default async function PacksPage ({ params }: Props) {
  setRequestLocale((await params).locale)
  return <PackAdvisor />
}
