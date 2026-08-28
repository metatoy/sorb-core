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

/**
 * @typedef {'primitive' | 'semantic' | 'component'} Tier
 *   Which layer of the 3-tier DTCG taxonomy a token belongs to.
 */

/**
 * @typedef {'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'number' | 'string'} TokenType
 *   DTCG `$type` of the resolved token (extend as the taxonomy grows).
 */

/**
 * A flat map of token name → value.
 * @typedef {Object.<string, string | number>} TokenSet
 */

/**
 * One entry of the resolved bindable token map — the single contract produced by
 * Style Dictionary (`sorb/resolved-map`) and consumed by the bridge, the capture
 * annotator, and the plugin. This is THE shape that must not drift.
 * @typedef {Object} ResolvedToken
 * @property {string} id        Dotted token id, e.g. `button.primary.bg.default`.
 * @property {string} cssVar    The emitted CSS custom property, e.g. `--button-primary-bg-default`.
 * @property {string | number} value  Fully resolved value (no `var()` chains).
 * @property {Tier} tier        Taxonomy tier (drives binding precedence via TIER_RANK).
 * @property {TokenType} type   DTCG `$type`.
 */

/**
 * The resolved map as served/written: `.sorb/resolved.json`.
 * @typedef {ResolvedToken[]} ResolvedMap
 */

/**
 * A captured CSS value plus the raw string it came from.
 * @typedef {Object} RawValue
 * @property {string} raw  The raw CSS string captured from the DOM (e.g. `rgb(15,101,239)`).
 */

/**
 * A node in a captured layer tree (Storybook story → Figma-insertable geometry).
 * Produced by capture, annotated in place by the seed annotator, materialized by
 * the plugin.
 * @typedef {Object} LayerNode
 * @property {string} type                  Figma-ish node type, e.g. `FRAME`, `TEXT`.
 * @property {RawValue[]} [fills]           Fill paints (index 0 is the primary fill).
 * @property {RawValue[]} [strokes]         Stroke paints.
 * @property {number} [cornerRadius]        Corner radius in px.
 * @property {{ color?: RawValue }[]} [effects]  Effects (shadows, etc.).
 * @property {LayerNode[]} [children]       Child nodes.
 * @property {SorbAnnotation} [sorb]        Token bindings attached by the annotator.
 */

/**
 * Token bindings the seed annotator stamps onto a matched LayerNode.
 * @typedef {Object} SorbAnnotation
 * @property {Object.<string, string>} tokens
 *   role (`fill`/`stroke`/`cornerRadius`/`effectN`) → bound token id.
 * @property {Object.<string, string[]>} candidates
 *   role → all token ids whose value matched (the plugin offers these as a switch).
 */

/**
 * One story's entry in the capture index (`.sorb/index.json`).
 * @typedef {Object} StoryEntry
 * @property {string} artifact  Relative path to the captured artifact (`*.sorb.json`).
 */

/**
 * The capture index written to `.sorb/index.json`.
 * @typedef {Object} StoryIndex
 * @property {Object.<string, StoryEntry>} stories  storyId → entry.
 */

/**
 * Identifies a component variant by its dot-path prefix.
 * e.g. "button.tertiary" covers all tokens whose id starts with "button.tertiary."
 * @typedef {Object} VariantSpec
 * @property {string} componentId  Top-level component key, e.g. "button".
 * @property {string} variantId    Full dot-path of the variant, e.g. "button.tertiary".
 * @property {string} [fromVariant] Dot-path of the source variant to clone from (addVariant only).
 * @property {string} [replacedBy]  Dot-path that replaces this variant (deprecateVariant only).
 */

/**
 * The result of a lifecycle action — what changed.
 * @typedef {Object} VariantChangeset
 * @property {'add'|'deprecate'} action
 * @property {string} variantId    The variant that was added or deprecated.
 * @property {string[]} tokenIds   All token ids affected (added or deprecated).
 * @property {string} newVersion   The component set's new $version after the change.
 */

// ─── Connector contract (v1: additive) ─────────────────────────────────────────
//
// Three pluggable axes — SOURCE (where tokens + geometry come IN), CODE-SOURCE
// (where the running app / codebase lives), and TARGET (how tokens bind into the
// app) — plus a runtime registry that dispatches by `id`. Core only defines the
// contract + registry + default ids; the default implementations are registered
// by sorb-seed / sorb-juice / sorb-leaf in later phases. See
// spec/sorb/connectors-architecture.md. `config` everywhere below is the app's
// `sorb.config.json`-shaped object.

/**
 * A design unit to capture — one addressable thing a SourceConnector can turn
 * into geometry (today's Storybook "story entry" is one). Opaque-ish: only `id`
 * is guaranteed; connectors carry whatever extra metadata they need.
 * @typedef {Object} DesignUnit
 * @property {string} id     Stable unit id (e.g. a Storybook story id).
 * @property {string} [name] Human-readable label.
 */

/**
 * SOURCE axis — where design tokens + geometry come IN. A real source pulls BOTH
 * tokens and geometry from the tool (founder decision 2026-08-28).
 * @typedef {Object} SourceConnector
 * @property {string} id  Registry key (default `'storybook-dom'`).
 * @property {(config: Object) => Promise<DesignUnit[]>} listUnits
 *   Discover the design units to capture.
 * @property {(unit: DesignUnit, config: Object) => Promise<LayerNode>} captureGeometry
 *   Capture one unit as a raw (un-annotated) LayerNode tree.
 * @property {(config: Object) => Promise<TokenSet>} readTokens
 *   Read the DTCG token set for this source.
 */

/**
 * CODE-SOURCE axis — where the running app / codebase lives.
 * @typedef {Object} CodeSourceConnector
 * @property {string} id  Registry key (default `'local'`).
 * @property {(config: Object) => Promise<string|null>} resolveAppUrl
 *   Resolve the running app's URL (today = `appUrl` / `localhost:5173`).
 * @property {(config: Object) => string} resolveProjectRoot
 *   Resolve the project root dir (today = `process.cwd()`).
 * @property {(config: Object) => Promise<void>} [provision]
 *   Optional: clone/build a repo → hosted preview (future code sources).
 */

/**
 * TARGET axis — how tokens bind into the running app (the component-compat seam).
 * @typedef {Object} TargetAdapter
 * @property {string} id  Registry key (default `'react-bootstrap'`).
 * @property {string} emitFormat  A Style-Dictionary format id (e.g. `SORB_TOKENSET`).
 * @property {string[]} expectPrefixes  Vocab-guard namespace(s), e.g. `['bs-']`.
 * @property {(tokens: TokenSet, config: Object) => void} [inject]
 *   Optional: bind tokens into non-React hosts (the `sorbInit` seam).
 */

/** Default SOURCE connector id (registered by sorb-seed). @type {string} */
export const DEFAULT_SOURCE_ID = 'storybook-dom'

/** Default CODE-SOURCE connector id (registered by sorb-juice). @type {string} */
export const DEFAULT_CODE_SOURCE_ID = 'local'

/** Default TARGET adapter id (registered by sorb-leaf). @type {string} */
export const DEFAULT_TARGET_ID = 'react-bootstrap'

/**
 * The runtime connector registry — id → impl per axis. The Maps are mutable by
 * design so consumer packages register their defaults into them; the container
 * itself is frozen so the axis set can't drift.
 * @typedef {Object} ConnectorRegistry
 * @property {Map<string, SourceConnector>} source
 * @property {Map<string, CodeSourceConnector>} codeSource
 * @property {Map<string, TargetAdapter>} target
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
 * Register a TARGET adapter by its `id`.
 * @param {TargetAdapter} adapter
 * @returns {TargetAdapter} the registered adapter.
 */
export function registerTarget(adapter) {
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
