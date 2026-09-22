'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Dialog } from '@/components/Dialog.tsx'
import { Notice } from '@/components/Notice.tsx'
import { toDecklist } from '@/lib/decklist.ts'
import { deckSize } from '@/lib/deckRules.ts'
import type { Deck } from '@/lib/types.ts'

/** The inverse of pasting a list: turns the deck back into the plain-text shape `parseDecklist` reads (the QR code is for the game, this is for Limitless and similar); its open state is controlled from outside — see `DeckCodeDialog`. */
export function ExportListDialog ({ deck, open, onOpenChange }: {
  deck: Deck
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('editor')

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t('exportListTitle')} size='md'>
      <ExportListContent deck={deck} />
    </Dialog>
  )
}

function ExportListContent ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const [copied, setCopied] = useState(false)

  if (deckSize(deck) === 0) {
    return (
      <div className='mt-4'>
        <Notice tone='warning'>{t('exportListErrorEmpty')}</Notice>
      </div>
    )
  }

  const text = toDecklist(deck)

  const copyText = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied or unavailable — the text is still on screen to select by hand.
    }
  }

  return (
    <div className='mt-4 flex flex-col gap-3'>
      <p className='text-label leading-relaxed text-ink-low'>{t('exportListHint')}</p>
      <div className='relative'>
        <pre className='max-h-64 overflow-y-auto whitespace-pre-wrap rounded-control bg-overlay p-3 pr-12 font-mono text-label text-ink-mid'>
          {text}
        </pre>
        <Button
          variant='ghost'
          onClick={copyText}
          aria-label={t(copied ? 'exportListCopied' : 'exportListCopy')}
          className='absolute right-1 top-1 p-2'
        >
          <Icon name={copied ? 'check' : 'copy'} size={14} />
        </Button>
      </div>
    </div>
  )
}
