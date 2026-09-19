'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import { Button } from './Button.tsx'
import { Heading } from './Heading.tsx'

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
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className='fixed inset-0 z-40 bg-base/70 backdrop-blur-sm' />
        <RadixDialog.Content className='fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-surface border border-line-strong bg-raised p-4'>
          <RadixDialog.Title asChild>
            <Heading level='section'>{title}</Heading>
          </RadixDialog.Title>
          {body != null && (
            <RadixDialog.Description className='mt-2 text-meta leading-relaxed text-ink-mid'>
              {body}
            </RadixDialog.Description>
          )}
          <div className='mt-4 flex justify-end gap-2'>
            <RadixDialog.Close asChild>
              <Button variant='quiet' className='px-3 py-1.5 text-meta'>{cancelLabel}</Button>
            </RadixDialog.Close>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              onClick={() => { onConfirm(); onOpenChange(false) }}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
