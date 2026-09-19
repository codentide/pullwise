'use client'

import * as RadixCheckbox from '@radix-ui/react-checkbox'
import type { ComponentProps } from 'react'
import { Icon } from './Icon.tsx'

const FIELD =
  'rounded-control border border-line-control bg-raised px-2 py-1.5 text-meta text-ink-high placeholder:text-ink-low transition-colors duration-150 focus:border-accent'

export function TextInput ({ className = '', ...props }: ComponentProps<'input'>) {
  return <input {...props} className={`${FIELD} ${className}`} />
}

export function Textarea ({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={`${FIELD} resize-y ${className}`} />
}

export function Checkbox ({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className='flex cursor-pointer items-center gap-1.5 text-meta text-ink-mid'>
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className='grid size-3.5 place-items-center rounded-chip border border-line-control transition-colors duration-150 data-[state=checked]:border-accent data-[state=checked]:bg-accent'
      >
        <RadixCheckbox.Indicator className='text-accent-ink'>
          <Icon name='check' size={10} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label}
    </label>
  )
}

/**
 * The invisible file input behind an "Import" button. It exists as a component
 * because every app grows one, and each hand-rolled copy forgets to reset
 * `value` — which silently breaks re-picking the same file twice.
 */
export function HiddenFileInput ({
  inputRef,
  accept,
  onFile
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  accept: string
  onFile: (file: File) => void
}) {
  return (
    <input
      ref={inputRef}
      type='file'
      accept={accept}
      className='hidden'
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file != null) onFile(file)
        event.target.value = ''
      }}
    />
  )
}
