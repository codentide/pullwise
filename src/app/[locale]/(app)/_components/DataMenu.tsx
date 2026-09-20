import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { actions } from '@/lib/store.ts'
import { useStore } from '@/hooks/useStore.ts'
import { Button } from '@/components/Button.tsx'
import { HiddenFileInput } from '@/components/Field.tsx'

/**
 * Export and import the whole state. Not a convenience: localStorage clears
 * itself (private mode, clearing site data, a different browser) and there is no
 * server backing any of this up.
 */
export function DataMenu () {
  const t = useTranslations('nav')
  const state = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState<string | null>(null)

  const known = Object.keys(state.knowledge).length

  const download = (): void => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `pullwise-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File): Promise<void> => {
    const ok = actions.importJson(await file.text())
    setNote(ok ? t('importRestored') : t('importFailed'))
    setTimeout(() => setNote(null), 4000)
  }

  return (
    <div className='flex items-center gap-2'>
      {note != null && <span className='text-label text-ink-mid'>{note}</span>}
      <Button variant='quiet' onClick={download} disabled={state.decks.length === 0 && known === 0}>
        {t('export')}
      </Button>
      <Button variant='quiet' onClick={() => fileInput.current?.click()}>
        {t('import')}
      </Button>
      <HiddenFileInput
        inputRef={fileInput}
        accept='application/json'
        onFile={(file) => { upload(file).catch(() => setNote(t('importFailed'))) }}
      />
    </div>
  )
}
