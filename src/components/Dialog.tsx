'use client'

import type { ReactNode } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { Button } from './Button.tsx'
import { Heading } from './Heading.tsx'

/**
 * The shared shell: overlay, positioned box, title. `ConfirmDialog` below is
 * one shape built on it; anything that isn't a yes/no prompt — the deck-code
 * QR, say — takes this one directly instead of a shape that doesn't fit it.
 */
export function Dialog ({
  open,
  onOpenChange,
  title,
  children
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className='fixed inset-0 z-40 bg-base/70 backdrop-blur-sm' />
        <RadixDialog.Content className='fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-surface border border-line-strong bg-raised p-4'>
          <RadixDialog.Title asChild>
            <Heading level='section'>{title}</Heading>
          </RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

/**
 * Replaces window.confirm, which could not be styled and looked like a browser
 * error rather than part of the product.
 */
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
