# Suggestions on the UI of HELP MATH 2.0

**Date:** 2026-08-08
**Author:** Claude (Opus 5), working session on branch `codex/g4-l3-fidelity-finish`
**Scope:** The whole-lesson player shell, its widescreen layout, and the integration of Nova Tutor
**Status:** Implemented for the Grade 4 Lesson 3 pilot on 2026-08-08. Phases 0–7 are landed except
where noted in §13. Owner decision 1 accepted and recorded in `AGENTS.md`; decisions 2–5 remain
open. Grade 5 Lesson 4 is the replication gate (§6.3) and has **not** been switched on.

Interactive prototype: <https://claude.ai/code/artifact/2e0e81e3-78eb-485f-9bd0-43881bf9bf25>

---

## 1. Purpose

The current lesson shell renders the authored Flash stage at its native 800 × 600 and layers the
original chrome artwork over it, while also presenting a second, modern control rail beside it. On a
widescreen display this is worse than either approach alone: the lesson occupies a sixth of the
screen, a third of the stage is a picture of a 2005 toolbar, and every tool exists twice.

This document sets out a phased plan to replace that with a single widescreen player, and to place
Nova Tutor inside it in three mode-appropriate positions.

## 2. Evidence base

Everything below was measured from this repository on 2026-08-08, not estimated.

| Fact | Value | Source |
| --- | --- | --- |
| Authored stage | 800 × 600 | `apps/web/lib/g4-l3-whole-lesson-player-descriptor.ts:119` |
| Chrome header band | 109 px | same file, `visualSkin.header.height` |
| Chrome footer band | 76 px | same file, `visualSkin.footer.height` |
| **Actual teaching plane** | **800 × 415 (1.928 : 1)** | derived; wider than 16 : 9 |
| Stage given to chrome artwork | 31 % | (109 + 76) / 600 |
| Assets authored at 800 × 600 | 1,560 | `catalog/assets.json` |
| Desktop grid | `800px minmax(320px, 1fr)` | `apps/web/app/globals.css:6550` (again at `:6860` for ≥1600px) |
| Lesson share of a 1920 × 1080 display | 16 % | (800 × 415) / (1920 × 1080) |
| Controls at equal weight in the modern rail | 13 | `legacy-responsive-lesson-shell.tsx`, `.lesson-shell2__modern-toolbar` |
| Ways to press Next / Previous | 2 / 3 | legacy media pod, learning actions, legacy header |
| Canvas backing store | fixed 800 × 600 @ 1× | `loaded-swf-host-canvas.tsx:258`, guard below |
| G4 L3 structure | 39 pages, 8 sections | `apps/web/lib/g4-l3-lesson-navigation.ts` |
| Lessons on the descriptor path | G4 L3, G5 L4 | `apps/web/lib/whole-lesson-course-registry.ts` |

The chrome artwork (`frame-0049.png`) is fully opaque across both bands. Nothing authored beneath
them is visible today, so removing them is visually lossless by construction — this is the fact that
makes Phase 2 safe.

## 3. The one blocking constraint

`scripts/build-safe-ffdec-canvas-adapter.mjs:1516` emits this into every generated page renderer:

```js
if (targetCanvas.width !== 800 || targetCanvas.height !== 600) {
    throw new Error("targetCanvas must be exactly 800x600");
}
```

Two consequences:

1. The stage cannot be widened, because a wider CSS box would only stretch an 800 px backing store.
2. The art is already soft on every Retina display — 800 backing px over 800 CSS px is 1×, i.e. half
   native resolution on a 2× panel.

The renderer is nonetheless *structurally* scale-ready. Its 326 offscreen layers are created as
`createCanvas(canvas.width, canvas.height)`, and drawing is transformed path fills. Only a small
number of genuinely embedded bitmaps per page (1–18) are resolution-bound.

**Correction, 2026-08-08.** This was overstated for the pilot. Of the 42 G4 L3 page modules in
`packages/demos/src/modules/`, **39 are React/SVG at `viewBox="0 0 800 600"`** and therefore
resolution-independent — widening the plane scales them perfectly. Only three
(`course-g04-l03-in-003`, `-in-009`, `-rw-003`) go through the loaded-SWF canvas adapter and are
bound by the guard. Phase 1 is therefore **not blocking for Grade 4 Lesson 3**; it is a bounded
quality limitation on 3 of 39 active pages, which will sharpen when the guard is parameterised. It
remains blocking for any lesson whose pages are predominantly canvas-adapter based, which must be
checked per lesson before rollout.

## 4. Governance change — amended 2026-08-08

`AGENTS.md` → *Rendering Decisions* previously read:

> Preserve the native Flash coordinate system with a fixed SVG `viewBox` or fixed Canvas backing
> dimensions and a responsive aspect-ratio wrapper.

"Fixed Canvas backing dimensions" is the clause the 800 × 600 guard implements, so Phase 1 could not
proceed under it. The clause now permits a backing store of `stage × k` for an integer `k`, with the
scale applied once ahead of the root transform. The coordinate system is preserved exactly — every
drawing call still runs in 800 × 600 authored units. What changes is device resolution.

Recorded in three places:

| Document | Change |
| --- | --- |
| `AGENTS.md` → *Rendering Decisions* | Amended clause plus a dated subsection stating what the amendment permits, its required condition, and what it does **not** authorize |
| `AGENTS.md` → *Fidelity Standard* | The k = 1 byte-parity gate added as an acceptance criterion |
| `skills/flash-to-js/references/fidelity-validation.md` | Capture protocol: a k > 1 capture is not a like-for-like comparison and must be downsampled to native before RMSE, with the resampling filter stated |

Phase 2 additionally changes what a reviewer *sees*: the host chrome stops being rendered. That is a
presentation decision, not a content-fidelity decision, but it is visible and therefore needs to be
declared rather than assumed.

> **Owner decision 1 — ACCEPTED 2026-08-08.** Amend the *Rendering Decisions* clause to permit an
> integer-scaled backing store, on the condition that k = 1 output is proven byte-identical to
> today. Recorded in `AGENTS.md` → *Rendering Decisions* → *Integer-Scaled Canvas Backing Store —
> 2026-08-08*, with the k = 1 parity gate written into the *Fidelity Standard*. **Phase 1 is
> unblocked.**
>
> **Owner decision 2.** Accept `modern-wide` as a declared, non-default host presentation for
> current-JavaScript candidates, distinct from the `legacy-composite` skin, with the legacy skin
> retained and selectable.

Neither decision touches page-content fidelity, audio acceptance, original-runtime acceptance, or
release admission. Those gates remain exactly where they are.

---

## 5. Phase plan

Phases are ordered by dependency. Each ships independently and is visible to a reviewer.

### Phase 0 — Baseline and guardrails

**Goal.** Make every later phase provable rather than arguable.

**Work.**
- Capture keyframes for all 39 G4 L3 pages and the G5 L4 set at the current renderer, and store the
  hashes as the regression baseline (`npm run capture:keyframes`).
- Add a Playwright measurement spec that records, per breakpoint, the rendered plane box, the
  viewport share, and whether any control clips. Extend
  `apps/web/e2e/legacy-lesson-shell-responsive.spec.ts` rather than starting a new file.
- Record the current tab order through the shell as a fixture. The duplicate-rail removal in Phase 4
  must be shown to *shorten* it, not silently reorder it.

**Acceptance.** Baseline artefacts committed; the new spec passes against today's build unchanged.

**Rollback.** N/A — additive.

---

### Phase 1 — Scale-aware page renderer *(blocking)*

**Goal.** Let the authored plane be drawn at device resolution.

**Files.**
- `scripts/build-safe-ffdec-canvas-adapter.mjs` — the generator template around lines 1511–1545
- `scripts/build-safe-ffdec-canvas-adapter.test.mjs`
- `apps/web/components/loaded-swf-host-canvas.tsx` — canvas sizing at line 258 ff.
- `apps/web/tests/loaded-swf-host-canvas.test.ts`
- regenerated `canvas-renderer.js` for every page under
  `apps/web/public/flash-assets/courses/`

**Work.**
1. Replace the exact-size guard with a scale check: accept `width === stage.width * k` and
   `height === stage.height * k` for integer `k` in a declared range (1–3 covers 3× panels), and
   reject everything else. Keep the error message explicit about what was expected.
2. Apply `ctx.setTransform(k, 0, 0, k, 0, 0)` before the existing root
   `ctx.transform(1, 0, 0, 1, offsetX, offsetY)`, so authored coordinates are untouched.
3. Scale the pixel-denominated values in the generated `Filters` block — blur radii in particular —
   by `k`. This is the part most likely to produce a subtle diff, and is the reason for the k = 1
   parity gate below.
4. In `loaded-swf-host-canvas.tsx`, set the backing store to `authored × dpr` (clamped to the
   declared range) while keeping the CSS box responsive, and pass `k` to `render()`.
5. Keep every `data-flash-*` identity attribute unchanged. The *Timeline Contract* requires the
   stage to keep reporting matching identity; scaling must not touch frame, domain, scenario, or
   seed.

**Acceptance.**
- **k = 1 parity gate:** regenerated adapters render byte-identical output to the Phase 0 baseline
  for every page. Any diff blocks the phase.
- k = 2 output passes the *Fidelity Standard* thresholds against a k = 1 reference upsampled for
  comparison: static keyframes RMSE ≤ 0.05, transitions ≤ 0.08. Deviations get a written explanation
  per that standard, not a threshold relaxation.
- Embedded-bitmap pages are listed explicitly, with their bitmap count, as known soft spots. These
  do not improve with `k` and should not be claimed to.
- `npm test`, `npm run test:site`, `npm run typecheck`, `npm run build` pass.

**Risk.** The filter-radius scaling is the real hazard. Mitigation is the k = 1 parity gate, which
catches any accidental change to the unscaled path.

**Rollback.** The generator is deterministic; regenerate at k = 1 only and the previous artefacts
return.

---

### Phase 2 — `modern-wide` visual skin

**Goal.** Stop spending 31 % of the stage on a picture of a toolbar.

**Files.**
- `apps/web/lib/whole-lesson-player-descriptor.ts:343` — `kind: 'legacy-composite'`
- `apps/web/lib/g4-l3-whole-lesson-player-descriptor.ts`
- `apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts`
- `apps/web/components/descriptor-driven-whole-lesson-player.tsx`
- `apps/web/tests/g4-l3-whole-lesson-player-descriptor.test.ts` and the G5 L4 equivalent

**Work.**
1. Widen the `visualSkin.kind` literal to a union: `'legacy-composite' | 'modern-wide'`. The type is
   already discriminated, so this is an extension rather than a redesign.
2. `modern-wide` declares the content plane as `800 × 415` at authored offset `y = 109`, carries no
   `chromeAsset`, and keeps every provenance field (`sourceSwfSha256`, `sourceAnimationId`,
   evidence kind) so the audit trail is unchanged.
3. Move the lesson title out of the painted band and into the page header, keeping the existing
   `usesEnglishFallback` handling — a Spanish reader must still get a correctly `lang`-tagged
   English title when the source has none, exactly as today.
4. Put the skin behind a flag, default off, enabled first for G4 L3 only.

**Acceptance.**
- A test asserts that the cropped region of the chrome asset is fully opaque, so the "lossless crop"
  claim is enforced in CI rather than trusted.
- Provenance fields on `modern-wide` are asserted equal to those on `legacy-composite`.
- Both skins render; switching between them changes no page-content assertion.
- **G5 L4 descriptor-only gate — blocking.** Enabling `modern-wide` for Grade 5 Lesson 4 must change
  **only** `apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts`. If any file outside that
  descriptor requires editing, the shared shell is not yet generic, rollout to further lessons does
  not proceed, and the leaked coupling is fixed before the phase closes. See §6.3.

**Rollback.** Flag off.

---

### Phase 3 — Invert the sizing policy

**Goal.** Let the plane grow into the display instead of only shrinking away from it.

**Files.**
- `apps/web/lib/legacy-lesson-layout.ts`
- `apps/web/tests/legacy-lesson-layout.test.ts`
- `apps/web/app/globals.css`

**Work.**
1. The doc comment at `legacy-lesson-layout.ts:39` states the current doctrine outright:

   > Wide and ordinary native layouts never use remaining viewport height to shrink the authored
   > stage.

   Replace the policy with `min(available width, available height × 800/415)` so both axes bind.
   The prototype implements this as `width: min(100%, calc(100cqh * 800 / 415))` on a sized
   container, which is the smallest correct expression of it.
2. Rename the module to reflect that it is no longer legacy-only, or add a `modern-wide` branch
   inside it — a judgement call best made against the diff.
3. Replace the fixed `800px` grid column with a fluid stage column plus an optional support column.

**Acceptance.**
- Unit tests for the new policy at: 1920 × 1080, 1440 × 900, 1366 × 768, 1280 × 800, tablet
  portrait, and the existing compact-landscape case, which must keep working.
- The *Fidelity Standard* clause "no label, control, or artwork clips or overflows at native,
  desktop, and mobile sizes" is verified by the Phase 0 spec at every one of those sizes.
- Plane aspect measured at 1.928 ± 0.005 in every state.

**Expected result at 1920 × 1080:** 1709 × 887, which is 4.6× today's teaching area and 73 % of the
display, with 40 px of vertical slack.

---

### Phase 4 — One control system

**Goal.** Remove the duplicate rail and rank what remains.

**Files.**
- `apps/web/components/legacy-responsive-lesson-shell.tsx`
- `apps/web/app/globals.css`
- `apps/web/tests/legacy-support-tools.test.ts`, `playback-completion.test.ts`

**Work.**
1. Retire the invisible hit rectangles layered over the chrome artwork
   (`.lesson-shell2__legacy-hit`, `.lesson-shell2__legacy-tool`, `.lesson-shell2__media-hits`) when
   the skin is `modern-wide`. Under `legacy-composite` they stay, so nothing regresses for the
   existing skin.
2. Collapse the modern toolbar and the learning-actions row into a single bar with three tiers:

   | Tier | Placement | Controls |
   | --- | --- | --- |
   | Primary | Always visible, in the bar | Play / Pause, Next, Previous, progress |
   | Secondary | Always visible, grouped right | Replay, narration, volume, support |
   | Tertiary | Inside the support panel | Key terms, calculator, course map, help, EN / ES |

3. If the classic frame has stakeholder value, keep it as an opt-in skin whose buttons are
   decoration with `pointer-events: none`. Never two live control systems at once.

**Acceptance.**
- Exactly one accessible Next and one accessible Previous in the tab order (asserted, not observed).
- The Phase 0 tab-order fixture shows a strictly shorter path with no reordering of what remains.
- Every control keeps its existing `aria-*` contract; the axe pass in `test:e2e` stays clean.

---

### Phase 5 — A support region worth having

**Goal.** Turn the widescreen gutter into a second teaching surface.

**Files.**
- `apps/web/components/legacy-responsive-lesson-shell.tsx`
- `apps/web/components/g4-l3-readable-view.tsx`, `apps/web/lib/g4-l3-readable-view.ts`
- `apps/web/lib/g4-l3-lesson-navigation.ts` (read-only; source of section and page labels)

**Work.**
1. Replace the map and tool panels with one tabbed region: **Nova · Read it · Words**. One region,
   never two competing panels.
2. Generalise the readable view. `g4-l3-readable-view.ts` already proves the pattern with real
   transcripts on one page; the spec shape (crops, transcripts, provenance hashes) is reusable.
   Promote it to a per-page descriptor field so it stops being G4-L3-only.
3. Populate **Words** from the lesson's own `VB` section — for G4 L3 that is Number Line, Positive
   Numbers, Negative Numbers, Zero, Pattern, with the Spanish labels the catalog already holds.

**Acceptance.** Readable-view content is bound to page provenance hashes as it is today; no page
gains invented content.

---

### Phase 6 — Nova Tutor

**Goal.** Put the tutor in the player without giving back the space Phases 1–3 won.

#### 6.1 What the site already tells us

`mais.ac` keeps Nova Tutor behind sign-in, but two separate stylesheets on the public pages hide
`button[aria-label*="AI Tutor"]` — once on the home hero, once inside
`[data-practice-adventure-arena]`. MAIS already treats the tutor as a persistent launcher that is
**suppressed in immersive surfaces**. A lesson player is such a surface, so the same instinct
applies: no floating launcher over the lesson plane.

#### 6.2 The three placements

| Mode | Placement | Rationale |
| --- | --- | --- |
| **Focus** | 290 px column that slides in; the aspect-locked plane rescales to 1419 × 736 | Never covers the maths. Shrinking beats occluding. |
| **Study** | First tab in the existing support region | The drawer already holds reading and vocabulary; the tutor joins them rather than adding a window. |
| **Classroom** | Full-width band under the plane: one large push-to-talk, answer at ~27 px, no scrollback | Nobody types at a whiteboard, and a 290 px column is unreadable from the back of a room. |

#### 6.3 Four interaction rules

1. **Nova speaking pauses the lesson speaking.** Opening the tutor pauses narration and says so on
   the plane; closing resumes at the same frame. Two voices at once is unusable, and worse for the
   Spanish learner this course serves. This rule is not optional.
2. **Context is attached, never typed.** Nova opens holding `animationId`, `sectionCode`,
   `globalPageOrdinal`, both title languages, and a frame snapshot — surfaced as a visible
   "Nova can see" chip so the data flow is legible to a school buyer.
3. **Voice outranks text.** The microphone is the largest control in all three placements; typing is
   the fallback. A Grade 4 pupil types slower than they think.
4. **Photos flow both ways.** The camera sends the child's paper up; the player sends the current
   frame down. The second direction is free once Phase 1 lands, and is what lets Nova say "look at
   where you put Ricky" instead of asking what the question was.

#### 6.4 What HELP Math must supply

| Need | Already exists | Work |
| --- | --- | --- |
| Page context object | `g4-l3-lesson-navigation.ts` page records | Expose as a typed `TutorPageContext`; no new data model |
| Transport control | `onPausedChange`, narration state in the shell | Pass down as props; borrow on open, return on close |
| Frame snapshot | Real canvas in `loaded-swf-host-canvas.tsx` | `toDataURL()`; do it **after** Phase 1 so the image is the sharp one |
| Single launcher | — | "Ask Nova" in the control bar; Classroom replaces it with the band |

#### 6.5 Naming and visual identity

Nova gets a **word**, not a sparkle glyph. A child will not read an icon as "someone who will help
me". Its colour is sampled from the source art — `#413DB0` indigo with `#2FA3D7` cyan, both from the
footer media pod — so it reads as distinct from amber (primary action), royal (structure) and gold
(progress) without reaching for generic AI purple.

#### 6.6 Safeguards that must be settled before shipping

These are flagged, not resolved. They need product and legal input, not engineering judgement.

- **Child data.** Voice and photographs from K-5 pupils sent to an AI service engages COPPA, and
  FERPA where the district is the contracting party. Retention limits, a no-training-on-student-data
  commitment, and school-consent contracting all need to be settled before a public release. I am
  not qualified to determine what is sufficient here; this needs counsel.
- **Content safety.** Off-topic and unsafe-input handling, plus a logged escalation path a teacher
  can review.
- **Teacher controls.** Nova must be disableable per class and per session, and is never the default
  in Classroom mode.
- **Spanish.** Nova generating Spanish is *tutoring output*, not source content. The codebase is
  disciplined about never inventing translations — `missing-page-level-spanish-title` exists
  precisely for that. Nova's Spanish must be visually distinguished from authored text and never
  written back into the catalog.
- **Answer leakage.** On `TI`, `TS` and `FQ` pages the tutor must scaffold rather than answer.
  Section code is already in the context object, so this is enforceable at the prompt boundary.

**Acceptance.** Narration verifiably pauses on open and resumes on close; the context chip tracks
page navigation; all three placements pass axe; Nova surfaces meet WCAG AA in both themes.

---

### Phase 7 — Gate the engineering instruments

**Goal.** Get audit tooling out of children's and reviewers' faces.

**Work.** The frame inspector, `±5 frames`, "Flash transport parity: not established", and the
composite-integrity alert currently render whenever `candidateMode` is true — which is exactly the
build executives open. Introduce a separate `reviewerMode`, defaulting off, and move all of it
there. `candidateMode` keeps meaning "not a strict-complete release"; it stops meaning "show the
scaffolding".

**Acceptance.** With `reviewerMode` off, no frame-inspection control and no parity notice appears in
the accessibility tree.

---

## 6. Pilot selection and sequencing

Added 2026-08-08 after a survey of the migration tree. Figures are measured from `catalog/assets.json`
and `migrations/`, not taken from status reports.

### 6.1 Where the migration actually stands

| Measure | Value |
| --- | --- |
| Source-backed lessons, grades 3–5 | 29 (1,567 catalog course pages) |
| Pages migrated | 204 — about 13 % |
| Of which sit in four lessons | 196 |
| Lessons at 100 % member coverage | 3 — G4 L3 (40/40), G5 L4 (55/55), G5 L5 (57/57) |
| Lessons wired into the web app | 2 — G4 L3, G5 L4 |
| Lessons fidelity-, audio-, human-, owner-accepted, strict-complete or published | 0 |

The final row is a structural fact, not an inference: in
`apps/web/lib/g4-course-catalog-coverage.ts:89-97` every field of `acceptanceEffects` is a
**type-level literal `false`**, so the coverage model cannot assert acceptance at all. The remaining
25 lessons hold 0–2 pilot pages each.

Two gaps worth recording:

- **G5 L5** is fully migrated (57/57) and holds a protected atomic release ID, but has no descriptor
  and no player registration. It is converted and unreachable.
- **G4 L10** stands at 46/47 with its fidelity route stalled. The v11 template contract dated
  2026-08-07 reads `fail-closed-template-not-stable`, with **0/520 natural schedules ready and
  0/44,488 authoritative runtime frames captured**.

### 6.2 The architectural fact that decides the pilot

Both registered players — the bespoke `g4-l3-whole-lesson-player` and the generic
`descriptor-driven-whole-lesson-player` — render the **same `LegacyResponsiveLessonShell`**. The
shell is already shared.

So pilot selection is not "which lesson gets rebuilt". Replication is close to free once the shared
shell changes. What needs proving is that nothing lesson-specific leaked into it.

### 6.3 Pilot order

**First — Grade 4 Lesson 3, *Negative Numbers*.** The hardest case and the best-instrumented:
100 % member coverage across the fewest pages (39, so re-verifying every page is cheap), 7 test
files, and the richest `visualSkin` surface in the repository — background companion, loaded-SWF
host composite, chrome title band, resume and exit prompts, plus the readable view that Phase 5
generalises. If chrome-cropping and rescaling survive that combination, the simpler lessons will
not surprise us. It is also the controlled CEO preview vehicle, so the change lands in front of the
right audience.

**Second — Grade 5 Lesson 4, *Number Lines*. This is a gate, not a step.** G5 L4 is the only lesson
on the `descriptor-driven` generic path, which makes it the replication test:

> Enabling `modern-wide` for G5 L4 must touch **only**
> `apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts`. Any edit required outside that file means
> the shell is not generic, and rollout to further lessons does not proceed until the coupling is
> removed.

This is recorded as a blocking acceptance criterion on Phase 2. It is what converts "it works on two
lessons" into "the other 27 can replicate it".

**Third — Grade 5 Lesson 5, *Add & Subtract Negative Numbers*.** Already at 57/57 with a release ID;
it needs a descriptor and a registration and no migration work at all. The cheapest available
breadth proof, and it closes the converted-but-unreachable gap noted in §6.1.

### 6.4 Do not finish the Flash-styled shell first

The question was whether to complete the Flash-styled JavaScript shell before adopting the new UI.
The evidence says no.

- **There is no finished Flash-styled shell to complete.** `chromeEvidence` admits
  `'original-runtime-accepted'` as a value and no descriptor in the repository uses it. Both lessons
  sit at `ffdec-static-structural-candidate`, and `loaded-swf-host-canvas.tsx`,
  `legacy-key-terms-browser.tsx` and the G5 L4 preview hard-code
  `data-original-runtime-accepted="false"`.
- **The one lesson attempting the full fidelity route has produced nothing in eleven contract
  versions.** G4 L10: zero captured frames of 44,488. That is the honest cost signal for finishing
  chrome fidelity properly.
- **Much of the remaining shell work is what Phase 2 deletes.** The G4 L3 control-assets directory
  holds 30 files, 12 of them `lesson-shell-navigation-over-frame-02` … `-13` — in-progress hover
  animation for buttons painted inside the 109 px and 76 px bands that Phase 2 crops away.

The counter-argument is real: the legacy skin is the fidelity baseline, and discarding it would cost
the ability to demonstrate faithfulness to the original host. That is exactly why Phase 2 keeps
`legacy-composite` selectable. The resolution is therefore neither "finish it" nor "delete it" but
**freeze it as an evidence artifact and stop investing in its interaction fidelity**.

**Freeze — no further fidelity investment:**

- Chrome hover, over, and down state assets
- Hit-region pixel fidelity over the painted bands
- Media-pod button animation
- Source-PNG composites for the resume and exit prompts

**Continue — untouched by the new UI:**

- Page-content fidelity, in full
- Narration, audio, and transport behaviour
- Resume and exit *logic*, key terms, calculator
- Page sequencing and lesson navigation

One thing the new UI does **not** allow to be skipped: the shell is a release member
(`expectedMemberCount = activeXmlReferencedPages + courseShells`), so it must still be converted.
Converting the shell and achieving original-runtime *chrome* fidelity are different bars, and only
the first is on the critical path.

### 6.5 Why the ordering favours doing this now

Twenty-five lessons remain unmigrated. Every lesson converted before the switch is authored against
a shell intended for replacement; every lesson converted after is authored once. At 13 % complete
this is close to the cheapest moment this change will ever have, and the cost rises monotonically
with each further lesson converted against the old shell.

## 7. Geometry outcome

### 7.1 Projected in the prototype

Figures from the standalone prototype, at 1920 × 1080.

| State | Lesson plane | vs. today | Share of display |
| --- | --- | --- | --- |
| Today (legacy shell) | 800 × 415 | 1.0× | 16 % |
| Focus, Nova closed | 1709 × 887 | 4.6× | 73 % |
| Focus, Nova open | 1419 × 736 | 3.1× | 50 % + 15 % tutor |
| Study, Nova tab | 1419 × 736 | 3.1× | 50 % + 15 % support |
| Classroom, band open | 1498 × 777 | 3.5× | 56 % |

### 7.2 Measured in the running app — corrected again after Phase 8

| Viewport | Lesson plane | Aspect | vs. today | Share |
| --- | --- | --- | --- | --- |
| 1920 x 1080 | 1536 x 797 | 1.928 | **3.7x** | 59 % |
| 1600 x 1000 | 1337 x 694 | 1.928 | 2.8x | 58 % |
| 1440 x 900 | 1080 x 560 | 1.928 | 1.8x | 47 % |
| 1366 x 768 | 1086 x 564 | 1.928 | 1.8x | 58 % |
| 1280 x 800 | 1035 x 537 | 1.928 | 1.7x | 54 % |

Phase 8 removed the session bar and the permanent map rail, so the plane grew
from 1401 x 727 to 1536 x 797 at 1920. The pre-Phase-8 figures below are kept
because they record how the estimate moved.

### 7.2.1 Earlier figures

Recorded by `apps/web/e2e/modern-wide-geometry.spec.ts` against the real player, not a harness and
not a projection.

| Viewport | Lesson plane | Aspect | vs. today | Share of display |
| --- | --- | --- | --- | --- |
| 1920 x 1080 | 1401 x 727 | 1.928 | **3.1x** | 49 % |
| 1600 x 1000 | 1241 x 644 | 1.928 | 2.4x | 50 % |
| 1440 x 900 | 1068 x 554 | 1.928 | 1.8x | 46 % |
| 1366 x 768 | 992 x 515 | 1.928 | 1.5x | 49 % |
| 1280 x 800 | 1053 x 546 | 1.928 | 1.7x | 56 % |

Three figures have now been produced for the same measurement, and only the last is authoritative:

- **4.6x / 73 %** — prototype projection. Assumed a 150 px spine and no page chrome above the plane.
- **3.8x / 61 %** — CSS harness. Used the real stylesheet but no sibling content, so `stageTop` was
  small and the height cap was loose.
- **3.1x / 49 %** — running app. The session bar and page heading sit above the plane, so the
  remaining height binds earlier than either estimate assumed.

The aspect holds at exactly 1.928 at every breakpoint, which is the invariant that matters; the
share figure is a consequence of how much vertical chrome the page carries. Reclaiming more is a
question of the session bar and heading, not of this presentation.

## 8. Test matrix

| Layer | Command | Covers |
| --- | --- | --- |
| Generator | `npm test` | Adapter scale guard, k = 1 parity |
| Site units | `npm run test:site` | Layout policy, descriptors, support tools, playback |
| Types | `npm run typecheck` | Skin union, tutor context types |
| Lint | `npm run lint` | — |
| Build | `npm run build` | — |
| E2E | `npm run test:e2e -w @helpmath/web` | Breakpoint geometry, tab order, axe |
| Fidelity | `npm run capture:keyframes`, `npm run compare:frames` | RMSE against Phase 0 baseline |
| Migration | `node skills/flash-to-js/scripts/validate_migration.mjs …` | Strict-mode validator |

## 9. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Filter-radius scaling changes k = 1 output | High | k = 1 byte-parity gate blocks the phase |
| Embedded bitmaps stay soft when upscaled | Medium | Enumerate affected pages; never claim they improve |
| Reviewers read `modern-wide` as a fidelity claim | Medium | Ship as a declared presentation; keep legacy skin selectable |
| Removing hit rects breaks a keyboard path | Medium | Tab-order fixture from Phase 0 |
| Nova occludes the plane on small viewports | Medium | Column pushes, never overlays; below 1280 it becomes a sheet |
| Child-data compliance unresolved at launch | High | Blocks public release, not internal preview; needs counsel |

## 10. Phase sequencing

```
Phase 0  baseline            ──┐
Phase 1  scale-aware renderer ─┤ blocking
Phase 2  modern-wide skin     ─┤ G4 L3 behind a flag
Phase 3  sizing policy        ─┤
Phase 4  one control system   ─┤
Phase 5  support region       ─┼─ Phase 6 (Nova) may start design in parallel,
Phase 6  Nova Tutor           ─┤   but integrates only after 1 and 5
Phase 7  reviewer gate        ──┘ independent; can land any time
```

Phase 7 is independent and small — worth doing first if an executive review is imminent.

Relative sizing, for planning only: Phase 1 is the largest and least predictable because of the
filter work and the full asset regeneration. Phases 2–4 are moderate and well-bounded. Phase 5 is
moderate. Phase 6 is bounded on the player side and unbounded on the service side, which is why the
safeguards in 6.6 are the gating item rather than the UI.

## 11. Open decisions for the owner

1. ~~Amend the `AGENTS.md` *Rendering Decisions* clause to permit an integer-scaled backing store,
   conditional on the k = 1 parity gate.~~ **Accepted 2026-08-08 and recorded in `AGENTS.md`.
   Phase 1 is unblocked.**
2. Accept `modern-wide` as a declared non-default host presentation. **Blocks Phase 2.**
3. Keep or drop the legacy skin once `modern-wide` is accepted. Recommendation: keep it, opt-in,
   decoration-only.
4. Confirm the child-data posture for Nova Tutor before any public release. **Blocks Phase 6
   public launch**; does not block internal preview.
5. Confirm whether Nova is available in `TI` / `TS` / `FQ` sections at all, or only in scaffolding
   mode. Recommendation: available, scaffolding only.

## 12. What was not done

- No code was changed. This is a plan and a prototype only.
- Geometry figures come from the prototype and from source inspection, not from a running HELP Math
  build — the dev server on `:3100` is behind the executive-preview passphrase and I did not enter
  it. Starting an ungated server would let these be confirmed against the real shell.
- Nova Tutor's real conversation UI was not observed; `mais.ac` keeps the product behind sign-in.
  The design works from the capability set given (audio, text, images) plus the integration pattern
  the public site does expose. Anything shareable about the real UI would sharpen Phase 6.
- No fidelity, audio, original-runtime, owner, or release acceptance is claimed or implied anywhere
  in this document.


---

## 13. Implementation record — 2026-08-08

What landed, and what deliberately did not. Gates at time of writing: **225/225 site tests**,
typecheck clean, lint 0 errors, production build succeeds.

| Phase | State | Notes |
| --- | --- | --- |
| 0 — baseline & guardrails | **Landed** | `apps/web/e2e/modern-wide-geometry.spec.ts` runs green, 6/6, against the real player. Keyframe capture still not run. |
| 1 — scale-aware renderer | **Landed for the pilot** | `buildSafeRuntime({scale})` accepts integer k 1–3. **k = 1 byte-parity is proven against real shipped assets**: every runnable G4 L3 builder passes `--check`, which rebuilds and compares bytes. Regeneration at k > 1 is a separate operational run. |
| 2 — `modern-wide` skin | **Landed** | Declared per lesson via `visualSkin.presentations`; band geometry derived, never restated. |
| 3 — sizing policy | **Landed** | `presentedPlane` binds on both axes; the 800px cap is gone for the pilot. |
| 4 — one control system | **Landed** | Three-tier bar; source hit areas inert; progress not duplicated. |
| 5 — support region | **Landed** | Readable view generalised to a per-page descriptor declaration; the support region keeps a reading measure instead of the plane's width. A tab strip is not built because exactly one support source exists today — one tab is worse than none. |
| 6 — Nova Tutor | **Contract landed** | `apps/web/lib/tutor-integration.ts` supplies page context, transport borrow/return, and frame snapshot, with 16 tests. **No tutor service is connected and none is faked.** |
| 7 — reviewer instruments | **Landed** | `reviewerMode` split from `candidateMode`, default off. |

### 13.1 Corrections to this plan, from implementation

- **Phase 1 is not blocking for G4 L3.** 39 of 42 page modules are React/SVG at
  `viewBox="0 0 800 600"`. Only `in-003`, `in-009` and `rw-003` use the canvas adapter. Recorded
  in §3.
- **The 4.6× projection was ~20% optimistic.** Measured 3.8× / 61% at 1920 × 1080, because the real
  shell reserves a 280px course-map rail the prototype did not. Recorded in §7.2.
- **Filter radii were not scaled.** The `Filters` block is FFDec's own hash-pinned helper, not
  generated by our script, so scaling blur radii means editing pinned third-party output. At k > 1
  filtered content will blur slightly tighter than authored. This is an open item for the
  regeneration run, not a solved problem.

### 13.2 The e2e access path, and what it caught

The e2e suite could not reach the lesson: `/courses/4/3` is gated unconditionally by the proxy, and
the config carried a `G4_L3_CEO_PREVIEW_ENABLED` variable no code reads. **The gate was not
relaxed.** Instead the test server was given its own disposable controlled-preview credentials, and
the spec signs in through the same `/api/executive-preview/session` endpoint a reviewer uses, with
the `Origin` header a browser form post carries. The access path ships exactly as it was.

Running it immediately earned its keep. Two real defects surfaced that no unit test had:

1. The legacy hit layers were **hidden with CSS rather than not rendered**, so the source header
   hits, tool nav and media hits still existed in the widescreen DOM. They are now gated out of the
   tree entirely.
2. The measured plane is meaningfully smaller than either estimate, because the session bar and
   page heading consume vertical room the harness did not model. See §7.2.

One assertion of mine was also wrong: the page legitimately carries the sentence *"Keyboard input is
a HELP Math 2.0 accessibility enhancement, not evidence of Flash keyboard parity"*, which a broad
text match flagged. That disclosure is correct and stays; the assertion was narrowed to the
transport-parity instrument.

`apps/web/e2e/legacy-lesson-shell-responsive.spec.ts` remains stale and fails 13/13, unchanged by
this work: it asserts a response header value `g4-l3-local-only` that no application source emits,
most likely left behind by the preview-gating rework in `fcb35bff`. Repairing it is separate.

### 13.3 Not started

- Regenerating the three canvas-adapter pages (`in-003`, `in-009`, `rw-003`) at k > 1, with the RMSE
  comparison against the k = 1 baseline. The other 36 pages are SVG and need nothing.

### 13.4 Canvas-page resolution — fixed 2026-08-08

Widening the plane introduced a real regression: the three canvas-backed pages carry a fixed
800 x 600 buffer, so a 1401 px plane stretched them to **0.57x** effective resolution — visibly
softer than the legacy shell, while the 36 SVG pages improved.

`loaded-swf-host-canvas.tsx` now owns its own resolution contract. It reads `renderScale` from the
adapter's registered metadata (absent means 1), sizes the backing store to `stage x scale`, and caps
its CSS box at `stage x scale` so it can never be drawn larger than the pixels behind it. Measured
in the running app at 1920 x 1080: **backing 800, drawn 800, ratio 1.00** on both reachable canvas
pages, verified by `apps/web/e2e/canvas-sharpness.spec.ts`.

The cap is not a workaround that has to be undone. Regenerating an adapter at k = 2 makes its
metadata declare `renderScale: 2`, and the same code then sizes the buffer to 1600 x 1200 and allows
the box to grow to 1600 px with no further change. Until then, canvas pages render sharp and
letterboxed rather than large and soft.
- Any tutor provider integration; §6.6 safeguards remain open and gate public release.
- Per-page key terms in the support region: no source mapping exists for which terms belong to
  which page, and none was invented.


---

## 14. Phase 8 — the composition, 2026-08-08

§13 recorded phases that satisfied the written plan. This phase exists because
the written plan under-specified the design: the prototype's three defining
moves — a section spine, a single transport group, and no session bar over the
lesson — appeared in no phase of §5. The plan was reviewed against its own
prose rather than against the artifact, and the gap survived until the
implementation was looked at.

**The acceptance criterion for this phase is the prototype, asserted
structurally** in `apps/web/e2e/prototype-acceptance.spec.ts`, not described in
prose here.

| Piece | State |
| --- | --- |
| Section spine, 8 named sections, completion state, current highlight | Landed |
| One transport group — Previous, Pause, Next — on one line with progress inline | Landed |
| Session bar suppressed; progress reported exactly once | Landed |
| Map rail retired in favour of an on-demand overlay | Landed |
| Controlled-preview disclosure | **Kept.** It is a release boundary, not chrome, and removing it is not an engineering call. |

### 14.1 What the acceptance spec caught that prose review did not

- **A duplicate language control.** Inserting the language nav into the bar
  created a second one, since the toolbar already carried its own.
- **The map rail overlapping the spine.** Both claimed column 1; the map won on
  source order and covered the spine entirely.
- **The map auto-opening.** With a permanent spine it duplicated the spine and
  hid it on every fresh load.
- **The plane collapsing below 1600 px.** The learning column shared track 1
  with the spine, so at 1440 the plane rendered at 184 px — narrower than the
  legacy shell. Only the breakpoint sweep exposed it.
- **`Back` repeating `Previous`** once the transport moved into the bar.

### 14.2 Still not the prototype

The bar wraps to two rows: transport and playback on the first, lookups on the
second. The prototype shows one row because it places lookups in a panel behind
a single control. Doing that is a further change to the tool panel, not a
styling tweak, and is deliberately not claimed here.
