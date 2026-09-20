'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Link, usePathname } from '@/i18n/navigation.ts'
import { DataMenu } from './DataMenu.tsx'
import { ThemeToggle } from '@/components/ThemeToggle.tsx'
import { Wordmark } from '@/components/Wordmark.tsx'
import { meta } from '@/lib/gameData.ts'

const TABS = [
  { id: 'decks', href: '/decks', icon: 'deck' },
  { id: 'packs', href: '/packs', icon: 'pack' },
  { id: 'cards', href: '/cards', icon: 'cards' }
] as const

/**
 * The application header.
 *
 * The three views are routes rather than tab state. That is what gives the back
 * button something to go back to, makes a deck linkable, and lets each view
 * carry its own title — none of which a `useState` tab can do.
 *
 * `usePathname` comes from the i18n navigation, so what it returns has the
 * locale prefix already stripped and compares against the plain hrefs.
 */
export function AppHeader () {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <header className='sticky top-0 z-20 border-b border-line bg-base/85 backdrop-blur'>
      <div className='mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3'>
        <Link href='/decks' aria-label='Pullwise'>
          <Wordmark />
        </Link>

        <nav className='flex items-center gap-1'>
          {TABS.map(({ id, href, icon }) => {
            const current = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={id}
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-control px-3 py-2 text-meta transition-colors duration-150 ${
                  current
                    ? 'bg-accent-wash text-accent'
                    : 'text-ink-mid hover:bg-overlay hover:text-ink-high'
                }`}
              >
                <Icon name={icon} size={15} />
                {t(id)}
              </Link>
            )
          })}
        </nav>

        <div className='ml-auto flex items-center gap-3'>
          <span className='hidden text-label text-ink-low sm:inline'>
            {t('catalogue', { count: meta.cardCount, set: meta.latestSet })}
          </span>
          <ThemeToggle label={t('theme')} />
          <DataMenu />
        </div>
      </div>
    </header>
  )
}
