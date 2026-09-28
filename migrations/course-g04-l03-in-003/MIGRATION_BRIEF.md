# course-g04-l03-in-003 Migration Brief

## 2026-09-08 现代数轴页面复核

- Placement: `course-g04-l03-in-003`，G4 L3 Learn It。
- 本轮复杂度：`low`；路线：复用编译器提取的画面 + 维护的现代播放配置。复用已有源审计、注册和现代 My Lesson 宿主，按已观察到的问题作有界修复，无批量生成。
- 讲解完成后停在第 472 帧，由 Replay 重播；减少动画时直接呈现完整比较图，补充可读的方向与大小比较说明，并保持比较式不跨行断开。
- 当前源哈希、实现与浏览器证据见 [本轮结果](../../work/g4-l3-modern-product-review/20260908-learn-it-number-line/REVIEW.md) 和同目录 `product-review-receipt.json`。
- 未修改原始 FLA/SWF 或生成的 Canvas 文件；本轮未新增原 Flash 实跑、听审、人审、Owner、严格完成或发布结论。

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

- FLA: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.fla`
- SWF: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN03.swf`
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
