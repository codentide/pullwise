'use client'

import { useSyncExternalStore } from 'react'
import { subscribe } from '@/lib/store.ts'

/**
 * False on the server and through hydration, true from the first client render
 * after it.
 *
 * Routes that read the store need this. `useStore` deliberately reports the
 * empty state until hydration finishes, so a deck page cannot tell "the store
 * has not arrived" from "there is no such deck" — and without the distinction it
 * flashes *deck not found* on every load of a deck that exists.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(subscribe, () => true, () => false)
