# @sorb/core 0.2.0 — release prep note

Status: **PREPARED, NOT PUBLISHED.** This is a prep note for the founder; no
tag/Release/publish has been created. `npm publish` (via the GitHub Release →
OIDC-provenance workflow below) is a founder-gated external action.

## Why a release

`@sorb/core` on npm is currently `0.1.1` and predates the connector-registry
contract. Local `main` (this branch's parent) has grown that contract; the
three consumer packages (`sorb-seed`, `sorb-juice`, `sorb-leaf`) currently
guard against the old published core with namespace-import +
`typeof core.registerX === 'function'` feature-detection, because they can't
assume the registry exists yet. Publishing 0.2.0 lets those guards become
no-ops (and eventually be deleted).

## What's new in this version (additive only)

All new exports from `src/index.js`, added on top of the existing `TIERS` /
`TIER_RANK` and typedefs — nothing existing was removed or changed shape:

- **Connector contract typedefs** (JSDoc only, no runtime cost):
  `DesignUnit`, `SourceConnector`, `CodeSourceConnector`, `TargetAdapter`,
  `DarkModeConvention`.
- **Connector registry** (runtime):
  - `connectors` — the `{ source, codeSource, target }` Map container.
  - `registerSource(conn)`, `registerCodeSource(conn)`, `registerTarget(adapter)`
  - `getSource(id)`, `getCodeSource(id)`, `getTarget(id)` — throw on unknown id.
  - `resolveConnectorIds(config)` — resolves `{source, codeSource, target}`
    from a `sorb.config.json`-shaped object, falling back to defaults.
  - `DEFAULT_SOURCE_ID` (`'storybook-dom'`), `DEFAULT_CODE_SOURCE_ID`
    (`'local'`), `DEFAULT_TARGET_ID` (`'react-bootstrap'`).
- **`TargetAdapter.darkMode`** — optional `DarkModeConvention` field
  (real-dark-mode spec D1); undefined means single-mode / no dark, so it's a
  backward-compatible optional addition to an already-optional-shaped object.
- Earlier, already-released-as-of-0.1.1-vs-this-branch additions folded in
  along the way: `VariantSpec` / `VariantChangeset` typedefs (variant
  lifecycle) — also additive JSDoc only.

Confirmed additive: diffed `src/index.js` against the 0.1.1 tag — every prior
export (`TIERS`, `TIER_RANK`, all prior typedefs) is untouched; everything
above is new. **Minor bump is correct: 0.1.1 → 0.2.0.**

## Publish mechanism (exact steps — founder-gated)

`.github/workflows/publish.yml` fires on `release: [published]` (a GitHub
Release, not just a tag push) and:
1. Verifies the release tag `vX.Y.Z` matches `package.json`'s `version` field
   (hard-fails the workflow otherwise — can't publish a version you forgot to
   bump).
2. `npm install` (no build step for this package — src-only).
3. `npm publish --provenance --access public` — OIDC trusted publishing,
   `NODE_AUTH_TOKEN` from `secrets.NPM_TOKEN`, scope `@sorb`.
4. A **pre-release** GitHub Release (marked "pre-release") instead publishes
   to the `rc` dist-tag (`npm publish --provenance --access public --tag rc`)
   — useful for a dry-run version before promoting to `latest`.

**Founder steps to actually ship this:**
1. Review/merge this branch (`chore/core-0.2.0`) to `main` — version bump is
   already staged in `package.json` (0.1.1 → 0.2.0), not yet committed.
2. `git tag v0.2.0 && git push origin v0.2.0` (or just create the tag via the
   GitHub Release UI in the next step).
3. On GitHub → Releases → "Draft a new release" → tag `v0.2.0` → target
   `main` → publish (as a full Release, not pre-release, to land on the
   `latest` dist-tag). This publish event triggers the workflow.
4. Confirm on npm: `npm view @sorb/core version` → `0.2.0`.

## Consumer alignment (post-publish follow-ups — NOT done here)

Once `@sorb/core@0.2.0` is live on npm, bump each consumer's dependency and
clean up the now-unnecessary guards. Do NOT do this before the publish lands
— consumers would resolve to a `@sorb/core` that doesn't exist yet on the
`^0.2.0` range.

**Dep bumps** (current state, from `package.json`):
- `sorb-leaf/package.json:41` — `"@sorb/core": "^0.1.0"` → bump to `^0.2.0`
- `sorb-seed/package.json:34` — `"@sorb/core": "^0.1.1"` → bump to `^0.2.0`
- `sorb-juice/package.json:39` — `"@sorb/core": "^0.1.0"` → bump to `^0.2.0`
- `sorb-cloud`, `sorb-canopy`, `sorb-demo` — no `@sorb/core` dependency found;
  no action needed.

**Guard cleanup** (feature-detect / namespace-import band-aids that become
no-ops once 0.2.0 is the guaranteed floor — safe to simplify/remove after the
dep bump, not before):
- `sorb-seed/src/sources/storybookDom.js:14,188` — already does a direct
  `import { registerSource } from '@sorb/core'` (no guard) — will just work
  once 0.2.0 is resolved; nothing to clean up here, but it's currently
  relying on `^0.1.1` accidentally NOT having `registerSource` (i.e. this
  would already be broken against 0.1.1 in prod — verify it's dev-time-only
  reachable / gated before the bump).
- `sorb-juice/src/codeSources/local.js:46-47` — `if (typeof
  core.registerCodeSource === 'function') { core.registerCodeSource(...) }`
  — collapse to a bare call once `^0.2.0` guarantees the export.
- `sorb-juice/src/cli.js:21-22` — `typeof core.resolveConnectorIds ===
  'function' && typeof core.getCodeSource === 'function'` guard — same,
  collapse once guaranteed.
- `sorb-leaf/src/targets/reactBootstrap.js:54-55` — `if (typeof
  core.registerTarget === 'function') { core.registerTarget(...) }` —
  same, collapse once guaranteed.

Grep to re-find these after the publish: `grep -rn "typeof core\." sorb-seed
sorb-juice sorb-leaf`.

## Explicitly NOT done by this prep

- No commit created (working tree has the version bump staged only in the
  file, branch `chore/core-0.2.0`, not committed/pushed).
- No git tag, no GitHub Release, no `npm publish`.
- No consumer `package.json` changes (sorb-seed/juice/leaf left untouched).
- No guard-code cleanup in consumers.

These are the founder gate: merge → tag → GitHub Release → (workflow
publishes) → then a separate follow-up pass to bump + clean up consumers.
