# G4 L10 candidate-to-product bridge calibration v1

Observed 2026-08-21, Asia/Shanghai. Baseline Git HEAD: `71485baa601fe600e8f63c88fb0139492a4ad31e`.

## Outcome

**CONDITIONAL GO — private product-bridge calibration only.** The frozen three-page slice moved from existing preserved candidates to maintained modules, an official private registry, an exact 46-position page-only descriptor, the modern My Lesson host, Replay/interaction/audio lifecycle, and desktop/mobile browser QA. No new extraction workspace or duplicate implementation was created.

This is not release acceptance. Original-runtime fidelity, behavior parity acceptance, visual fidelity, audio listening acceptance, human review, Owner acceptance, strict completion, release eligibility, and publication all remain false.

## Measured yield

| Measure | Result | Meaning |
| --- | ---: | --- |
| Frozen bridge attempts | 3/3 = 100% | All three deliberately selected calibration pages reached private registration and the modern host. |
| Audited candidate pool converted | 3/24 = 12.5% | Only three of the 24 audited source-static candidates were attempted; this is not a 24-page yield claim. |
| G4 L10 page-only coverage | 3/46 = 6.52% | The exact descriptor has 46 active page positions, three registered and 43 explicitly unavailable. |
| Public course release registrations | 0 | The calibration route is local-only and absent in production. |
| New workspaces | 0 | All work reused the existing preserved workspaces and generated Canvas candidates. |

The immutable pre-implementation slice is bound by `catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v1.json`, SHA-256 `c966f850ef4c6706b56904834c39922ddff2c8e7c4c9e51df80bc326e2f7e950`.

## Three calibrated lanes

### Behavior-heavy — `course-g04-l10-ir-001`

- Source order: lesson page 1/46, Introduction page 1; `sprite-31`, 136 frames.
- The source `random(2)` branch is represented by two exact nested SoundStream assets. Each is 11,337 ms; SHA-256 values are `b731347f2cd4ced88f5f86b21a1339a882821c42def7212b7b8aa15d72f31310` and `2112a8b5764792dd64ab2955e55e02b8850e2a677efd8f71e34f91fc608604ad`.
- Replay now advances an explicitly declared two-seed cycle. Browser evidence reached both `seed-modulo-2-remainder-0` and `seed-modulo-2-remainder-1` and requested both audio assets.
- The modern Focus host keeps Narration actionable after an autoplay refusal; play/stop and Replay are connected to the host lifecycle.
- Spoken language/content, original random-outcome observation, parent/child audio tick phase, original-runtime behavior, and audio acceptance remain open.

### Interactive-understood — `course-g04-l10-vb-003`

- Source order: lesson page 7/46, Important Words page 2; `sprite-120`, 203 frames.
- The three reachable release-handler intents are exactly Unit of measurement, Quantity, and Length.
- The maintained module emits a typed glossary request. The host resolves exact English and Spanish definitions from the hash-bound Grade 4 Key Terms XML in memory; it never executes the legacy `DoHyperLinks` global or endpoint.
- Opening the glossary pauses the animation; closing resumes it. English desktop and Spanish mobile interactions passed.
- Browser/descriptor auditing corrected an initial section-page assumption from 3 to 2. A regression test now compares the frozen selection to the source-derived descriptor order.

### Low — `course-g04-l10-fq-001`

- Source order: lesson page 44/46, Final Quiz page 1; `sprite-50`, 52 frames.
- The linear source-static candidate reaches its end frame and Replay persists through the product session.
- The exported FScrollBar library is not claimed as product behavior because the root placement graph does not prove it reachable.
- No page audio is claimed; authoritative silence/host-audio disposition remains open.

## Product bridge

The private registry is `packages/demos/private-current-js-registry.json`. All three entries have maturity `private-current-js`, scope `private-engineering`, and calibration ID `g4-l10-candidate-to-product-v1`.

The page-only descriptor is `apps/web/lib/g4-l10-product-bridge-descriptor.ts`. It derives all 46 positions from current canonical G4 course coverage, fixes `courseShellCount` at 0, registers only source ordinals 1, 7, and 44, and leaves the other 43 positions unavailable even if another global registry changes later.

The reviewer route is `apps/web/app/[locale]/migration-status/g4-l10-product-bridge/page.tsx`. It is exactly allowlisted for local development and unconditionally returns `notFound()` in production. It does not enter a public course or release registry.

## Browser QA

Desktop English passed all three pages. IR001 reached frame 136 and exercised audio plus Replay; VB003 opened the exact glossary definition and paused/resumed correctly; FQ001 reached frame 52 and replayed.

Mobile Spanish at 390×844 also passed all three pages. The document remained within the viewport (`documentElement.scrollWidth=375`, `window.innerWidth=390`), the evidence boundary was reflowed vertically, glossary content remained operable, Replay state persisted, and both IR001 random audio branches were reachable.

Evidence screenshots:

- `output/playwright/g4-l10-product-bridge/desktop-en-ir001.png`
- `output/playwright/g4-l10-product-bridge/desktop-en-vb003-glossary.png`
- `output/playwright/g4-l10-product-bridge/desktop-en-fq001.png`
- `output/playwright/g4-l10-product-bridge/mobile-es-vb003-glossary.png`
- `output/playwright/g4-l10-product-bridge/mobile-es-ir001-seed1.png`

There were zero product-asset request failures. The remaining browser console messages come from the development Clerk provider: a child-key warning in `__experimental_CheckoutProvider` and the expected development-key warning. They are recorded, not promoted into G4 L10 acceptance.

## Verification

- Demos: 634 passed, 0 failed.
- Web: 369 passed, 0 failed.
- Demos and web TypeScript checks: passed.
- Private registry regeneration check: passed.
- IR001 audio extraction check: two streams, 45,136 bytes, passed.
- Production route guard: passed with `NEXT_HTTP_ERROR_FALLBACK;404`.
- Git diff whitespace/error check: passed.

Two global currentness gates remain fail-closed, as they did at baseline:

- `npm run verify:workbench`: `catalog/completion-ledger.json` is stale.
- `npm run verify:sources`: 99 unexpected source files, beginning in Grade 5 Lesson 4 FQ English-audio paths.

These are real global blockers and must not be erased by the G4 L10 result. They are outside the three selected G4 L10 pages.

## Factory decision

The calibration proves that the existing candidate-to-private-product bridge is usable: 3/3 attempted pages crossed the bridge with no duplicate workspace. That supports a controlled next G4 L10 batch.

It does not support automatically registering the remaining 21 candidates. The next batch should be frozen separately, preserve exact source order and lane classification, and continue to exclude any interactive or behavior-heavy page from automation until its reachable source behavior and audio disposition are individually understood.
