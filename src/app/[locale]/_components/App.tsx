'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/Icon.tsx'
import { DeckList } from './DeckList.tsx'
import { DeckEditor } from './DeckEditor.tsx'
import { PackAdvisor } from './PackAdvisor.tsx'
import { CardBrowser } from './CardBrowser.tsx'
import { DataMenu } from './DataMenu.tsx'
import { ThemeToggle } from '@/components/ThemeToggle.tsx'
import { useStore } from './useStore.ts'
import { meta } from '@/lib/gameData.ts'
import { Pressable } from '@/components/Pressable.tsx'
import { Wordmark } from '@/components/Wordmark.tsx'

type Tab = 'decks' | 'packs' | 'cards'

const TABS: Array<{ id: Tab, icon: 'deck' | 'pack' | 'cards' }> = [
  { id: 'decks', icon: 'deck' },
  { id: 'packs', icon: 'pack' },
  { id: 'cards', icon: 'cards' }
]

export function App () {
  const t = useTranslations('nav')
  const state = useStore()
  const [tab, setTab] = useState<Tab>('decks')
  const [openDeckId, setOpenDeckId] = useState<string | null>(null)

  const openDeck = state.decks.find((deck) => deck.id === openDeckId) ?? null

  const go = (next: Tab): void => {
    setTab(next)
    if (next !== 'decks') setOpenDeckId(null)
  }

  return (
    <div className='min-h-dvh'>
      <header className='sticky top-0 z-20 border-b border-line bg-base/85 backdrop-blur'>
        <div className='mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3'>
          <Pressable onClick={() => go('decks')} aria-label='Pullwise'>
            <Wordmark />
          </Pressable>

          <nav className='flex items-center gap-1'>
            {TABS.map(({ id, icon }) => (
              <Pressable
                key={id}
                onClick={() => go(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-control px-3 py-2 text-meta transition-colors duration-150 ${
                  tab === id
                    ? 'bg-accent-wash text-accent'
                    : 'text-ink-mid hover:bg-overlay hover:text-ink-high'
                }`}
              >
                <Icon name={icon} size={15} />
                {t(id)}
              </Pressable>
            ))}
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

      <main className='mx-auto max-w-[1180px] px-4 py-6'>
        {tab === 'decks' && (
          openDeck != null
            ? <DeckEditor deck={openDeck} onBack={() => setOpenDeckId(null)} />
            : <DeckList onOpen={setOpenDeckId} />
        )}
        {tab === 'packs' && <PackAdvisor />}
        {tab === 'cards' && <CardBrowser />}
      </main>
    </div>
  )
}
