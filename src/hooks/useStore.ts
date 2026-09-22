'use client'

import { useSyncExternalStore } from 'react'
import { emptyState, getState, subscribe, type State } from '@/lib/store.ts'

/** React's window onto the store (lives here, not src/lib, because the domain must stay framework-free); the third argument matters because the server has no localStorage and must agree with the browser's first paint — passing the live snapshot instead produces a hydration mismatch that only shows up once there is saved data, i.e. never in testing and always for the user. */
export const useStore = (): State => useSyncExternalStore(subscribe, getState, serverSnapshot)

/** Must be a stable reference: a fresh object every call would loop forever. */
const SERVER_STATE = emptyState()
const serverSnapshot = (): State => SERVER_STATE
