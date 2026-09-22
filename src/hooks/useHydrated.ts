'use client'

import { useSyncExternalStore } from 'react'
import { subscribe } from '@/lib/store.ts'

/** False on the server and through hydration, true from the first client render after — routes that read the store need this because `useStore` reports the empty state until then, and without the distinction a deck page flashes *deck not found* on every load of a deck that exists. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(subscribe, () => true, () => false)
