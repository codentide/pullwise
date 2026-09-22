import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation.ts'
import { DataMenu } from './DataMenu.tsx'
import { ThemeToggle } from '@/components/ThemeToggle.tsx'
import { Wordmark } from '@/components/Wordmark.tsx'
import { NavTabs } from '@/components/NavTabs.tsx'
import { meta } from '@/lib/meta.ts'

export async function AppHeader ({ tools = true }: { tools?: boolean }) {
  const t = await getTranslations('nav')

  return (
    <header className='sticky top-0 z-20 border-b border-line bg-base/85 backdrop-blur'>
      <div className='mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3'>
        <Link href='/decks' aria-label='Pullwise'>
          <Wordmark />
        </Link>

        <NavTabs />

        <div className='ml-auto flex items-center gap-3'>
          <span className='hidden text-label text-ink-low sm:inline'>
            {t('catalogue', { count: meta.cardCount, set: meta.latestSet })}
          </span>
          <ThemeToggle label={t('theme')} />
          {tools && <DataMenu />}
        </div>
      </div>
    </header>
  )
}
