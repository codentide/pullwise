import test from 'node:test'
import assert from 'node:assert/strict'
import { actions, getState, missingCopies } from '../src/lib/store.ts'

test('an id absent from knowledge is assumed owned, so nothing is missing', () => {
  assert.equal(missingCopies({}, 'A1-001', 1), 0)
  assert.equal(missingCopies({}, 'A1-001', 2), 0)
})

test('a partially owned card reports the real shortfall', () => {
  assert.equal(missingCopies({ 'A1-001': 1 }, 'A1-001', 2), 1)
})

test('owning more than needed never goes negative', () => {
  assert.equal(missingCopies({ 'A1-001': 2 }, 'A1-001', 1), 0)
})

test('owning exactly zero is not the same as not knowing at all', () => {
  // Absent key: unknown, assumed owned, nothing missing.
  assert.equal(missingCopies({}, 'A1-001', 2), 0)
  // Explicit zero: actually missing everything needed.
  assert.equal(missingCopies({ 'A1-001': 0 }, 'A1-001', 2), 2)
})

test('invalid JSON is rejected and leaves state untouched', () => {
  actions.reset()
  const before = getState()
  const ok = actions.importJson('{not valid json')
  assert.equal(ok, false)
  assert.deepEqual(getState(), before)
})

test('a payload missing version 1 is rejected', () => {
  actions.reset()
  const before = getState()
  const ok = actions.importJson(JSON.stringify({ decks: [] }))
  assert.equal(ok, false)
  assert.deepEqual(getState(), before)
})

test('a payload whose decks is not an array is rejected', () => {
  actions.reset()
  const before = getState()
  const ok = actions.importJson(JSON.stringify({ version: 1, decks: {} }))
  assert.equal(ok, false)
  assert.deepEqual(getState(), before)
})

test('a genuinely valid payload replaces the whole state', () => {
  actions.reset()
  const payload = {
    version: 1,
    decks: [{ id: 'x', name: 'Imported', entries: [{ cardId: 'A1-001', copies: 2 }], updatedAt: 0 }],
    knowledge: { 'A1-001': 1 },
  }
  const ok = actions.importJson(JSON.stringify(payload))
  assert.equal(ok, true)
  assert.deepEqual(getState().decks, payload.decks)
  assert.deepEqual(getState().knowledge, payload.knowledge)
})
