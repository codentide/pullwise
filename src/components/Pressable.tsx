import type { ComponentProps } from 'react'

/**
 * A clickable area with no button styling of its own.
 *
 * Most of the interactive elements in this app are not buttons in the design
 * sense — they are a card, a deck tile, a thumbnail. Making them `Button` would
 * force an appearance they should not have; leaving them as raw `<button>`
 * scatters focus and cursor handling across the codebase. This carries the
 * behaviour and none of the look.
 *
 * `appearance-none` matters here specifically: Tailwind's preflight keeps
 * `appearance: button` on purpose (it is what lets iOS Safari style a
 * button's radius at all), but on macOS that leaves the OS's own pushable
 * capsule painted underneath ours — visibly smaller than the element's own
 * box, so a caller's full-width hover background shows dark margins around
 * it instead of filling the row.
 */
export function Pressable ({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`appearance-none cursor-pointer text-left disabled:cursor-default disabled:opacity-40 ${className}`}
    />
  )
}
