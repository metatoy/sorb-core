# CLAUDE.md — sorb-core

Part of the **Sorb** polyrepo under the **Metatoy** org (local base
`workspace/metatoy/`). Siblings: `sorb-seed`, `sorb-leaf`, `sorb-juice`,
`sorb-canopy`, `sorb-demo`, `sorb-cloud`. Branding: see `sorb-branding.md` /
`sorb-rename-migration.md` (kept in the org's `spec/sorb/` corpus).

## What this is

`@sorb/core` — the **shared contract**. JSDoc typedefs for the resolved
bindable token map (`ResolvedToken {id, cssVar, value, tier, type}`) and the
capture schemas (`LayerNode`, `StoryIndex`), plus the canonical tier ordering
(`TIERS` / `TIER_RANK`). Every other Sorb package depends on this so the contract
can't drift across the polyrepo.

## Hard rules

- **JavaScript only — never TypeScript.** Types are JSDoc typedefs in `src/types.js`
  (bridged back into `src/index.js` via `@typedef {import('./types.js').X} X` so
  `import('@sorb/core').X` keeps resolving for consumers).
- **No build step.** Shipped as plain `src/` (`main: src/index.js`).
- **Per-repo lockfile is correct** (polyrepo — not a pnpm workspace anymore).
- **A change to any shared typedef is a contract change** — it ripples to every
  consumer (`sorb-seed`/`sorb-juice`/`sorb-leaf`). Treat it as breaking.
- **Commit/push only when asked.** If on the default branch, branch first.
