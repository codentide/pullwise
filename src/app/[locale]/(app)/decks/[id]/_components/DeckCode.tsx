'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Dialog } from '@/components/Dialog.tsx'
import { Notice } from '@/components/Notice.tsx'
import { Heading } from '@/components/Heading.tsx'
import { EnergyIcon, isEnergy } from '@/components/EnergyIcon.tsx'
import { buildDeckCode } from '@/lib/deckCode.ts'
import { DECK_SIZE, deckSize } from '@/lib/deckRules.ts'
import type { Deck } from '@/lib/types.ts'

/**
 * The button that turns a deck into the code the game scans.
 *
 * Always present rather than hidden until the deck qualifies: hiding the
 * whole feature until it is "ready" means nobody discovers it exists. The
 * dialog itself explains what is blocking generation, same as the rest of
 * this app already does for a not-yet-ready state — and generation itself
 * asks for no minimum: a deck still being built is still a real, scannable
 * thing, it just imports fewer cards.
 */
export function DeckCodeButton ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant='ghost' onClick={() => setOpen(true)} className='px-2 text-ink-mid'>
        <Icon name='getCode' size={14} />
        {t('getCode')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={t('getCode')} size='md'>
        <DeckCodeContent deck={deck} />
      </Dialog>
    </>
  )
}

function DeckCodeContent ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const names = useTranslations('energies')
  const result = useMemo(() => buildDeckCode(deck), [deck])
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Dynamically imported: the QR renderer touches a canvas, and this dialog
  // only ever opens client-side — no reason for the server bundle to carry it.
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
      // Clipboard permission denied or unavailable — the code is still on
      // screen via the QR itself, so there is nothing to recover here.
    }
  }

  // PT-01's own pattern (the pack ranking's "OPEN THIS" panel): art on one
  // side, everything to say about it on the other, in a row. Mirrored here at
  // the caller's request — the QR is the thing a phone needs to find fast, so
  // it takes the side a right-handed scan naturally lands on.
  return (
    <div className='mt-4 flex flex-wrap items-start gap-4'>
      <div className='min-w-[10rem] flex-1'>
        <Heading level='sub' as='p' className='truncate'>{deck.name}</Heading>

        <div className='mt-1 flex items-center gap-2'>
          <span className='tnum font-mono text-label text-ink-mid'>
            {t('getCodeSize', { size: deckSize(deck), total: DECK_SIZE })}
          </span>
          <div className='flex gap-1'>
            {result.energy.filter(isEnergy).map((energy) => (
              <EnergyIcon key={energy} energy={energy} size={18} label={names(energy)} />
            ))}
          </div>
        </div>

        <Button variant='quiet' onClick={copyCode} className='mt-4 justify-center py-2 text-meta'>
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          {t(copied ? 'getCodeCopied' : 'getCodeCopy')}
        </Button>

        <p className='mt-3 text-label leading-relaxed text-ink-low'>{t('getCodeHint')}</p>
      </div>

      <div className='shrink-0 rounded-surface border border-line-strong bg-raised p-3'>
        <div className='aspect-square w-[140px] overflow-hidden rounded-control bg-overlay'>
          {dataUrl != null && (
            <img
              src={dataUrl}
              alt=''
              className='h-full w-full object-contain opacity-0 transition-opacity duration-200'
              onLoad={(event) => { event.currentTarget.style.opacity = '1' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
