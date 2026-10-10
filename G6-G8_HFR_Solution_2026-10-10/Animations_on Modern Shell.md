# Animations on Modern Shell: playing HFR TypeScript pages inside the My Lesson shell

**Date:** 11 October 2026 · **Author:** Claude (Claude Code) for Dr. Peter Hu · **Status:** method proposal. The Owner approved decisions 1 (contract extension) and 2 (branch strategy) in §8 on 11 October; decisions 3–6 are open. Nothing in the workbench has been changed.

## 1. Answer: has this been achieved?

**No.** The converted TypeScript pages play only in the standalone HFR sample viewer (`hfr-sample/viewer/`, `http://127.0.0.1:8765/viewer/index.html`). They do not play in the modern lesson shell shown at `https://www.helpmath.ai/courses/3/1?mode=focus`. The facts behind this answer, checked on 11 October:

| Fact | Evidence |
| --- | --- |
| The HFR package says so itself | `README.md` → "Not done: … no My Lesson integration" |
| Production serves workbench `main` at `f3f58b87` | `x-helpmath-git-commit-sha` header on `/courses/3/1` |
| Every page in the production shell is a frame-function module | e.g. `packages/demos/src/modules/course-g03-l01-in-002.tsx` → `createSourceStaticCanvasCandidate(...)` (static FFDec frames, ActionScript not executed) |
| `main` has no G6–G8 lesson routes | `main` has no `moduleCode`/`courseKey` in the course registry, and no `g678-shared-course-catalog.server.ts` |
| No G6–G8 lesson is registered in the shell on any branch | In the G6–G8 worktree (`codex/g678-current-js-calibration`), `whole-lesson-course-registry.ts` registers only G3–G5 courses. G6–G8 pages appear only one at a time on `/migration-status/g678-calibration/<id>/…` routes |
| Both Codex branches are far from `main` | `codex/g678-current-js-calibration` and `codex/optional-nova-tutor` fork from the 6 Aug baseline: 74–75 commits ahead of `main` and 16 behind it (they miss PRs #20–#25, including the 1,751-page profile and the shell repairs) |

## 2. How the shell hosts a page today

```
app/[locale]/courses/[grade]/[lesson]/page.tsx        server: route, gates, descriptor lookup
  └─ WholeLessonCoursePlayer
       └─ DescriptorDrivenWholeLessonPlayer             lesson state: page, locale, paused, volume, replay epoch
            └─ LegacyResponsiveLessonShell              the shell in the screenshot: spine, header, transport bar
                 stage = <AnimationRuntime moduleKey=page.animationId …/>
                           └─ loadAnimationModule(key)  packages/demos registry (lazy chunk per page)
                                └─ module.Renderer({frame, lang, paused, onLessonHostRequest, …})
```

Two properties decide the design:

1. **The shell does not care what the stage is.** `LegacyResponsiveLessonShell` takes a `stage` React node. It talks to the stage only through a few inputs (`paused`, `volume`, `narrationRequest`, `seekRequest`, the replay key, the locale) and one output, `AnimationRuntimePlaybackState` (frame, frameCount, narration status, seekAvailable), plus `onPlaybackComplete`.
2. **`AnimationRuntime` owns the clock.** It counts frames with `requestAnimationFrame`, triggers audio cues by frame, and treats each module as a pure function, *frame number → picture* (`getFrameState(frame)` + `Renderer frame={n}`).

HFR is the opposite of property 2. An HFR page is a small engine: its scripts call `gotoAndPlay`, start drags, generate random questions, and react to clicks. Its state depends on everything that happened before, so it cannot be redrawn from a frame number. **Forcing HFR into the frame-function model will not work for scripted pages, and every page that matters is scripted.** The method below uses property 1 and adds a second clock mode next to property 2 without changing it.

## 3. The method: one adapter, three seams, everything else generated

```
                    ┌──────────── unchanged ────────────┐
page.tsx → DescriptorDrivenWholeLessonPlayer → LegacyResponsiveLessonShell
                                                     │ stage
                                                     ▼
                       AnimationRuntime (thin switch on registry metadata)   ← seam B
                          ├─ clock 'host'     → FrameClockedRuntime  (today's code, renamed only)
                          └─ clock 'renderer' → RendererClockedRuntime → HfrRenderer → HfrPlayer
                                                     ▲                       (packages/demos/src/hfr/)
                    contract: clock + onRendererPlayback   ← seam A
                    generator: modules, registry entries, descriptors, assets   ← seam C
```

### Seam A: contract (`packages/demos/src/contract.ts`)

Add a renderer-owned clock that existing modules opt out of by default:

```ts
export interface RendererPlaybackReport {
  readonly frame: number;            // 1-indexed frame in the progress domain (see §4.3)
  readonly frameCount: number;
  readonly frameDomain: string;      // "root" or "stream:<timelineId>"
  readonly settled: boolean;         // every non-looping timeline has stopped
  readonly complete: boolean;        // the page completion rule (§4.4) is met
  readonly narration: 'unavailable' | 'idle' | 'playing' | 'blocked';
}

// AnimationModule
readonly clock?: 'host' | 'renderer';           // absent = 'host' (all 1,760 existing modules)

// AnimationRendererProps (read only by renderer-clocked modules)
readonly volume?: number;
readonly narrationRequest?: Readonly<{action: 'play' | 'stop'; requestId: number}> | null;
readonly onRendererPlayback?: (report: RendererPlaybackReport) => void;
```

Add `clock: 'renderer'` to the generated `registry-metadata.generated.ts` record, so the choice can be made **before** the module loads and without importing the renderer graph.

### Seam B: `AnimationRuntime` becomes a thin switch (`apps/web/components/animation-runtime.tsx`)

```tsx
export function AnimationRuntime(props: AnimationRuntimeProps) {
  return animationModuleRegistration(props.moduleKey)?.clock === 'renderer'
    ? <RendererClockedRuntime {...props} />
    : <FrameClockedRuntime {...props} />;   // today's body, renamed and otherwise unchanged
}
```

Switching on the synchronous registry record (not on the loaded module) keeps React's hook order intact and leaves the 1,300-line frame path, and its tests, alone.

`RendererClockedRuntime` (new file, about 150 lines) keeps the same props as `AnimationRuntime`. It:

- loads the module through `loadAnimationModule(moduleKey)` with the same loading and unavailable labels;
- renders `<module.Renderer>` inside the same `.runtime-shell` / `.runtime-stage` wrappers and `data-*` attributes. The 800×600 aspect variables keep the 390 px and widescreen layouts working unchanged;
- passes `paused`, `volume`, `narrationRequest`, `uiLanguage`, `audioEnabled`, `reducedMotion`, `onLessonHostRequest` and `onReplay`;
- turns each `RendererPlaybackReport` into `onPlaybackStateChange({frame, frameCount, frameDomain, fps: 12, narration, playbackProgress: frame/frameCount, seekAvailable: false, stepFrames: 0, transportMode: 'none', audioAvailable})`;
- calls `onPlaybackComplete` once per replay when `report.complete` first becomes true;
- does **not** run `useFrame`, `useAudio` or the host audio tracks. HFR plays its own streams.

### Seam C: the generator (extend `hfr-compile` with an `emit-workbench` step)

For each lesson, `hfr-compile` already writes `lesson.json` and, per page, the `.ts` module, `.data.json` and `media/`. The new step writes these into the workbench. Every output is generated; none is edited by hand:

| Output | Where | Notes |
| --- | --- | --- |
| Page logic | `packages/demos/src/hfr-pages/<placement>.ts` | The generated module, with its `import type` path rewritten to `../hfr/types` |
| Registry wrapper | `packages/demos/src/modules/<placement>.ts` | 4 lines (below) |
| Registry entries | one `calibrations[]` record in `packages/demos/private-current-js-registry.json` (`registryScope: private-engineering`, `clock: renderer`) | Then `npm run generate:registry`. The existing generator and `check:registry` stay the gate |
| Course descriptor | `apps/web/lib/<course>-hfr-course-descriptor.generated.ts` | Schema-2 `PageOnlyLessonPlayerDescriptor`, built the same way as `g3-l1-page-only-course-descriptor.ts` (§4.6) |
| Page data and media | `apps/web/public/hfr/<bundle-sha>/<placement>/…` | Content-addressed, so it can be cached as immutable. `.bytecode.json` is **never** copied (verification only) |

```ts
// packages/demos/src/modules/shared-nms002-l07-p005.ts (generated)
import {createHfrAnimationModule} from '../hfr/module';
import page from '../hfr-pages/shared-nms002-l07-p005';
import meta from '../hfr-pages/shared-nms002-l07-p005.meta.json';   // placement, stage, data URL, bundle sha
export default createHfrAnimationModule(meta, page);
```

`createHfrAnimationModule` returns a normal `AnimationModule` with `clock: 'renderer'`, `maturity: 'private-current-js'`, `movie: {stage: 800×600, fps: 12, frameCount: <progress-domain frames>}`, `scenarios: [{id: 'hfr'}]`, `audioCues: []`, `lessonHost: {capabilities: […]}` (§4.2) and `Renderer: HfrRenderer`. Each page is still a lazy chunk through the registry's static `import()`, and the descriptor player's existing next-page preload (`loadAnimationModule(nextModuleKey)`) keeps working.

### The adapter: `HfrRenderer` (`packages/demos/src/hfr/renderer.tsx`)

This is the only HFR-specific React code. Its work:

- **Mount:** a `<canvas tabIndex={0}>` that fills the stage at 4:3, with a `ResizeObserver` and devicePixelRatio scaling (moved from `viewer.ts`). It sets `data-canvas-status="loading" → "ready"` after the first render, which satisfies the existing first-paint gate (`observeAnimationFirstPaint`).
- **Load:** `fetch(meta.dataUrl)` for the page data, then `player.load(data, pageModule, baseUrl)`. The module comes from the registry chunk, not from a runtime `import(url)`, which webpack cannot bundle.
- **Host bridge:** implements `HfrHost` from `hfr-host-bridge.d.ts` and translates each shell call into a typed `onLessonHostRequest` (§4.2).
- **Report:** sends `onRendererPlayback` at most once per tick, and only when a value changed.
- **Lifetime:** `player.destroy()` on unmount. The shell's Replay already remounts the stage through `key={…:${runtimeEpoch}}`, which gives a fresh runtime, matching Flash's reload of a page.
- **Accessibility mirror:** a visually hidden DOM list of the page's live text and focusable proxies for enabled buttons (spec §10). Planned for milestone M2.

## 4. Mapping shell behaviour to HFR

### 4.1 Shell controls → player

| Shell control (prop) | HFR adapter action |
| --- | --- |
| Play/Pause (`paused`) | `player.start()` / `player.pause()`: stop the tick loop and suspend the AudioContext. Never autoplay on return |
| Replay (stage remount) | New `HfrPlayer`: frame 1, fresh globals, the same seed policy as the current runtime seed |
| Prev / Next / spine / Map (page change) | Unmount, which calls `destroy()` (audio and listeners released), then mount the next page |
| Volume (`volume`) | Audio gain, and `_global.volLevel` / `gSound` for pages that read them |
| EN/ES (`uiLanguage`) | ES routes the lesson's `SA/<page>.mp3` and mutes the English streams (as the viewer already does). The final-quiz flags `dtfFinalQuizSpanishAudio` etc. follow the host setting |
| Narration button (`narrationRequest`) | `play` resumes a suspended AudioContext or restarts the Spanish track; `stop` stops it. Report `blocked` while the browser refuses audio |
| Server audio gate (`audioEnabled=false`) | Everything muted, and `narration: 'unavailable'`. This preserves the fail-closed audio gate in `page.tsx` |
| Help / Key Terms / Calculator open | Existing behaviour: the player sets `paused`, and HFR suspends |
| Scrubber (`seekRequest`) | Read-only progress in v1 (`seekAvailable: false`). Later: deterministic seek by replaying ticks headless to frame N (§6) |
| Tab hidden | `visibilitychange` suspends ticks and audio. Resume only on the learner's intent |

### 4.2 Page shell calls → typed lesson-host requests

| HFR host call (1.0 shell API) | Lesson-host request | Capability |
| --- | --- | --- |
| `_global.KeyAttribute = "Ratio"; _root.DoHyperLinks()`, then a link click | `open-glossary {entryId}`. The entry is found by `sourceKeyAttribute`, a field schema-2 glossary entries already have | `glossary` |
| `doPlayNextMovie()` / `doPlayPreviousMovie()` | `navigate {targetAnimationId: next/previous page}` | `navigation` |
| `showRightFeed()` / `showWrongFeed()` (game and practice pages) | `record-practice-feedback {interactionId: placement, outcome, …}` | `practice-feedback` |
| Final-quiz answer (`quizSection`, `quizTryCount` + feedback) | `record-fq-score {questionId, correct, pointsAwarded, pointsPossible}` | `fq-scoring` |
| `doPlayFQQuestionAudio()` / `doPlayFQAnswerAudio()` / `doPlaySpanishAudio()` | Played inside HFR from the page's own media, only when `audioEnabled` | `audio` |
| `enableQuizButton()`, `next_mc.gotoAndStop("active")` | Completion hint (§4.4); no request | none |
| `getURL`, `loadVariables`, `LoadVars`, `XML`, report clips, `setBookMark` | `legacy {operation}`: blocked and logged; nothing is sent over the network | none |
| `doCloseApp()`, `doNeedMoreHelp()` | Logged only in v1 (the shell has its own Exit and Help). Owner decision §8 | none |
| Any unknown shell call, opcode or built-in | Fail closed: `unsupported`, page shown as unavailable in reviewer mode | none |

Two small additions are needed in `DescriptorDrivenWholeLessonPlayer.handleLessonHostRequest`: when an allowed `navigate` comes back, call `selectPage(target)`, the same path the Next button uses. A generated descriptor must also enable `navigation`, `glossary`, `practice-feedback`, `fq-scoring` and `audio` in `support.lessonHostCapabilities`. The G3 L1 page-only descriptor enables only `audio`.

### 4.3 Progress domain (what the shell scrubber shows)

Many HELP pages stop the root timeline early (for example at frame 6) and run the lesson inside a nested sprite with a narration stream. The progress domain is therefore **the timeline that owns the longest narration stream** (`data.streams[].timeline`), shown as `frame / totalFrames` of that clip. Pages without streams fall back to the page root. The compiler should write the chosen domain into `meta.json`, so the shell bar and the module's `movie.frameCount` agree before the page plays.

### 4.4 Page completion (what marks a page "reviewed")

Complete means one of:

- the progress-domain timeline reached its end or stopped and the page is `settled` for 24 ticks (2 s);
- on activity pages (TI, GS, FQ, and pages that call `enableQuizButton` or set `next_mc` active), the page's own signal: `next_mc` set to active, or a recorded feedback or FQ score.

The compiler marks `completionMode: 'timeline' | 'activity'` per page from the measured shell calls.

### 4.5 Rules that do not change

- Generated modules are never edited by hand. Fix the converter or runtime and regenerate, or add a reviewed overlay.
- `source-assets/` and the AWS archive stay read-only.
- Registry scope stays `private-engineering`, maturity stays `private-current-js`, every `acceptanceEffects` value stays `false`, and nothing is added to the release ledgers. The routes stay noindex and local-only until the Owner opens them.

### 4.6 The generated course descriptor, compared with G3 L1

The descriptor is the same schema-2 `PageOnlyLessonPlayerDescriptor` as `g3-l1-page-only-course-descriptor.ts`, generated from `lesson.json` and `g678-page-only-release-manifest.v1.json`. The differences:

- `course.moduleCode: 'NMS002'`, `courseKey: 'g6-nms002-l07'`, `href: '/courses/6/nms002/7'` (the format the G6–G8 registry validator already expects);
- `pages[].rendererAvailability: {kind: 'registered', moduleKey: '<placement>'}`, so the existing gate (`hasAnimationModule`) applies unchanged;
- `pages[].runtimeEvidenceBoundary.runtimeKind: 'hfr-translated-actionscript'`, `actionScriptExecution: 'translated-typescript'` and `naturalTraceValidation: 'T0b-equivalent-to-bytecode'`. This is an honest boundary: equivalent to the bytecode on the HFR runtime, not to Flash Player;
- `glossary[]` built from the lesson's key-term XML. The middle-school files are in the archive inventory: for example `HelpProgramStagingv4/HELP_KEYTERMS/KT/XML/L1KTE01.xml` (345,838 bytes, content-addressed object `14d454f4…`) with the matching `KTS` Spanish files. The archive manifest lists them as unclassified. Bind each entry by `sourceKeyAttribute`;
- `support.lessonHostCapabilities` as in §4.2.

## 5. Where to build it

**Start a new branch from `origin/main`,** because the screenshot shell is `main`. Port only the G6–G8 route pieces from `codex/g678-current-js-calibration`:

1. the `proxy.ts` rewrite `/courses/<6-8>/<module>/<lesson>` → `/courses/<grade>/<lesson>?moduleCode=<MODULE>`, with its noindex header;
2. the shared-route branch of `page.tsx`: the `moduleCode` checks, `findWholeLessonCourseRegistrationByKey`, and the document-level noindex metadata;
3. `moduleCode`, `courseKey` and `gradeTags` in the descriptor type and in `descriptorCourseRouteIsValid`;
4. one local-only gate: `HFR_LESSON_PREVIEW_ENABLED=true`, honoured only when `NODE_ENV !== 'production'` and `VERCEL_ENV` is unset, in the same style as `isG678LocalPreviewEnabled`.

Do **not** merge the G6–G8 branch. It carries 74 commits of per-page calibration files, admission records and route stubs that HFR replaces.

## 6. Milestones, most efficient order first

| | Work | Done when | Estimate (one engineer or agent) |
| --- | --- | --- | --- |
| **M0** | HFR sample fixes: (a) type the `fn` helper in `runtime/types.ts`, so nested closures get their parameter types (strict `tsc` currently reports **960 TS7006** errors in the generated NMS L7 pages; the runtime itself is already strict-clean, measured 11 Oct); (b) `HfrPlayer.load(data, module, baseUrl)` without `import(url)`; (c) expose `progress()`, `settled`, completion and narration state; (d) move resize/DPR and Spanish routing from the viewer into the player; (e) make `destroy()` idempotent | NMS L7 and P040/P050 regenerate, T0b stays at 54/54, and strict `tsc` is clean | 0.5 day |
| **M1** | Seams A, B and C, `HfrRenderer`, the §5 route port, and a generated NMS L7 descriptor | `npm run dev` with the flag: `/courses/6/nms002/7` plays all 52 pages **in the shell** (spine, Next/Prev, Pause, Replay, volume, EN/ES), with zero console errors | 2 days |
| **M2** | Full §4.2 bridge (glossary, navigation, feedback, FQ score, FQ audio), the §4.4 completion rule, the accessibility mirror, and the ALG L8 course (P040 game, P050 quiz) | The Playwright suite in §7 passes at 1360 px and 390 px | 3 days |
| **M3** | Scale: compile all 44 G6–G8 lessons (2,282 placements; about 2.5 s per lesson); T0 and T0b gates in CI; descriptors for all 44; asset hosting decision (§7) | Every placement is either registered or listed as a T0/T0b failure with a reason | 3–4 days |
| **M4** (optional) | G3–G5 on HFR (same AVM1 profile): generate HFR modules for one lesson, e.g. G3 L1, behind a local flag and compare them with today's static-frame pages **in the same `/courses/3/1` shell** | The Owner decides lesson by lesson | 1 day for the first lesson |

M1 is the step that answers the original request: after it, the converted TypeScript pages play in the shell from the first screenshot.

Later, deterministic seek: because HFR is deterministic (seeded RNG, virtual clock), the scrubber can seek by creating a fresh runtime and running N ticks headless, then rendering. At 12 fps a 3-minute page is 2,160 ticks. That gives the shell's existing `visual-frame-inspector` mode for HFR pages without new UI.

## 7. Verification and delivery

**Tests.**

- *Unit:* a table-driven test of the host bridge with a fake `HfrPlayer`: every row of §4.2 gives the expected `LessonHostRequest`; blocked calls never touch `fetch`.
- *Runtime host:* `RendererClockedRuntime` maps reports to `AnimationRuntimePlaybackState`, and completion fires once per replay.
- *E2E (Playwright, local flag on):* walk NMS L7 with the shell's Next button through all 52 pages. Per page, check: `data-canvas-status="ready"`; no console errors; frames advance and stop while paused; Replay resets to frame 1; a glossary link opens the glossary overlay and pauses; ES switches the narration source; Next is reachable at 390 px. Then P040: start, answer, see "Excellent!" and a recorded `record-practice-feedback`.
- *Equivalence:* T0b (`hfr-sample/tools/verify.ts`) keeps running on the generated modules. The shell integration does not touch page logic, so it cannot change T0b results.
- *Evidence:* screenshots of the shell at 1360 px and 390 px for the PR.

**Payload (measured on NMS L7).**

| Part | Size (52 pages) | Notes |
| --- | ---: | --- |
| Total on disk | 101 MB | Includes 0.6 MB `.bytecode.json`, which is never shipped |
| Page data JSON | 53 MB | Shapes are 47 MB of it. The largest file is 9.4 MB; gzip brings it to 2.3 MB |
| Media | 45 MB | MP3 32 MB, JPEG/PNG 13 MB, WAV 84 KB |
| Compiled page modules | 0.8 MB | |

- Shape sharing across pages is only 16% (41.8 MB unique out of 49.8 MB), so cross-page deduplication is not worth doing first.
- Serve page data with gzip or brotli, load each page lazily, and prefetch the next page's data while idle. The descriptor player already preloads the next module.
- If NMS L7 is typical, all 2,282 placements come to about 4.4 GB raw: about 2.3 GB data and 2 GB media. Hosting (Vercel static files or blob storage behind the same content-addressed paths) is an ops decision for M3. If the size is a problem, compiler v0.2 can store paths in a compact binary form.

**Alternatives considered and rejected.**

- *Embedding the sample viewer in an iframe:* this duplicates controls, splits pause, volume and ES state from the shell, needs CSP `frame-src` changes and breaks accessibility.
- *Exporting HFR pages as frame-function modules:* impossible for scripted pages (§2).
- *Building on the G6–G8 branch:* 16 commits behind the production shell, and it carries the per-page system HFR replaces (§5).

## 8. Decisions needed from the Owner

1. ~~Approve the renderer-clocked contract extension (seams A and B). It touches the shared runtime but leaves the frame-clocked path unchanged.~~ **Approved by the Owner on 11 October 2026.**
2. ~~Approve the branch strategy in §5: a new branch from `main` with a minimal G6–G8 route port.~~ **Approved by the Owner on 11 October 2026.**
3. Reduced-motion policy for HFR pages. Recommended: start paused on the page's `begin` frame with narration available, instead of the static-frame fallback used today, because the motion carries the lesson.
4. Mapping of `doNeedMoreHelp` and `doCloseApp`: log only (recommended for v1), or open the shell's Help panel and Exit.
5. Asset hosting for about 4.4 GB (M3).
6. Whether G3–G5 should later move to HFR (M4, A/B in `/courses/3/1`).

These sit alongside, and do not replace, the pending HFR decisions D1–D7 in `Owner_Decision_Brief_2026-10-10.md`.

## 9. Files this method touches

| Area | Files |
| --- | --- |
| HFR sample (M0) | `hfr-sample/runtime/types.ts`, `player.ts`, `compiler/compile-page.mjs` (import path, meta.json, progress domain, completion mode) |
| Demos package | `src/contract.ts`, `scripts/generate-registry.mjs` (`clock` in metadata), new `src/hfr/` (runtime, `module.ts`, `renderer.tsx`, `host-bridge.ts`), generated `src/hfr-pages/*`, `src/modules/shared-*.ts`, `private-current-js-registry.json` |
| Web app | `components/animation-runtime.tsx` (switch), new `components/renderer-clocked-runtime.tsx`, `components/descriptor-driven-whole-lesson-player.tsx` (allowed `navigate` calls `selectPage`), `lib/whole-lesson-player-descriptor.ts` and `lib/whole-lesson-course-registry.ts` (`moduleCode`, `courseKey`, HFR registration), generated `lib/*-hfr-course-descriptor.generated.ts`, `proxy.ts` and `app/[locale]/courses/[grade]/[lesson]/page.tsx` (shared route), `public/hfr/**` (generated assets) |
| Unchanged | `LegacyResponsiveLessonShell`, the frame-clocked runtime path, all 1,760 existing modules, release ledgers, launch gates |
