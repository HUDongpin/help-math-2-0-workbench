# course-g05-l04-vb-011 Migration Brief

Created: 2026-07-26

## Objective

Describe the instructional purpose, target users, required languages, interactions, and exact stakeholder request.

## Identity And Classification

- Immutable `assetId` (`swf-<full SHA-256>`):
- Placement `animationId`:
- Collection, grade, lesson, section, and page:
- Raw title and reviewed display title:
- Knowledge point in English and Spanish:
- Controlled mathematics domain:
- Classification evidence, status, and confidence:
- Alias or variant relationship:

## Source Evidence

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.swf`
- Source owner/provenance:
- SHA-256 values:
- Missing source files:
- Evidence conflicts and resolution:

## Runtime Audit

- SWF signature/version:
- Stage width and height:
- Frame rate, frame count, duration:
- Background/transparency:
- ActionScript generation and scripts:
- Symbols, masks, morphs, filters, blend modes:
- Embedded fonts and exact strings:
- Audio/video:
- Audio cue IDs, language tracks, hashes, durations, and start frames (`audio-inventory.csv`):
- FlashVars, URLs, external assets, and legacy APIs:
- Stops, labels, buttons, Replay, and user interactions:
- Audit tools and exact versions:
- Confidence by audit area:

## Baseline

- Authoritative original runtime, version, host, and toolchain receipt:
- Requirement-level authority (`natural-trace`, `direct-seek`, or `frame-step`):
- Separate Ruffle forensic-reference route, version, and renderer:
- Native viewport and device scale factor:
- Capture method, named operator, and containment/capacity preflight:
- Required keyframes and why they matter:
- Complete coverage-v2 frame domains, requirements, traces, and entry-state hashes:
- Known emulator differences:

## Rendering Decision

- Selected renderer: React + SVG / Canvas + CreateJS / Canvas + PixiJS / other
- Why it fits this animation:
- Rejected alternatives and tradeoffs:
- Accessibility and localization approach:

## Timeline Specification

Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions. Keep the full frame list in `keyframes.csv`.

List every reachable scenario/branch, its deterministic seed, source-evidenced trace, and terminal/Replay state. Every explicit requirement must receive full one-indexed frame coverage; do not infer requirements from a global Cartesian product.

## Asset Strategy

Summarize extracted, converted, redrawn, and generated assets. Record each item in `asset-inventory.csv`, including source character/symbol IDs and transformation notes.

## Implementation Map

- Next.js route:
- React component:
- Pure timeline module:
- Unit test file:
- Ruffle reference route:
- Standalone package:
- Deterministic `?frameDomain=`, `?requirementId=`, `?trace=`, `?entryStateSha256=`, `?frame=`, `?scenario=`, `?lang=`, and `?seed=` capture modes:
- Mandatory matching `data-flash-*` identity attributes:

## Verification Evidence

- Unit tests:
- Production build:
- Native-size keyframe captures:
- Complete authoritative original-runtime and current-JS capture manifests:
- Full-frame coverage manifest, comparisons, and archive:
- Per-frame metrics files and checksums:
- RMSE and diff-image results:
- Replay and keyboard checks:
- Desktop/mobile overflow checks:
- Console and network checks:
- Human reviewer and review date for all keyframe/full-frame diffs:
- Audio listening-acceptance record, or source-bound not-required evidence:
- Immutable human and owner record descriptors:

## Exceptions And Decisions

List every unresolved mismatch, unavailable tool/source, accepted emulator difference, owner decision, and follow-up. Do not leave this section blank; write `None` when there are no exceptions.

## Completion

- Engineering reviewer:
- Review date:
- Owner review status:
- Owner accepted decision, reviewer/date/reason, and immutable record descriptor:
- Strict validator result:
- Completion-ledger binding:
- Atomic lesson-release status:

<!-- BEGIN MACHINE-OWNED M1 STATIC RECONCILIATION -->
## course-g05-l04-vb-011 M1 Static-Reconciled Migration Brief

> Canonical machine-only static specification. This is acceptance-neutral and does not establish original-runtime authority, renderer implementation, fidelity, human review, owner acceptance, strict completion, or publication.

## Release and source identity

- Release: `lesson-g05-l04-number-lines`; member **14/55**; role: `active-xml-referenced-page`; shard: `g05-l04-host-language`.
- Animation/asset: `course-g05-l04-vb-011` / `swf-2a388d578bb23fa2d4054ace2c3640956dd1f2ea0afd8e4e68a21b1537944cf8`.
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.swf`; 110879 bytes; SHA-256 `2a388d578bb23fa2d4054ace2c3640956dd1f2ea0afd8e4e68a21b1537944cf8`.
- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB11.fla`; 673792 bytes; SHA-256 `68db94b1a2c01f34fbd3affa29e144f48c207709bcd9070217e2d29d434e6cbe`.
- Source-scope role: `lesson-page`; source model: `paired-fla-and-shipped-swf`.
- Owner authorization: `catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json`; fingerprint `7469ec586d8cadb6c5459609e46e0010a8041a4e9fe226e82912bd339d9f5afb`; authority is limited to machine-only M1 static work.

## Reconciled static facts

- Stage: **800 × 600**; FPS: **12**; root frames: **10**; duration: **833.3333333333334 ms**.
- SWF signature/version: **CWS/6**; ActionScript generation: **AS1/2**; background: **#b8d8f7**.
- Tool versions adopted exactly from the machine audit: FFDec **JPEXS Free Flash Decompiler v.26.2.1**; swfmill **swfmill 0.3.6**.
- Static exported scripts: **35**. This is not a complete reachable script inventory.
- Static dependency API candidates: **0** APIs / **0** occurrences. No endpoint was contacted or executed.
- Canonical machine inventories: `audit/script-inventory.json` and `audit/dependency-inventory.json`.

## Audio fail-closed disposition

- Canonical audio-inventory data rows: **12**.
- Manifest audio requirement raised from false to true in this reconciliation: **false**.
- Spoken language/content, cue reachability, timing, synchronization, loop/stop behavior, and listening acceptance remain **unresolved**. Languages and cues were not inferred.

## Decisions intentionally unresolved

- Renderer selection, implementation route/component/module/package, rejected alternatives, and implementation authorization: **unresolved / not authorized**.
- Instructional behavior, branches, terminal state, Replay/reset, random behavior, reachable scenarios, natural traces, and host entry: **unresolved**.
- Nested-frame placement/entry state, keyframes, requirement coverage, and full-frame baseline: **unresolved; canonical keyframes and coverage were not changed**.
- Runtime reachability, dependency security disposition, host dependency closure, and reviewed replacement APIs: **unresolved**.
- Accessibility, localization, visual comparison, audio listening, human review, owner fidelity acceptance, strict completion, and publication: **false or pending**.

## Machine-only boundary

- Runtime sessions executed: **0**.
- GUI applications launched: **0**.
- Legacy endpoints executed: **0**.
- No renderer, asset inventory, keyframe, coverage, scenario, or frame-domain artifact was produced or promoted by this reconciliation.
<!-- END MACHINE-OWNED M1 STATIC RECONCILIATION -->
