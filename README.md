# @sorb/core

Sorb™ is the design-token bridge between Figma and your running app. `@sorb/core`
is its **shared contract** — the typedefs and small runtime constants that
`@sorb/seed`, `@sorb/juice`, and `@sorb/leaf` all import so the shape of a
resolved token, and the tier that wins when two tokens collide, can't drift
between the four packages.

Full docs: **[sorbcloud.com/docs/packages/core](https://www.sorbcloud.com/docs/packages/core)**.

## Install

```bash
npm install @sorb/core
```

You will rarely install this directly — `@sorb/seed`, `@sorb/juice`, and
`@sorb/leaf` all depend on it already. Install it yourself only if you're
writing a connector (see below) or referencing its typedefs from your own
JSDoc.

## What's in the contract

### Tiers

Sorb's token taxonomy has three tiers, most-specific first: `component` beats
`semantic` beats `primitive` when two tokens resolve to the same CSS custom
property.

```js
import { TIERS, TIER_RANK } from '@sorb/core'

TIERS      // ['component', 'semantic', 'primitive']
TIER_RANK  // { component: 0, semantic: 1, primitive: 2 } — lower rank wins
```

### `ResolvedToken`

The one shape that must not drift: the resolved, bindable token map produced
by Style Dictionary's `sorb/resolved-map` format and consumed by the bridge,
the capture annotator, and the plugin.

```js
/**
 * @typedef {Object} ResolvedToken
 * @property {string} id        Dotted token id, e.g. "button.primary.bg.default"
 * @property {string} cssVar    Emitted CSS custom property, e.g. "--button-primary-bg-default"
 * @property {string|number} value  Fully resolved value (no var() chains)
 * @property {Tier} tier        Taxonomy tier (drives precedence via TIER_RANK)
 * @property {TokenType} type   DTCG $type
 */
```

Reference it from your own JSDoc with:

```js
/** @type {import('@sorb/core').ResolvedToken[]} */
```

The full typedef set (`ResolvedMap`, `LayerNode`, `SorbAnnotation`,
`StoryIndex`, `VariantSpec`, `VariantChangeset`, …) lives in
[`src/types.js`](./src/types.js) and is documented on the
[core reference page](https://www.sorbcloud.com/docs/packages/core).

## Semantic-role contract + role-id semver rule

The framework `TargetAdapter`s (`sorb/mantine-vars`, `sorb/mui-vars`,
`sorb/mat-sys-vars`, `sorb/shadcn-theme`, `sorb/primevue-preset`) all emit
against one canonical set of role ids, not a specific token kit's names:

```js
import { DEFAULT_ROLE_IDS, ALL_ROLE_IDS, resolveRole } from '@sorb/core'

DEFAULT_ROLE_IDS.color   // ['color.surface', 'color.ink', 'color.brand', ...]
ALL_ROLE_IDS             // flat list across color/radius/shadow/typography

// A format resolves a role id through an optional override map — identity
// when the kit already uses canonical ids:
resolveRole('color.brand', options.roleMap) // -> the kit's own token id
```

If your token kit uses different names, pass `options.roleMap` (role id →
your token id) to the format instead of forking it.

**Semver rule:** adding a role id to `DEFAULT_ROLE_IDS`/`ALL_ROLE_IDS` is a
**minor** bump. Renaming or removing one is a **major** bump for `@sorb/core`
**and** `@sorb/seed` — every format consumer depends on this exact set.

## Connector registry

Sorb pulls tokens through three pluggable axes — **source** (where tokens +
geometry come in, e.g. Storybook), **codeSource** (where the running app
lives, e.g. local), and **target** (how tokens bind into the app, e.g.
react-bootstrap). `@sorb/core` owns the registry; `@sorb/seed`, `@sorb/juice`,
and `@sorb/leaf` register their default implementations into it.

```js
import {
  registerTarget, getTarget, resolveConnectorIds,
  DEFAULT_SOURCE_ID, DEFAULT_CODE_SOURCE_ID, DEFAULT_TARGET_ID,
} from '@sorb/core'

registerTarget({
  id: 'my-target',
  emitFormat: 'SORB_TOKENSET',
  expectPrefixes: ['my-'],
})

getTarget('my-target') // -> the adapter you just registered

resolveConnectorIds({}) // -> { source: 'storybook-dom', codeSource: 'local', target: 'react-bootstrap' }
```

`registerTarget` validates the adapter shape at register time (throws on a
missing/malformed `id` or `emitFormat`, or a non-array `expectPrefixes`) so a
typo fails loudly instead of silently at query time. `getSource`/
`getCodeSource`/`getTarget` throw on an unknown id.

## Related packages

- [`@sorb/seed`](https://www.sorbcloud.com/docs/packages/seed) — capture + resolve tokens
- [`@sorb/juice`](https://www.sorbcloud.com/docs/packages/juice) — the bridge server / CLI
- [`@sorb/leaf`](https://www.sorbcloud.com/docs/packages/leaf) — the React SDK

## License

MIT
