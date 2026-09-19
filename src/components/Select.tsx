'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { Icon } from './Icon.tsx'

/**
 * Select built on Radix rather than the native element.
 *
 * The trade-off is deliberate and worth stating: a native `<select>` opens the
 * OS picker on mobile, which is better than anything custom. It is given up for
 * full visual control and for the ability to put an icon in an option — which
 * the native element cannot do, and which this app needs for energies.
 */
export interface Option {
  value: string
  label: string
}

export function Select ({
  value,
  onChange,
  options,
  placeholder,
  'aria-label': ariaLabel,
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  'aria-label'?: string
  className?: string
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 rounded-control border border-line-control bg-raised px-2 py-1.5 text-meta text-ink-high transition-colors duration-150 hover:border-ink-low data-[state=open]:border-accent ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className='text-ink-low'>
          <Icon name='chevron' size={12} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position='popper'
          sideOffset={4}
          className='z-50 max-h-80 overflow-hidden rounded-surface border border-line-strong bg-overlay'
        >
          <RadixSelect.Viewport className='p-1'>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className='flex cursor-pointer items-center gap-2 rounded-chip px-2 py-1.5 text-meta text-ink-mid outline-none data-[highlighted]:bg-overlay data-[highlighted]:text-ink-high data-[state=checked]:text-accent'
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
