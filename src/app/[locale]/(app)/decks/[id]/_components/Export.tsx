'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Pressable } from '@/components/Pressable.tsx'
import { DeckCodeDialog } from './DeckCode.tsx'
import { ExportListDialog } from './ExportList.tsx'
import type { Deck } from '@/lib/types.ts'

type ExportKind = 'qr' | 'list'

/** One export action, not two competing for the same row: a small popover menu picks the shape (QR or plain-text list); not a Radix primitive, since the brand system reserves Radix for Select/Dialog/Checkbox and a two-item menu this simple doesn't need a fourth. */
export function ExportButton ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<ExportKind | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const pick = (kind: ExportKind): void => {
    setDialog(kind)
    setMenuOpen(false)
  }

  return (
    <div ref={rootRef} className='relative'>
      <Button
        variant='ghost'
        onClick={() => setMenuOpen((current) => !current)}
        aria-expanded={menuOpen}
        className='px-2 text-ink-mid'
      >
        <Icon name='export' size={14} />
        {t('export')}
      </Button>

      {menuOpen && (
        <div
          role='menu'
          className='absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-control border border-line-strong bg-raised'
        >
          <Pressable
            role='menuitem'
            onClick={() => pick('qr')}
            className='flex w-full items-center gap-2 px-3 py-2 text-label text-ink-mid transition-colors duration-150 hover:bg-overlay hover:text-ink-high'
          >
            <Icon name='getCode' size={14} />
            {t('getCode')}
          </Pressable>
          <Pressable
            role='menuitem'
            onClick={() => pick('list')}
            className='flex w-full items-center gap-2 px-3 py-2 text-label text-ink-mid transition-colors duration-150 hover:bg-overlay hover:text-ink-high'
          >
            <Icon name='list' size={14} />
            {t('exportList')}
          </Pressable>
        </div>
      )}

      <DeckCodeDialog deck={deck} open={dialog === 'qr'} onOpenChange={(open) => setDialog(open ? 'qr' : null)} />
      <ExportListDialog deck={deck} open={dialog === 'list'} onOpenChange={(open) => setDialog(open ? 'list' : null)} />
    </div>
  )
}
