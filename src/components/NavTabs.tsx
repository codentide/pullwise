'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { Link, usePathname } from '@/i18n/navigation.ts'

const TABS = [
  { id: 'decks', href: '/decks', icon: 'deck' },
  { id: 'packs', href: '/packs', icon: 'pack' },
  { id: 'cards', href: '/cards', icon: 'cards' }
] as const

export function NavTabs () {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
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
  )
}
