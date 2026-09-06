// @sorb/core — shared typedefs.
//
// JSDoc-only (no runtime exports; the `export {}` at the bottom makes this an
// ES module so `import('./types').X` resolves). Moved out of `index.js` so
// `import('@sorb/core').ResolvedToken`-style JSDoc imports (e.g.
// `sorb-leaf/src/types.js:108`) have one canonical file to point at.
// `index.js` re-exposes each of these as `@typedef {import('./types').X} X`
// so nothing that already imports typedefs from `@sorb/core` breaks.

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
 * @property {DarkModeConvention} [darkMode]
 *   Optional: this target's dark-mode convention (real-dark-mode spec D1).
 *   Undefined ⇒ single-mode (no dark) — the target has no notion of a dark
 *   variant and mode-aware emit/inject should fall back to flat `:root` output.
 */

/**
 * How a TargetAdapter's host framework expresses light/dark mode. v1 only
 * ships `'attribute'` (Bootstrap 5.3's `[data-bs-theme]`); `'class'`
 * (Tailwind's `.dark`) and `'media'` (OS-only, no manual override) are named
 * here for forward-compat but not yet implemented by any shipped adapter —
 * see real-dark-mode-implementation spec §3 "Deferred to phase 2".
 * @typedef {Object} DarkModeConvention
 * @property {'attribute'|'class'|'media'} strategy
 *   How the manual override is expressed. `'attribute'` sets/reads a DOM
 *   attribute (e.g. `data-bs-theme`); `'class'` toggles a class on
 *   `documentElement`; `'media'` means OS-only, no manual override.
 * @property {string} [attribute]
 *   The attribute name for `strategy: 'attribute'` (e.g. `'data-bs-theme'`).
 * @property {string} darkSelector
 *   The CSS selector matching the dark-mode override (e.g.
 *   `'[data-bs-theme="dark"]'`).
 * @property {string} [lightSelector]
 *   The CSS selector matching an explicit light-mode override (e.g.
 *   `'[data-bs-theme="light"]'`) — lets a manual "light" choice beat an OS
 *   `prefers-color-scheme: dark` setting.
 */

/**
 * SEMANTIC-ROLE CONTRACT (framework-targets-productization, T0).
 *
 * The canonical set of role ids a token kit MUST expose for the framework
 * TargetAdapter emit formats (`sorb/mantine-vars`, `sorb/mui-vars`,
 * `sorb/mat-sys-vars`, `sorb/shadcn-theme`, `sorb/primevue-preset`) to emit
 * correctly. Each format maps its framework's own vars (`--mantine-*`, `--mui-*`,
 * `--mat-sys-*`, shadcn vars, PrimeVue preset roots) ONTO these role ids.
 *
 * These are DTCG dot-path ids (→ CSS var `--<kebab>` → preview-payload key
 * `<kebab>`). The Janes Jeans kit (`@metatoy/janes-jeans`) is the reference
 * implementation. A kit using different names supplies `options.roleMap`
 * (role-id → its-own-token-id) to a format rather than forking it.
 *
 * SEMVER: adding a role id here is a MINOR bump; renaming or removing one is a
 * MAJOR bump for @sorb/core AND @sorb/seed — every format consumer depends on
 * this set. Scope = the UNION of the target maps' role columns, not a kit's full
 * token tree; anything beyond this list is kit-private.
 *
 * @typedef {Object} SemanticRoles
 * @property {string[]} color   surface/ink/brand/accent/danger/success/border/focus roles.
 * @property {string[]} radius  control/card/pill.
 * @property {string[]} shadow  raised/overlay.
 * @property {string[]} typography  display/heading/body/caption × fontSize/Weight/lineHeight.
 */

/**
 * The runtime connector registry — id → impl per axis. The Maps are mutable by
 * design so consumer packages register their defaults into them; the container
 * itself is frozen so the axis set can't drift.
 * @typedef {Object} ConnectorRegistry
 * @property {Map<string, SourceConnector>} source
 * @property {Map<string, CodeSourceConnector>} codeSource
 * @property {Map<string, TargetAdapter>} target
 */

export {}
