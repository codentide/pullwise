import test from 'node:test'
import assert from 'node:assert/strict'
import { meta } from '../src/lib/meta.ts'

test('meta carries the catalogue size and latest set without the full dataset', () => {
  assert.equal(typeof meta.cardCount, 'number')
  assert.ok(meta.cardCount > 0)
  assert.equal(typeof meta.latestSet, 'string')
  assert.ok(meta.latestSet.length > 0)
})
