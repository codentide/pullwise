'use client'

import { useSyncExternalStore } from 'react'
import { emptyState, getState, subscribe, type State } from '@/lib/store.ts'

/**
 * React's window onto the store. It lives here rather than in src/lib because
 * the domain must stay framework-free — the architecture test enforces it.
 *
 * The third argument matters more than it looks. The server has no localStorage,
 * so it renders the empty state; the browser already has the real one by the
 * time it hydrates. React uses this server snapshot during hydration too, so
 * both sides agree on the first paint and the real state arrives on the render
 * right after. Passing the live snapshot here instead produces a hydration
 * mismatch that only shows up once there is saved data — which is to say, never
 * in testing and always for the user.
 */
export const useStore = (): State => useSyncExternalStore(subscribe, getState, serverSnapshot)

/** Must be a stable reference: a fresh object every call would loop forever. */
const SERVER_STATE = emptyState()
const serverSnapshot = (): State => SERVER_STATE
