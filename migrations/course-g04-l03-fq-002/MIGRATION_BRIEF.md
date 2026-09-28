# course-g04-l03-fq-002 Migration Brief

Created: 2026-07-24

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.swf`
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

- Authoritative runtime or renderer:
- Ruffle/Animate/browser version:
- Native viewport and device scale factor:
- Capture method:
- Required keyframes and why they matter:
- Known emulator differences:

## Rendering Decision

- Selected renderer: React + SVG / Canvas + CreateJS / Canvas + PixiJS / other
- Why it fits this animation:
- Rejected alternatives and tradeoffs:
- Accessibility and localization approach:

## Timeline Specification

Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions. Keep the full frame list in `keyframes.csv`.

List every reachable scenario/branch, its deterministic seed, and its terminal/Replay state. Every scenario and language must receive full one-indexed frame coverage.

## Asset Strategy

Summarize extracted, converted, redrawn, and generated assets. Record each item in `asset-inventory.csv`, including source character/symbol IDs and transformation notes.

## Implementation Map

- Next.js route:
- React component:
- Pure timeline module:
- Unit test file:
- Ruffle reference route:
- Standalone package:
- Deterministic `?frame=` capture mode:
- Deterministic `?scenario=`, `?lang=`, and `?seed=` modes:
- Mandatory stage attribute `data-flash-frame`:

## Verification Evidence

- Unit tests:
- Production build:
- Native-size keyframe captures:
- Full-frame coverage manifest and archive:
- Per-frame metrics files and checksums:
- RMSE and diff-image results:
- Replay and keyboard checks:
- Desktop/mobile overflow checks:
- Console and network checks:
- Human reviewer and review date for all keyframe/full-frame diffs:

## Exceptions And Decisions

List every unresolved mismatch, unavailable tool/source, accepted emulator difference, owner decision, and follow-up. Do not leave this section blank; write `None` when there are no exceptions.

## Completion

- Engineering reviewer:
- Review date:
- Owner review status:
- Owner decision, reviewer/date, or explicit not-required reason:
- Strict validator result:


## 2026-09-08：现代产品复核

10题抽取与源判题不变；完整数轴、具名图形、答完后完成、8/10与0/10、逐题复习、暂停及Replay已实际验证。 题目／选项可选朗读仍未接通：250个所需源路径中142个尚未进入规范源目录，已准备补源计划，尚未执行入库。工程状态保持部分完成。

本轮为源锁定的有限维护／高级手工状态机与语义SVG实现，未修改生成画布。详情和哈希绑定见 [Final Quiz复核](../../work/g4-l3-modern-product-review/20260908-final-quiz/REVIEW.md)。未新增注册、真人听审、Owner批准、严格完成、整课GO或发布。


## 2026-09-08: approved source-audio intake and modern reading

The exact 142-path intake was approved in the current task and applied through verified source/catalog sibling swaps with retained recovery trees. The shared Final Quiz group now contains all 250 source question/option recordings. `scripts/materialize-g4-l3-fq-audio.mjs` reproducibly packages byte-exact copies, the typed asset index and this workspace's inventories. The maintained functional renderer selects by original question ID, uses the existing typed audio host, and stops owned playback on navigation, answer, language change, Replay and unmount; My Lesson owns pause/resume and volume. English visual source identity is explicit in both product-locale entry points, with original English/Spanish reading available.

Q8 keeps original letter-only A/B/C/D recordings when displaying the Owner-directed TS007 visual in the 25-question quiz; the prompt remains negative two. Local ASR is machine evidence only. Current-JS behavior, responsive/keyboard use and source/public hash checks passed; original-runtime, named-human audio/visual review, Owner product acceptance, strict completion and publication remain independent.

See `work/g4-l3-modern-product-review/20260908-final-quiz-audio-implementation/REVIEW.md` and `catalog/source-promotions/g4-l3-fq-audio-2026-09-08-applied.json`. Historical source-static and rejected/intermediate evidence above remains preserved.
