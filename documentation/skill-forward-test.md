# Flash-to-JavaScript Skill Forward Test

Current test date: 2026-07-26 (Asia/Shanghai)

The 2026-07-21 test is superseded. It treated a Ruffle baseline and keyframe-only evidence as the correct path; the current project contract treats Ruffle as a forensic reference and requires requirement-level original-runtime and full-frame evidence.

## Method

A fresh, minimal-context Codex agent received the canonical `$flash-to-js` skill and a read-only request to begin a source-faithful audit of the existing `Conversion_1_3` FLA/SWF. It was not given the expected diagnosis and was asked to report actual facts, first actions, evidence routing, and the conditions for `faithful`, `strict complete`, and lesson release. It made no file changes.

## Transition-Window Test

During the first run, the agent correctly stopped when `npm run verify:workbench` observed an in-progress validator contract transition: the workbench required validator 3.1.0 while the file still reported 3.0.0. It did not scaffold, alter evidence, rebuild ledgers, or change status to hide the failure. This was a useful fail-closed result, not the final stable-state pass.

The run independently verified:

- Canonical `animationId` `formula-elementary-conversion-01-03` and immutable SWF-hash `assetId`.
- Preserved paired FLA/SWF, a byte-identical alternate placement, and the rule that placement identity must not be collapsed solely by hash.
- Shipped SWF metadata: 780 × 379, 12 FPS, 170 root frames, SWF 6, and AS1/2.
- Existing English and Spanish current-JS captures contain 170 native-size frames each and are explicitly non-authoritative.
- Both coverage-v2 requirements remain blocked because original-runtime authority, baseline manifests, and per-frame metrics are unresolved.
- Required English and Spanish audio has source-bound structural evidence, while original-host listening, synchronization, and Replay acceptance remain pending.
- Strict human visual review and owner acceptance remain pending; the earlier current-JS approval has no strict effect.
- Completion and lesson-release state remain closed. This formula placement is not a member of the currently declared G4 L3 atomic lesson release.

## Evidence Path Selected By The Agent

1. Preserve the FLA + shipped SWF dual-source path: FLA for authoring structure; SWF for shipped behavior.
2. Keep Ruffle as a versioned forensic reference only.
3. Use authorized original-runtime frame-accurate capture for linear root visual requirements.
4. Use a source-evidenced natural original-host trace for host-controlled Spanish state, Replay/button behavior, and audio.
5. Pair complete original-runtime and current-JS manifests by requirement, domain, trace, entry state, scenario, language, and seed; then compute and inspect every full-frame metric and diff.
6. Complete audio listening acceptance, immutable human visual review, and a separate accepted owner record before strict validation.
7. Admit the exact current manifest to the strict completion ledger before considering any separate lesson release transaction.

## Required Boundary Check

The agent kept all nine dimensions separate:

| Dimension | Current interpretation |
|---|---|
| forensic | Ruffle/reference playback; observation only |
| current-JS | Deterministic implementation candidate; no authority or acceptance effect |
| original-runtime | Requirement-specific authorized baseline/trace; unresolved for this migration |
| full-frame | Complete paired manifests, hashes, metrics, and visual review; still incomplete |
| audio | Independent structural plus named-human original-runtime listening gate; pending |
| human visual | Immutable all-diff review, separate from current-JS approval; pending |
| owner | Separate immutable accepted decision; pending |
| strict complete | Validator 3.1.0 plus current completion-ledger admission; not satisfied |
| lesson release | Separate atomic placement-set transaction after strict completion; not satisfied |

## Stable-State Retest

After validator 3.1.0 and the derived ledgers were refreshed, a second minimal-context agent repeated the read-only task. A follow-up run of `npm run verify:workbench` exited `0` and reported:

- Migration template passes validator 3.1.0 draft validation.
- Strict completion ledger is current.
- Atomic lesson-release ledger is current.
- All 31 required workbench artifacts are present.

The agent again kept forensic, current-JS, original-runtime, full-frame, audio, human visual, owner, strict complete, and lesson release states separate. It correctly concluded that `Conversion_1_3` remains a preserved/current-JS candidate and is not faithful, strict complete, or publishable.

The first stable-state response exposed one remaining routing defect: after identifying the canonical placement, it proposed scaffolding a second workspace named `Conversion_1_3`. The skill was tightened to require lookup and reuse of an existing canonical workspace before scaffolding.

A third fresh, focused retest then correctly selected:

- Canonical `animationId`: `formula-elementary-conversion-01-03`.
- Canonical workspace: `migrations/formula-elementary-conversion-01-03/`.
- First action: reuse that workspace and run the draft validator; never scaffold a second filename-alias workspace.
- Evidence classification: Ruffle forensic-only, current-JS non-authoritative candidate, and requirement/trace-bound authorized original-runtime evidence as the only possible strict baseline authority.

## Conclusion

Pass. The updated skill routes a fresh agent to the canonical workspace, fails closed on unhealthy tooling, preserves all nine acceptance/release boundaries, and refuses to call the current `Conversion_1_3` work faithful, strict complete, or publishable.
