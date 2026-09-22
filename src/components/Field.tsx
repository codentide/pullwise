'use client'

import * as RadixCheckbox from '@radix-ui/react-checkbox'
import type { ComponentProps, ComponentPropsWithRef } from 'react'
import { Icon } from './Icon.tsx'

const SHELL =
  'rounded-control border border-line-control bg-raised text-ink-high placeholder:text-ink-low transition-colors duration-150 focus:border-accent'

/** Size and padding are a variant, not a call-site override — Tailwind resolves two utilities for the same property by stylesheet order, not class-attribute order, so a base `text-meta` used to silently beat a caller's `text-title`. */
const TEXT = {
  field: 'px-2 py-2 text-meta',
  /** A field standing in for the page's title: it should read as the heading. */
  title: 'px-2 py-1 font-display text-title font-extrabold tracking-tight'
} as const

export function TextInput ({
  variant = 'field',
  className = '',
  ...props
}: ComponentPropsWithRef<'input'> & { variant?: keyof typeof TEXT }) {
  return <input {...props} className={`${SHELL} ${TEXT[variant]} ${className}`} />
}

/** A text field with a leading icon, laid out not nudged — the icon used to be absolutely positioned with the text pushed clear by padding, which touched at one size and was off-scale at every other; a flex row makes the gap real, with the focus ring on the wrapper so the border draws around the whole control. */
export function SearchField ({
  pad = 'md',
  className = '',
  ...props
}: ComponentPropsWithRef<'input'> & { pad?: 'sm' | 'md' }) {
  return (
    <div
      className={`flex items-center rounded-control border border-line-control bg-raised transition-colors duration-150 focus-within:border-accent focus-within:shadow-[inset_0_0_0_1px_var(--color-accent)] ${
        pad === 'sm' ? 'gap-2 px-2 py-2' : 'gap-3 px-3 py-3'
      } ${className}`}
    >
      <Icon name='search' size={pad === 'sm' ? 14 : 16} className='shrink-0 text-ink-low' />
      <input
        {...props}
        className={`min-w-0 flex-1 border-none bg-transparent text-ink-high placeholder:text-ink-low focus:border-none focus:shadow-none focus:outline-none ${
          pad === 'sm' ? 'text-meta' : 'text-body'
        }`}
      />
    </div>
  )
}

export function Textarea ({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={`${SHELL} ${TEXT.field} resize-y ${className}`} />
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
    <label className='flex cursor-pointer items-center gap-2 text-meta text-ink-mid'>
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

/** The invisible file input behind an "Import" button, as a component because every hand-rolled copy forgets to reset `value` — which silently breaks re-picking the same file twice. */
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
