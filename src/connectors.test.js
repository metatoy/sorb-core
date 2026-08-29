// Contract test for the connector registry — proves dispatch is REAL (a
// registered impl round-trips through get*), not just JSDoc types.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  connectors,
  registerSource,
  registerCodeSource,
  registerTarget,
  getSource,
  getCodeSource,
  getTarget,
  resolveConnectorIds,
  DEFAULT_SOURCE_ID,
  DEFAULT_CODE_SOURCE_ID,
  DEFAULT_TARGET_ID,
} from './index.js'

test('source connector registers and round-trips via getSource', () => {
  const dummy = {
    id: 'dummy-source',
    async listUnits() {
      return [{ id: 'u1', name: 'Unit 1' }]
    },
    async captureGeometry() {
      return { type: 'FRAME' }
    },
    async readTokens() {
      return { 'color.bg': '#fff' }
    },
  }
  const returned = registerSource(dummy)
  assert.equal(returned, dummy)
  assert.equal(getSource('dummy-source'), dummy)
  assert.equal(connectors.source.get('dummy-source'), dummy)
})

test('codeSource connector registers and round-trips via getCodeSource', () => {
  const dummy = {
    id: 'dummy-code',
    async resolveAppUrl() {
      return 'http://localhost:5173'
    },
    resolveProjectRoot() {
      return '/tmp/proj'
    },
  }
  registerCodeSource(dummy)
  assert.equal(getCodeSource('dummy-code'), dummy)
})

test('target adapter registers and round-trips via getTarget', () => {
  const dummy = {
    id: 'dummy-target',
    emitFormat: 'SORB_TOKENSET',
    expectPrefixes: ['bs-'],
  }
  registerTarget(dummy)
  assert.equal(getTarget('dummy-target'), dummy)
})

test('target adapter darkMode field is optional — undefined ⇒ single-mode', () => {
  const dummy = {
    id: 'dummy-target-no-dark',
    emitFormat: 'SORB_TOKENSET',
    expectPrefixes: ['bs-'],
  }
  registerTarget(dummy)
  assert.equal(getTarget('dummy-target-no-dark').darkMode, undefined)
})

test('target adapter round-trips a darkMode convention (attribute strategy)', () => {
  const dummy = {
    id: 'dummy-target-dark',
    emitFormat: 'SORB_TOKENSET',
    expectPrefixes: ['bs-'],
    darkMode: {
      strategy: 'attribute',
      attribute: 'data-bs-theme',
      darkSelector: '[data-bs-theme="dark"]',
      lightSelector: '[data-bs-theme="light"]',
    },
  }
  registerTarget(dummy)
  const got = getTarget('dummy-target-dark')
  assert.equal(got.darkMode.strategy, 'attribute')
  assert.equal(got.darkMode.attribute, 'data-bs-theme')
  assert.equal(got.darkMode.darkSelector, '[data-bs-theme="dark"]')
  assert.equal(got.darkMode.lightSelector, '[data-bs-theme="light"]')
})

test('get* throws a clear error on unknown id', () => {
  assert.throws(() => getSource('nope'), /Unknown source connector: "nope"/)
  assert.throws(() => getCodeSource('nope'), /Unknown codeSource connector: "nope"/)
  assert.throws(() => getTarget('nope'), /Unknown target adapter: "nope"/)
})

test('resolveConnectorIds returns all three defaults for empty config', () => {
  assert.deepEqual(resolveConnectorIds({}), {
    source: DEFAULT_SOURCE_ID,
    codeSource: DEFAULT_CODE_SOURCE_ID,
    target: DEFAULT_TARGET_ID,
  })
  // Same with no argument at all.
  assert.deepEqual(resolveConnectorIds(), {
    source: DEFAULT_SOURCE_ID,
    codeSource: DEFAULT_CODE_SOURCE_ID,
    target: DEFAULT_TARGET_ID,
  })
})

test('resolveConnectorIds overrides only the provided axis', () => {
  assert.deepEqual(resolveConnectorIds({ source: 'x' }), {
    source: 'x',
    codeSource: DEFAULT_CODE_SOURCE_ID,
    target: DEFAULT_TARGET_ID,
  })
})

test('default ids match the frozen contract', () => {
  assert.equal(DEFAULT_SOURCE_ID, 'storybook-dom')
  assert.equal(DEFAULT_CODE_SOURCE_ID, 'local')
  assert.equal(DEFAULT_TARGET_ID, 'react-bootstrap')
})

test('connectors container is frozen; its axis Maps are mutable', () => {
  assert.ok(Object.isFrozen(connectors))
  assert.ok(connectors.source instanceof Map)
  assert.ok(connectors.codeSource instanceof Map)
  assert.ok(connectors.target instanceof Map)
})
