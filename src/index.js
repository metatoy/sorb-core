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

export {}
