// @sorb/core — the shared Sorb contract.
//
// One published home for the shapes that cross repo boundaries: the resolved
// bindable token map (Style Dictionary's `sorb/resolved-map` output) and the
// capture schemas (LayerNode tree, story index). Consolidated here so the
// contract can't drift across sorb-seed, sorb-juice, and sorb-leaf once the
// monorepo is split (sorb-rename-migration §3.2).
//
// JS-only, JSDoc typedefs — per the hard rules, no TypeScript. The only runtime
// export is the canonical tier ordering, which the capture annotator and the
// plugin both rank against.

/**
 * Token tiers, most-specific first. Binding precedence: component beats
 * semantic beats primitive.
 * @type {readonly ['component', 'semantic', 'primitive']}
 */
export const TIERS = Object.freeze(['component', 'semantic', 'primitive'])

/**
 * Tier → rank (0 = most specific). Lower wins when several tokens share a value.
 * @type {Readonly<Record<Tier, number>>}
 */
export const TIER_RANK = Object.freeze({ component: 0, semantic: 1, primitive: 2 })

// ─── Shared typedefs ───────────────────────────────────────────────────────────
//
// Full definitions live in `./types.js`; these are import-bridges so existing
// JSDoc imports of `@sorb/core` typedefs (e.g. `sorb-leaf/src/types.js:108`
// imports `ResolvedToken`) keep resolving unchanged.

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').TokenType} TokenType */
/** @typedef {import('./types.js').TokenSet} TokenSet */
/** @typedef {import('./types.js').ResolvedToken} ResolvedToken */
/** @typedef {import('./types.js').ResolvedMap} ResolvedMap */
/** @typedef {import('./types.js').RawValue} RawValue */
/** @typedef {import('./types.js').LayerNode} LayerNode */
/** @typedef {import('./types.js').SorbAnnotation} SorbAnnotation */
/** @typedef {import('./types.js').StoryEntry} StoryEntry */
/** @typedef {import('./types.js').StoryIndex} StoryIndex */
/** @typedef {import('./types.js').VariantSpec} VariantSpec */
/** @typedef {import('./types.js').VariantChangeset} VariantChangeset */

// ─── Connector contract (v1: additive) ─────────────────────────────────────────
//
// Three pluggable axes — SOURCE (where tokens + geometry come IN), CODE-SOURCE
// (where the running app / codebase lives), and TARGET (how tokens bind into the
// app) — plus a runtime registry that dispatches by `id`. Core only defines the
// contract + registry + default ids; the default implementations are registered
// by sorb-seed / sorb-juice / sorb-leaf in later phases. See
// spec/sorb/connectors-architecture.md. `config` everywhere below is the app's
// `sorb.config.json`-shaped object.

/** @typedef {import('./types.js').DesignUnit} DesignUnit */
/** @typedef {import('./types.js').SourceConnector} SourceConnector */
/** @typedef {import('./types.js').CodeSourceConnector} CodeSourceConnector */
/** @typedef {import('./types.js').TargetAdapter} TargetAdapter */
/** @typedef {import('./types.js').DarkModeConvention} DarkModeConvention */
/** @typedef {import('./types.js').SemanticRoles} SemanticRoles */

/**
 * The canonical role-id list (T0 reference = the JJ kit's semantic tier).
 * @type {Readonly<{color: string[], radius: string[], shadow: string[], typography: string[]}>}
 */
export const DEFAULT_ROLE_IDS = Object.freeze({
  color: Object.freeze([
    'color.surface', 'color.surface-raised', 'color.surface-sunken',
    'color.ink', 'color.ink-muted', 'color.ink-on-brand',
    'color.brand', 'color.brand-hover', 'color.brand-contrast',
    'color.accent', 'color.accent-hover', 'color.accent-contrast',
    'color.danger', 'color.danger-hover', 'color.success', 'color.success-hover',
    'color.focus-ring', 'color.border', 'color.border-subtle', 'color.border-strong',
  ]),
  radius: Object.freeze(['radius.control', 'radius.card', 'radius.pill']),
  shadow: Object.freeze(['shadow.raised', 'shadow.overlay']),
  typography: Object.freeze([
    'typography.display.fontSize', 'typography.display.fontWeight', 'typography.display.lineHeight',
    'typography.heading.fontSize', 'typography.heading.fontWeight', 'typography.heading.lineHeight',
    'typography.body.fontSize', 'typography.body.fontWeight', 'typography.body.lineHeight',
    'typography.caption.fontSize', 'typography.caption.fontWeight', 'typography.caption.lineHeight',
  ]),
})

/**
 * Flat list of every canonical role id (all tiers), for iteration/validation.
 * @type {readonly string[]}
 */
export const ALL_ROLE_IDS = Object.freeze([
  ...DEFAULT_ROLE_IDS.color, ...DEFAULT_ROLE_IDS.radius,
  ...DEFAULT_ROLE_IDS.shadow, ...DEFAULT_ROLE_IDS.typography,
])

/**
 * Resolve a role id to the kit's actual token id via an optional override map.
 * A format calls `resolveRole('color.brand', options.roleMap)` → the kit's token
 * id (identity when the kit uses canonical ids, i.e. the JJ reference).
 * @param {string} roleId  A canonical role id from {@link ALL_ROLE_IDS}.
 * @param {Record<string,string>} [roleMap]  role-id → kit-token-id overrides.
 * @returns {string} the kit token id to reference (`var(--<kebab>)`).
 */
export function resolveRole(roleId, roleMap) {
  return (roleMap && roleMap[roleId]) || roleId
}

/** Default SOURCE connector id (registered by sorb-seed). @type {string} */
export const DEFAULT_SOURCE_ID = 'storybook-dom'

/** Default CODE-SOURCE connector id (registered by sorb-juice). @type {string} */
export const DEFAULT_CODE_SOURCE_ID = 'local'

/** Default TARGET adapter id (registered by sorb-leaf). @type {string} */
export const DEFAULT_TARGET_ID = 'react-bootstrap'

/** @typedef {import('./types.js').ConnectorRegistry} ConnectorRegistry */

/**
 * The runtime connector registry — id → impl per axis. The Maps are mutable by
 * design so consumer packages register their defaults into them; the container
 * itself is frozen so the axis set can't drift.
 * @type {ConnectorRegistry}
 */
export const connectors = Object.freeze({
  source: new Map(),
  codeSource: new Map(),
  target: new Map(),
})

/**
 * Register a SOURCE connector by its `id`.
 * @param {SourceConnector} conn
 * @returns {SourceConnector} the registered connector.
 */
export function registerSource(conn) {
  connectors.source.set(conn.id, conn)
  return conn
}

/**
 * Register a CODE-SOURCE connector by its `id`.
 * @param {CodeSourceConnector} conn
 * @returns {CodeSourceConnector} the registered connector.
 */
export function registerCodeSource(conn) {
  connectors.codeSource.set(conn.id, conn)
  return conn
}

/**
 * Register a TARGET adapter by its `id`. Minimal shape validation (T0b) — with
 * seven+ adapters registering into one Map, a typo'd `id` or missing
 * `emitFormat` would fail silently at query time; catch it at register time.
 * Throws on a malformed adapter; `console.warn`s (does not throw) on a
 * duplicate-id overwrite so a legitimate re-register in tests/HMR still works.
 * @param {TargetAdapter} adapter
 * @returns {TargetAdapter} the registered adapter.
 */
export function registerTarget(adapter) {
  if (!adapter || typeof adapter.id !== 'string' || !adapter.id) {
    throw new Error('registerTarget: adapter.id must be a non-empty string')
  }
  if (typeof adapter.emitFormat !== 'string' || !adapter.emitFormat) {
    throw new Error(`registerTarget(${JSON.stringify(adapter.id)}): emitFormat must be a non-empty string`)
  }
  if (!Array.isArray(adapter.expectPrefixes)) {
    throw new Error(`registerTarget(${JSON.stringify(adapter.id)}): expectPrefixes must be an array`)
  }
  if (connectors.target.has(adapter.id)) {
    // eslint-disable-next-line no-console
    console.warn(`registerTarget: overwriting existing target adapter ${JSON.stringify(adapter.id)}`)
  }
  connectors.target.set(adapter.id, adapter)
  return adapter
}

/**
 * Look up a registered SOURCE connector; throws on unknown id.
 * @param {string} id
 * @returns {SourceConnector}
 */
export function getSource(id) {
  const conn = connectors.source.get(id)
  if (!conn) throw new Error(`Unknown source connector: ${JSON.stringify(id)}`)
  return conn
}

/**
 * Look up a registered CODE-SOURCE connector; throws on unknown id.
 * @param {string} id
 * @returns {CodeSourceConnector}
 */
export function getCodeSource(id) {
  const conn = connectors.codeSource.get(id)
  if (!conn) throw new Error(`Unknown codeSource connector: ${JSON.stringify(id)}`)
  return conn
}

/**
 * Look up a registered TARGET adapter; throws on unknown id.
 * @param {string} id
 * @returns {TargetAdapter}
 */
export function getTarget(id) {
  const adapter = connectors.target.get(id)
  if (!adapter) throw new Error(`Unknown target adapter: ${JSON.stringify(id)}`)
  return adapter
}

/**
 * Resolve the three connector ids from a config, falling back to the defaults
 * when a key is absent (back-compat = today's behavior).
 * @param {{ source?: string, codeSource?: string, target?: string }} [config]
 * @returns {{ source: string, codeSource: string, target: string }}
 */
export function resolveConnectorIds(config = {}) {
  return {
    source: config.source || DEFAULT_SOURCE_ID,
    codeSource: config.codeSource || DEFAULT_CODE_SOURCE_ID,
    target: config.target || DEFAULT_TARGET_ID,
  }
}

export {}
