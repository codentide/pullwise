import { setRequestLocale } from 'next-intl/server'
import { App } from './_components/App.tsx'

export default async function Page ({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <App />
}
