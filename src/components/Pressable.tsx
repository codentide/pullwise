import type { ComponentProps } from 'react'

/** A clickable area with a button's behaviour but none of its look (for cards, tiles, thumbnails); `appearance-none` is required because Tailwind's preflight keeps `appearance: button` for iOS Safari's radius styling, but on macOS that paints the OS's own smaller pushable capsule underneath, showing dark margins around a full-width hover background. */
export function Pressable ({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`appearance-none cursor-pointer text-left disabled:cursor-default disabled:opacity-40 ${className}`}
    />
  )
}
