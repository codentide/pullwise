import test from 'node:test'
import assert from 'node:assert/strict'
import { gradeOf } from '../src/lib/rarity.ts'

test('every real rarity code lands on its documented grade', () => {
  assert.equal(gradeOf('C'), 1)
  assert.equal(gradeOf('U'), 1)
  assert.equal(gradeOf('R'), 2)
  assert.equal(gradeOf('RR'), 3)
  assert.equal(gradeOf('AR'), 3)
  assert.equal(gradeOf('SR'), 4)
  assert.equal(gradeOf('SAR'), 4)
  assert.equal(gradeOf('IM'), 4)
  assert.equal(gradeOf('S'), 4)
  assert.equal(gradeOf('SSR'), 5)
  assert.equal(gradeOf('UR'), 5)
})

test('an unmapped rarity code falls back to the lowest grade rather than throwing', () => {
  assert.equal(gradeOf('NOT-A-REAL-RARITY'), 1)
})
