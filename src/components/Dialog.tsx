'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import * as RadixDialog from '@radix-ui/react-dialog'
import { Button } from './Button.tsx'
import { Heading } from './Heading.tsx'
import { Icon } from './Icon.tsx'

/** The shared shell: overlay, positioned box, title. `ConfirmDialog` below is one shape built on it; anything that isn't a yes/no prompt — the deck-code QR, say — takes this one directly instead of a shape that doesn't fit it. */
/** `sm` fits a short prompt; `md` is for content with its own internal layout (a two-column row, say) that would otherwise fight the narrower box. */
const WIDTH = {
  sm: 'w-[min(24rem,calc(100vw-2rem))]',
  md: 'w-[min(32rem,calc(100vw-2rem))]'
} as const

export function Dialog ({
  open,
  onOpenChange,
  title,
  size = 'sm',
  /** A fact about the content, not another action — a count, a set of icons. */
  headerExtra,
  children
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  size?: keyof typeof WIDTH
  headerExtra?: ReactNode
  children: ReactNode
}) {
  const t = useTranslations('decks')
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className='fixed inset-0 z-40 bg-base/70 backdrop-blur-sm' />
        <RadixDialog.Content className={`fixed left-1/2 top-1/2 z-50 ${WIDTH[size]} -translate-x-1/2 -translate-y-1/2 rounded-surface border border-line-strong bg-raised p-4`}>
          <div className='flex items-start justify-between gap-3'>
            <RadixDialog.Title asChild>
              <Heading level='section'>{title}</Heading>
            </RadixDialog.Title>
            <div className='flex shrink-0 items-center gap-2'>
              {headerExtra}
              <RadixDialog.Close asChild>
                <Button variant='ghost' aria-label={t('close')} className='p-1'>
                  <Icon name='close' size={14} />
                </Button>
              </RadixDialog.Close>
            </div>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

/** Replaces window.confirm, which could not be styled and looked like a browser error rather than part of the product. */
export function ConfirmDialog ({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      {body != null && (
        <RadixDialog.Description className='mt-2 text-meta leading-relaxed text-ink-mid'>
          {body}
        </RadixDialog.Description>
      )}
      <div className='mt-4 flex justify-end gap-2'>
        <RadixDialog.Close asChild>
          <Button variant='quiet' className='px-3 py-2 text-meta'>{cancelLabel}</Button>
        </RadixDialog.Close>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={() => { onConfirm(); onOpenChange(false) }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
