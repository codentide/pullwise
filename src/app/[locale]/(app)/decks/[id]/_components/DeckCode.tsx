'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Dialog } from '@/components/Dialog.tsx'
import { Notice } from '@/components/Notice.tsx'
import { buildDeckCode } from '@/lib/deckCode.ts'
import { deckSize } from '@/lib/deckRules.ts'
import type { Deck } from '@/lib/types.ts'

/**
 * The button that turns a finished deck into the code the game scans.
 *
 * Always present rather than hidden until the deck qualifies: hiding the
 * whole feature until it is "ready" means nobody discovers it exists. The
 * dialog itself explains what is blocking generation, same as the rest of
 * this app already does for an incomplete deck or an empty one.
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
      <Dialog open={open} onOpenChange={setOpen} title={t('getCode')}>
        <DeckCodeContent deck={deck} />
      </Dialog>
    </>
  )
}

function DeckCodeContent ({ deck }: { deck: Deck }) {
  const t = useTranslations('editor')
  const result = useMemo(() => buildDeckCode(deck), [deck])
  const [dataUrl, setDataUrl] = useState<string | null>(null)

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
          {result.reason === 'wrongSize'
            ? t('getCodeErrorWrongSize', { size: deckSize(deck) })
            : t('getCodeErrorNoEnergy')}
        </Notice>
      </div>
    )
  }

  return (
    <div className='mt-4 flex flex-col items-center gap-3'>
      <div
        className='grid aspect-square w-full max-w-[220px] place-items-center rounded-control bg-overlay'
      >
        {dataUrl != null && <img src={dataUrl} alt='' width={220} height={220} />}
      </div>
      <code className='game-name break-all text-center text-label text-ink-mid'>{result.code}</code>
      <p className='text-label leading-relaxed text-ink-low'>{t('getCodeHint')}</p>
    </div>
  )
}
