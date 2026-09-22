'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Dialog } from '@/components/Dialog.tsx'
import { Notice } from '@/components/Notice.tsx'
import { EnergyIcon, isEnergy } from '@/components/EnergyIcon.tsx'
import { buildDeckCode, type DeckCodeResult } from '@/lib/deckCode.ts'
import { DECK_SIZE, deckSize } from '@/lib/deckRules.ts'
import type { Deck } from '@/lib/types.ts'

/** Turns a deck into the code the game scans; open state is controlled from outside (the `ExportButton` popover picks which of the two export dialogs to show) rather than owning its own trigger; generation asks for no minimum, since a deck still being built is still a real, scannable thing. */
export function DeckCodeDialog ({ deck, open, onOpenChange }: {
  deck: Deck
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('editor')
  const names = useTranslations('energies')
  const result = useMemo(() => buildDeckCode(deck), [deck])

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('getCodeTitle')}
      size='md'
      headerExtra={result.ok
        ? (
          <div className='flex shrink-0 items-center gap-2 rounded-chip bg-overlay px-2 py-1'>
            <span className='tnum font-mono text-label text-ink-mid'>
              {t('getCodeSize', { size: deckSize(deck), total: DECK_SIZE })}
            </span>
            <div className='flex gap-1'>
              {result.energy.filter(isEnergy).map((energy) => (
                <EnergyIcon key={energy} energy={energy} size={16} label={names(energy)} />
              ))}
            </div>
          </div>
          )
        : undefined}
    >
      <DeckCodeContent result={result} />
    </Dialog>
  )
}

function DeckCodeContent ({ result }: { result: DeckCodeResult }) {
  const t = useTranslations('editor')
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Dynamically imported: the QR renderer touches a canvas, and this dialog only ever opens client-side — no reason for the server bundle to carry it.
  useEffect(() => {
    setDataUrl(null)
    if (!result.ok) return
    let cancelled = false
    import('ptcgp-deckcode/qr').then(({ deckCodeToDataURL }) => deckCodeToDataURL(result.code))
      .then((url) => { if (!cancelled) setDataUrl(url) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [result])

  if (!result.ok) {
    return (
      <div className='mt-4'>
        <Notice tone='warning'>
          {t(result.reason === 'empty' ? 'getCodeErrorEmpty' : 'getCodeErrorNoEnergy')}
        </Notice>
      </div>
    )
  }

  const copyCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(result.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied or unavailable — the code is still on screen via the QR itself, so there is nothing to recover here.
    }
  }

  // PT-01's own pattern (the pack ranking's "OPEN THIS" panel), mirrored here at the caller's request — the QR takes the side a right-handed scan naturally lands on.
  return (
    <div className='mt-4 flex flex-wrap items-stretch gap-4'>
      <div className='flex min-w-[10rem] flex-1 flex-col justify-between'>
        <p className='text-label leading-relaxed text-ink-low'>{t('getCodeHint')}</p>

        <div className='mt-3 flex items-center gap-2 rounded-control bg-overlay px-3 py-2'>
          <code
            title={result.code}
            className='min-w-0 flex-1 truncate font-mono text-label text-ink-mid'
          >
            {result.code}
          </code>
          <Button
            variant='ghost'
            onClick={copyCode}
            aria-label={t(copied ? 'getCodeCopied' : 'getCodeCopy')}
            className='shrink-0 p-2'
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
          </Button>
        </div>
      </div>

      {dataUrl != null && (
        <img
          src={dataUrl}
          alt=''
          width={150}
          height={150}
          className='shrink-0 rounded-control opacity-0 transition-opacity duration-200'
          onLoad={(event) => { event.currentTarget.style.opacity = '1' }}
        />
      )}
    </div>
  )
}
