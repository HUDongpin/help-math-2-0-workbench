# lesson-g05-l04-number-lines CurrentStateSnapshotV1

> Unsigned diagnostic receipt only. It binds an observed repository state and command outputs but grants no original-runtime authority, fidelity finding, review decision, Owner acceptance, strict completion, promotion, or publication.

- Snapshot: `g5-l4-m0-machine-entry-2026-07-26`
- Captured: `2026-07-26T12:52:02.755Z`
- Phase: `post-scaffold-pre-authoritative-runtime`
- HEAD: `unborn`; branch: `codex/g4-l3-fidelity-finish`; dirty: **true**
- Worktree fingerprint: 58714 withheld paths, SHA-256 `678fedebe4ad913c463094e0bc1c19109c41b5b8c21908e98ed72c81b62d60d3`
- Snapshot payload SHA-256: `8124f38caeeeb8611e537318eb664e6553216cbda3fad13836da8527d16dce34`

## Temporal boundary

This is a durable current-state receipt taken before authoritative G5 L4 runtime acquisition or renderer implementation. It is not a pre-change checkout image and must not be represented as one.

- The G5 L4 release definition and fail-closed public-route controls already existed before this snapshot.
- The 55 draft migration workspaces and M0 machine packet were materialized before this snapshot.
- The repository already contained unrelated user work and stale protected G4/legacy evidence bindings.

## Observed release state

- Draft-valid workspaces: **55/55**
- Implementation started: **0**
- Strict complete: **0/55**
- Published/public routes: **false/false**
- Authoritative runtime sessions: **0**
- Authoring audits: **0**
- Accepted audio files: **0**
- Owner decisions: **0**; named role assignments: **0**
- Protected completion ledger current: **false**
- Lesson release ledger current: **false**
- M0 exit ready / M1 authorized: **false/false**

## Diagnostic commands

| Command | Outcome | Exit | stdout bytes / SHA-256 | stderr bytes / SHA-256 |
|---|---|---:|---|---|
| `doctor` | passed | 0 | 1733 / `9a88c922fad4225e3dbd3ff8c1a0dc7f49039d1f1412c1efefda4944d8d6168b` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `verify-workbench` | failed | 1 | 94 / `71ef97df2abf33947bc760e346fd77ca246f70405bab9caef2d8ffd01c8548d3` | 182 / `b0aea6a29a6165f03a5c38bbf58d2aec12b7c78c87bcebb49c8a6657ffccf35f` |
| `verify-sources` | passed | 0 | 161 / `a5be7bf747e2757a682c033d19228280fd439e78630519ec16e8430c8e938f01` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `verify-g5-l4-m0-machine-packet` | passed | 0 | 6474 / `bb49dab1b37ac1f17ce47a2c774ec364378195ccd2dc23bc38c37c8c49be7e8a` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `check-protected-completion-ledger` | failed | 1 | 100 / `86bfdd106bacbf73de76ab8f449e6d735f0111ae28216424753870b02ca25d5e` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `check-lesson-release-ledger` | failed | 1 | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 27 / `543ed7676fb219b24812977dfeb5381f71a20c05ddf3e07666bee8cd40ecf4af` |
| `root-tests` | failed | 1 | 386771 / `c9610f32b52595219d2c33d4caf090092fbe9a82c715c904154c8817a2c6278e` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `demos-tests` | failed | 1 | 31034 / `611327313102270dd0554c78b01d253b89b6498abe70f95d2fc5f0ca5f11c861` | 363 / `aba7279165227220ea2ab885ea9bd38062e3064c7700731fba12070b2be817b5` |
| `web-tests` | passed | 0 | 4171 / `9f0c9feb389746cbfe3d61e11077b489985a1c30776a57007e1bb95b658fd6ad` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `demos-typecheck` | passed | 0 | 268 / `e996db181b382bcd9d50a7afb2ee64ea9d17a1a0affab0a039184ae8cfa4b889` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `production-build` | passed | 0 | 1733 / `ae6df746b53a4ea6d59d50c6c0eaef6f0ffdde1d81efbf068986b2f97e92ead9` | 0 / `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Raw command output is preserved only below the ignored private work root. This public projection stores hashes and byte counts, not output bytes.

## Input bindings

| Logical input | Repository path | Bytes | SHA-256 |
|---|---|---:|---|
| `snapshot-profile` | `catalog/current-state-snapshot-profiles.json` | 4931 | `d3abbc33a10d488f9fc98076c1cf6efe19077dec345403564351cb1cbe00986e` |
| `lesson-release-definition` | `catalog/lesson-releases.json` | 54579 | `ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375` |
| `source-manifest` | `catalog/source-manifest.sha256` | 831011 | `a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e` |
| `protected-completion-ledger` | `catalog/completion-ledger.json` | 32717 | `834b7139c373b9d950ab72ef825672f3bc18e7d4802542e72a8876d48a7e4858` |
| `lesson-release-ledger` | `catalog/lesson-release-ledger.json` | 20747 | `50d180065afdb4f7b452ac135aad9bbdef90b5f9540f9032f1a979b26bce434a` |
| `prototype-renderer-registry` | `packages/demos/prototype-registry.json` | 6425 | `3a00e38ecba316e82ea878fadc4d8e3282668a82fc2a8b899265fbfd2130b1f1` |
| `generated-renderer-registry` | `packages/demos/src/registry.generated.ts` | 7507 | `232eb19829733318f77c4951c367994e636a8980ef0ab3be4cb0e4985091bff7` |
| `g5-l4-source-scope` | `reports/g5-l4-source-scope-freeze.json` | 168839 | `a46a673014d1934415ed0a5327bfc1ada40e23ca3d5b6d3c58159141384b8d20` |
| `g5-l4-workspace-readiness` | `reports/g5-l4-workspace-readiness.json` | 56342 | `58091e48386d59d4fbbfa7662434d7052585c56e54983a760eda6a7059780ef4` |
| `g5-l4-m0-machine-packet` | `reports/g5-l4-m0-governance-readiness.json` | 12682 | `db541e650c0be50584e6bdfcd78dc4ac9f79057d328d2133e2bae7cc347c48ce` |
| `root-package` | `package.json` | 28393 | `dde5106f33a4c8c6772c79b44e0cc27707c5f604ff3914f72f6882f8bab39cb8` |
| `root-lockfile` | `package-lock.json` | 287827 | `4a4495fc540c1da4c38cab6e3428a156dda00644ff6b70e4c15ed14657947839` |

## Known boundaries

- The protected completion and Lesson release ledgers are deliberately preserved even when their currentness checks fail; this snapshot never refreshes them.
- A passing source, workspace, product, typecheck, or build command is current-JavaScript or machine-readiness evidence only.
- Failed diagnostics are recorded as failures and are not rewritten as passing receipts.
- The 590 root frames remain a structural root-timeline count, not full nested/interactive/audio coverage.
- No authorized original-runtime trace, authoritative baseline, paired full-frame RMSE result, audio listening decision, human review, or Owner decision is created here.
- Public command output is hash-only; raw stdout and stderr stay under the ignored private work root and outside Git and deployments.
- Input inode/hash and withheld worktree fingerprints were stable across the capture command window; any concurrent drift would have rejected this receipt.

All acceptance effects in this receipt are false. This is not an EvidenceReceiptV1 and cannot authorize strict completion or publication.
