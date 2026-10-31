# HELP Flash Runtime (HFR) with TypeScript output: technical specification

Version 0.2 (Sprint 1 baseline) · 11 October 2026 · Companion to *G6-G8_HFR_Solution_Report_2026-10-10* (revision 2)

**Target (agreed by the Owner, 10 October 2026): HFR with TypeScript output.** Every Flash page is converted automatically into a generated TypeScript page module (logic) plus a data file (drawings, timelines, text) and media, played by one maintained TypeScript runtime library. No Flash Player, plugin or SWF is used at run time. The reference implementation is `hfr-sample/` (converter, runtime, viewer, verifier), which converted NMS Lesson 7 and P040/P050.

This specification defines what HFR must support for the HELP Math 1.0 corpus, how pages are converted to TypeScript modules and data, how the runtime connects to the My Lesson host, and how pages are verified. Every scope statement below comes from measurements of the real source (see `corpus-analysis/`). Anything outside this profile must **fail closed**: it is reported as a verification failure and never ignored silently.

---

## 1. Goals and non-goals

**Goals**

- Convert every G6–G8 placement (2,282), and later every G3–G5 page, into **TypeScript**: a generated page module whose logic is translated from the SWF bytecode, plus a data file and media, played inside the existing My Lesson host with the page's **original behaviour**.
- One maintained TypeScript runtime library; generated output is deterministic and never edited by hand. Any per-page change is a reviewed overlay.
- Every generated module is checked automatically against the original bytecode (T0b, §11).
- Modernisation in shared code: host navigation, glossary, EN/ES audio routing, accessibility mirror, responsive stage, privacy sandbox.
- Automated verification of every page on every runtime version.

**Non-goals**

- A general Flash Player. AS3, video, filters, blend modes, RTMP, sockets, shared objects and printing are out of scope.
- Reproducing the legacy course-shell UI. The shell is replaced by the My Lesson host through the shell adapter.
- Replacing the strict-complete, listening, human or Owner acceptance gates.

## 2. Input profile (measured, G6–G8 source view)

| Property | Value |
| --- | --- |
| Files | 2,853 `.swf` files (2,851 parseable; 2 are not SWF); 2,282 active placements (2,240 unique active hashes) |
| Compression | CWS (zlib) for all parseable files |
| SWF version | 6: 2,723 · 7: 127 · 8: 1 |
| VM | AVM1 only (no `DoABC`) |
| Stage / frame rate | 800 × 600 / 12 fps in every file |
| Root timeline | median 10 frames; content lives in sprites (73,324 `DefineSprite` tags) |
| Template | frame 1: `_level0.InternalPreloader.gotoAndPlay("jump_check"); stop();` · frame 6 label `begin` places `Mc_Page_Title` and the main sprite `animation` |
| Audio | `SoundStreamHead/Block` in 2,589 files: MP3 (9,147 stream heads), ADPCM (218), empty `SoundStreamHead2` (2,023); event sounds in 65 files |
| Text | `DefineFont2` in 2,823 files, `DefineText` in 2,824, `DefineEditText` in 1,110 |

G3–G5 (2,074 SWFs) have the same profile and the same shell contract.

### 2.1 Tags the compiler must support

| Tag | Files | Handling |
| --- | ---: | --- |
| End, ShowFrame, SetBackgroundColor, FrameLabel | 2,851 | timeline structure |
| DefineSprite | 2,851 | nested timelines |
| PlaceObject2 (incl. clip actions, SWF 6+ 32-bit event flags) | 2,851 | display list |
| RemoveObject2 (and RemoveObject) | 2,641 | display list |
| DoAction | 2,851 | frame scripts |
| DoInitAction | 505 | run once, before the frame's DoAction |
| DefineShape / 2 / 3 / 4 | 2,839 / 2,311 / 2,439 / 1 | vector shapes |
| DefineMorphShape | 1,366 | ratio interpolation |
| DefineFont2 / DefineFont3, DefineFontName, DefineFontAlignZones | 2,823 / 1 / 1,231 / 1 | glyph outlines and code tables (names and zones are metadata) |
| DefineText / DefineText2 | 2,824 / 73 | static text (glyph runs) |
| DefineEditText | 1,110 | dynamic and input text, `variable` binding, HTML subset |
| DefineButton2, DefineButtonSound | 2,250 / 6 | button state machine and button sounds |
| DefineBits + JPEGTables, DefineBitsJPEG2/3, DefineBitsLossless/2 | 157 / 128 / 850 / 12 / 131 | bitmaps (JPEG3 has an alpha channel) |
| SoundStreamHead / Head2 / Block | 2,589 / 65 / 2,589 | narration |
| DefineSound, StartSound | 65 / 3 | event sounds |
| ExportAssets | 1,081 | linkage names for attachMovie and registerClass |
| Protect, FileAttributes | 2,616 / 1 | ignored (metadata) |

Any other tag is a compile failure (T0).

## 3. AVM1 instruction set

The 63 opcodes observed across active placements (pages using each in parentheses) are:

Push, GetVariable, GetMember, CallMethod, Pop, Stop (2,282) · SetMember (2,074) · ConstantPool (2,073) · Not, If (1,125) · Increment (1,093) · Less2 (1,009) · Jump (971) · Equals2 (879) · SetVariable (864) · Add2 (826) · Greater (802) · DefineFunction (607) · Subtract (496) · NewObject (482) · CallFunction (418) · PushDuplicate (413) · StoreRegister, DefineLocal (345) · InitObject (339) · GotoFrame (326) · Divide (322) · Multiply (316) · Return (299) · Enumerate2, Delete (296) · GetProperty (243) · InstanceOf (240) · RandomNumber (199) · GotoFrame2 (182) · SetProperty (175) · Play (141) · EndDrag (125) · TypeOf (100) · StartDrag (92) · DefineLocal2 (85) · InitArray (74) · GetURL2 (51) · GetTime (47) · DefineFunction2 (45) · Delete2 (44) · GoToLabel (37) · Trace (36) · ToInteger (24) · CloneSprite (18) · RemoveSprite, ToNumber (17) · StringAdd (13) · NextFrame (10) · Decrement (9) · StrictEquals (8) · And (4) · SetTarget (3) · With, StringExtract, PreviousFrame, SetTarget2 (2) · Modulo (1).

Implement the close relatives for safety: Equals, Less, Or, StringEquals, StringLength, StringLess, StringGreater, ToString, StackSwap, NewMethod, Enumerate, the bit operations, WaitForFrame/2 (always loaded) and Call. Not needed: Try, Throw, Extends, CastOp, ImplementsOp.

### 3.1 Semantics that must be exact

- **Case sensitivity by SWF version.** For SWF ≤ 6, identifier and property lookups are case-insensitive. The corpus relies on this: `showRightFeed`, `ShowRightFeed` and `showRightfeed` are all called. SWF 7+ is case-sensitive.
- **Coercions by version.** `ToNumber(undefined | null)` is 0 for SWF ≤ 6 and NaN for SWF 7+. `ToString(undefined)` is `""` for SWF ≤ 6 and `"undefined"` for 7+. `ToBoolean(string)` converts through a number for SWF ≤ 6 and is non-empty for 7+. Number formatting uses 15 significant digits.
- **Push encodings:** type 6 doubles are stored with the high word first; type 8/9 are constant-pool indices; type 4 is a register.
- **Jumps** are relative to the end of the current action record. Function bodies follow DefineFunction/2 inline (codeSize bytes).
- **DefineFunction2** flags (little-endian u16): PreloadThis 0x1, SuppressThis 0x2, PreloadArguments 0x4, SuppressArguments 0x8, PreloadSuper 0x10, SuppressSuper 0x20, PreloadRoot 0x40, PreloadParent 0x80, PreloadGlobal 0x100. Preload order into registers starting at 1: this, arguments, super, _root, _parent, _global.
- **Scope chain** for timeline code: `_global` → current target clip. For functions: the captured chain plus an activation object. `SetVariable` on an undeclared name writes to the target timeline. `DefineLocal` writes to the activation object.
- **Paths:** dot syntax (`_root.a.b`), slash syntax (`/a/b:var`, `../x`) and `target:frame` for GotoFrame2. `tellTarget` (SetTarget/SetTarget2) with relative slash paths, including `getProperty("../..", _target)`, must resolve correctly (the one known prototype gap: GEO L11 P019).
- **`super`, `prototype`, `__proto__`, `__constructor__`, `Object.registerClass`, `addProperty`, `watch`/`unwatch`, `ASSetPropFlags`** are used by the Flash MX v1 components (FUIComponentClass, FScrollBarClass), which run as their own bytecode.
- **Determinism:** RandomNumber and Math.random use a seeded generator; getTimer and Date use a virtual clock in test mode.
- **Script limits:** an action block exceeding a budget (default 15 s wall time or 50 M instructions) aborts that block and records a T0 failure. Legitimate loops of 70,000 iterations exist (NMS L3 P031).

## 3a. AVM1 → TypeScript translation (hfr-compile)

**Output shape.** One `<placement>.ts` per page:

```ts
/** header: placement, lesson, section, source path + sha256, converter version, structured/fallback counts */
import type { Helpers, PageScripts } from "<runtime>/types";      // type-only import
export default function page(h: Helpers): PageScripts {
  const { add, eq, gt, set, truthy, … } = h;                     // only the helpers this page uses
  return {
    /** Frame script: root timeline, frame 1 */
    frame1: ($, $$) => { $._level0.InternalPreloader?.gotoAndPlay?.("jump_check"); stop($); },
    /** on(release) for button #186 (placed as "BtnDL" in sprite 255 frame 736) */
    button186_release: ($, $$) => { … },
  };
}
```

**Script names** (stable, derived from the source): `frame<N>[_<k>]` for root frame scripts, `sprite<S>_frame<N>` for sprite frames, `init_sprite<S>` for `#initclip`, `button<B>_<conditions>` for button actions, and `<timeline>_f<N>_<instance>_<events>` for clip events. The data file refers to scripts by these names.

**Scope model.**
- `$` is the ActionScript scope: reads and writes follow `getVariable`/`setVariable` exactly, including timeline, `_global`, `with`, `tellTarget` and SWF 6 case rules.
- `$$` is the local scope: the activation object inside functions, the timeline at frame level (`var`, named functions).
- Timeline registers become `let r0…r3`. DefineFunction2 registers become named locals: parameters by their names, preloads as `_this`, `_arguments`, `_super`, `_root`, `_parent`, `_global`.
- `tellTarget` becomes `$ = tellTarget($, path)`; `with` becomes `withScope($, obj, ($, $$) => { … })`.

**Values.** ActionScript objects cross into TypeScript as Proxies, so `$.Mc_Car._rotation` reads naturally. Generated code uses `?.` on reads and calls, preserving Flash's rule that touching something missing does nothing, and `set(obj, "prop", v)` for member writes. It never uses JavaScript operators on ActionScript values; it uses helpers with exact semantics:

| Helper group | Helpers |
| --- | --- |
| Operators | `add`, `sub`, `mul`, `div`, `mod`, `eq`, `seq`, `lt`, `gt`, `truthy`, `and`, `or`, `inc`, `dec`, `num`, `str`, `int`, `typeOf`, `instanceOf`, bit operators, legacy SWF 4 operators |
| Objects | `newObj`, `obj`, `arr`, `keys`, `set`, `del`, `deleteVar`, `declare`, `fn` (DefineFunction), `fn2` (DefineFunction2) |
| Timeline / movie | `play`, `stop`, `gotoAndPlay`, `gotoAndStop`, `gotoLabel`, `nextFrame`, `prevFrame`, `getProperty`, `setProperty`, `duplicateMovieClip`, `removeMovieClip`, `startDrag`, `stopDrag`, `tellTarget`, `withScope` |
| Environment (sandboxed) | `getURL`, `trace`, `random`, `getTimer`, `stopAllSounds`, `callFrame` |
| Fallback only | `getVar`, `setVar`, `getMem`, `callVar`, `callMethod`, `popArgs`, `beginWith`, `endWith` |

**Structuring.** The translator rebuilds expressions from the operand stack and recognises the Flash compiler's control-flow patterns:
- `if`/`else`/`else if`, `while`, `do … while`, `for (;;)` with `break`/`continue`, and `for … in`;
- `&&`, `||` and `?:` from `PushDuplicate`/`If` patterns;
- the Macromedia component compiler's register save/restore prologue and epilogue, and its shared-exit `return`.

Side effects are kept in order by spilling to `const tN` when needed. A block that cannot be proven structured is translated instruction by instruction with an explicit operand stack (`const S = []; switch (pc) …`), which is exact but less readable. Measured: 100% structured on the sample, 99.67% across all 118,923 G6–G8 code bodies.

**Readability.** Comments link every function to its source location. Conditions are printed without redundant `truthy()` around boolean helpers, and `a <= b` appears as `!gt(a, b)` (exact ActionScript semantics, including NaN). Naming and helper style are converter options, applied to every page at once.

**Regeneration and overlays.** Output files are regenerated, never edited. An overlay (`<placement>.overlay.ts`) may replace a generated script by name or patch a data entry, with a reviewer and reason recorded in the lesson manifest.

**Known translation choice.** Method calls on primitive strings and numbers use JavaScript's built-in methods, which match ActionScript for everything the corpus uses (the verifier found no difference). Pages that extend `String.prototype` must use the exact `callMethod` form; the converter can switch per page.

## 4. Built-ins

| Object | Members required |
| --- | --- |
| MovieClip | play, stop, gotoAndPlay/Stop (number or label), nextFrame, prevFrame, attachMovie, createEmptyMovieClip, createTextField, duplicateMovieClip, removeMovieClip, swapDepths, getDepth, getNextHighestDepth, getInstanceAtDepth, getBounds, hitTest (shape and bounds), localToGlobal, globalToLocal, startDrag, stopDrag, setMask, getBytesLoaded/Total, drawing API (lineStyle, moveTo, lineTo, curveTo, beginFill, beginGradientFill, endFill, clear), plus the properties `_x _y _xscale _yscale _rotation _alpha _visible _width _height _name _parent _target _currentframe _totalframes _framesloaded _xmouse _ymouse _droptarget enabled useHandCursor hitArea`, and the events onEnterFrame, onLoad, onUnload, onPress, onRelease, onReleaseOutside, onRollOver, onRollOut, onDragOver, onDragOut, onMouseDown/Up/Move, onKeyDown/Up, onSetFocus, onKillFocus |
| Button | enabled, useHandCursor, _visible and the display properties; the same press/release/roll events; getDepth |
| TextField | text, htmlText, html, variable, textColor, border, borderColor, background, backgroundColor, multiline, wordWrap, autoSize, selectable, type, maxChars, restrict, password, embedFonts, scroll, maxscroll, hscroll, maxhscroll, bottomScroll, textWidth, textHeight, length, setTextFormat, getTextFormat, setNewTextFormat, getNewTextFormat, replaceSel, addListener, removeListener, removeTextField, onChanged, onSetFocus, onKillFocus, onScroller |
| TextFormat | the constructor's 13 arguments and properties; getTextExtent |
| Array | push, pop, shift, unshift, splice, slice, join, concat, reverse, sort (flags and comparator), sortOn, toString, length, the constants |
| String | charAt, charCodeAt, indexOf, lastIndexOf, substr, substring, slice, split, toUpperCase, toLowerCase, concat, fromCharCode, length |
| Math, Number, Boolean, Object, Function | the standard AS2 sets; Function.call and apply |
| Date | constructor and getters, setTime; virtual clock |
| Color | setRGB, getRGB, setTransform, getTransform |
| Key, Mouse, Selection, Stage, System | listeners, key codes, focus, Stage 800×600, `System.capabilities` |
| Sound | attachSound, start, stop, setVolume, getVolume, setPan, setTransform, onSoundComplete (routed to the audio clock) |
| Globals | trace, parseInt, parseFloat, isNaN, isFinite, escape, unescape, getTimer, setInterval, clearInterval, updateAfterEvent, ASSetPropFlags, targetPath, getVersion |
| Sandboxed (log only, never network) | getURL, loadMovie, loadVariables, LoadVars, XML.load/send, fscommand |

## 5. Display list and timeline

- **Depths:** timeline objects use their SWF depth. Script-created objects use `depth + 16384` (AS-visible depth = internal − 16384). `removeMovieClip` applies only to dynamic depths.
- **PlaceObject2:** a new placement (character, no move), a modify (move, no character) or a replace (move plus character). Once script changes a transform property, timeline matrix updates no longer apply to that instance.
- **Goto:** forward jumps apply the intermediate control tags without running intermediate DoActions. Backward jumps rebuild the timeline-owned display list for the target frame, keeping instances whose depth and character are unchanged. The target frame's DoActions run. A goto to the current frame does nothing.
- **Tick order (12 fps):** apply pending host actions → advance timelines (parents before children, ascending depth; objects born this tick do not advance) → run queued frame actions → enterFrame events → intervals → text-variable sync → render. Verify the order of a parent's and newly placed children's frame-1 scripts against Ruffle (T1); this is the main ordering question left open by the prototype.
- **Instantiation:** initialize clip event → registered-class constructor (Object.registerClass by linkage) → frame 1 → load event.
- **Buttons:** states up/over/down/hit built from the button records (instantiate state children; the prototype does not yet). Conditions: IdleToOverUp (rollOver), OverUpToIdle (rollOut), OverUpToOverDown (press), OverDownToOverUp (release), OutDownToIdle (releaseOutside), plus drag transitions and keyPress. Button actions run with the button's parent as target.
- **Hit testing:** use the hit-state shape for buttons and shape geometry for clips with handlers (not bounding boxes). `hitTest(x, y, true)` uses geometry.
- **Masks:** clipDepth layers mask higher depths up to clipDepth.
- **Drag:** startDrag with lock-centre and constraint rectangle; `_droptarget` is computed by hit test.

## 6. Rendering

**Native Canvas renderer (implemented in `hfr-sample/runtime/render.ts`).** It contains no FFDec or Ruffle code; FFDec remains a development and reference tool only. It draws from compiled shape data:

- Convert shape records to edges per fill style (fill0/fill1 edge assembly into closed loops) and per line style. Draw with Path2D. Support linear and radial gradients (spread modes as in SWF 6/7), bitmap fills (clipped and repeating, smoothed and non-smoothed), and line widths with hairline handling.
- Morph shapes interpolate start and end edges and styles by ratio (0–65535).
- Colour transforms are applied per object (multiply and add terms), with alpha from the transform.
- Static text draws glyph runs from DefineFont2 outlines with the record's matrix, font height, colour and advances.
- Dynamic text lays out with embedded glyphs when `embedFonts` (or the font) is present, otherwise with a mapped web font. The HTML subset is `<p align>`, `<font face size color>`, `<b>`, `<i>`, `<u>`, `<br>`, `<a href>` (links go to the host and never navigate) and `<li>`.
- Render at devicePixelRatio. Composite at 12 fps, redrawing only on change.

## 7. Audio

- **Stream sound:** for each timeline with a SoundStreamHead, concatenate its SoundStreamBlocks into one MP3 (or decode ADPCM to PCM) at compile time, with a frame-to-sample map. At run time, while a stream is playing, that timeline's playhead follows the audio clock (Flash streaming semantics: drop frames when late, never run ahead). Stopping the timeline stops its stream; goto re-seeks it.
- **Event sounds:** DefineSound, StartSound and DefineButtonSound play through WebAudio with Sound-object volume and pan.
- **Global controls:** the host volume maps to `_global.gSound`. Host pause or page visibility suspends the audio context and all timelines. Resume never autoplays without host intent.
- **Spanish:** the host ES toggle routes the lesson's `SA/<page>.mp3` and the final-quiz Spanish audio (`doPlayFQ…` with the `dtfFinalQuizSpanishAudio` flags). Language selection is a host decision and is never inferred from file names.
- **Check:** at compile time, compare each stream's duration with its timeline frame count (±1 frame at 12 fps) and report mismatches in T0.

## 8. Host bridge (shell adapter)

Implement the 1.0 course-shell contract once. The TypeScript interface is in `hfr-host-bridge.d.ts`.

| Shell surface | Behaviour in HFR | Host event |
| --- | --- | --- |
| Page mount | Load the page root as `_root.animation_mc` (1.0 used `animation_mc.loadMovie(page)`) | `pageLoaded` |
| `_level0.InternalPreloader.gotoAndPlay("jump_check")` | On the next tick, `gotoAndPlay("begin")` (fall back to `play()`) | `pageReady` |
| `_root.DoHyperLinks(args…)` | Register glossary links for the given text field(s); clicks open the host Key Terms panel | `glossaryLinks` |
| `_global.KeyAttribute`, `_global.quizSection`, `_global.quizTryCount`, `_global.WrongFeed`, `_global.totQuizCount`, `_global.reviewCount` … | Plain globals; the host may read them for progress | — |
| `_root.enableQuizButton()` / `disableQuizButton()` | Unlock or lock host quiz controls | `quizControls` |
| `_root.showRightFeed()` / `showWrongFeed()` | Feedback event; the page shows its own feedback animation | `feedback` |
| `_root.doPlayFQQuestionAudio()` / `doPlayFQAnswerAudio()` | Play final-quiz audio in the current language | `audioRequest` |
| `_root.dtfFinalQuizAudio`, `…SpanishAudio`, `…AnswerAudio`, `…AnswerSpanishAudio`, `dtfClicks` | Text-field flags read by pages (`"ON"`/`"OFF"`), set from host settings | — |
| `_root.back_mc`, `next_mc`, `replay_mc`, `pause_mc`, `play_mc`, `nextani`, `popup` + `gotoAndStop("active"|"inactive"|…)` | Host navigation-button state | `navState` |
| `_root.setBookMark()` / `getBookMark()` | Local progress only | `bookmark` |
| `_root.doCloseApp()`, `doNeedMoreHelp()`, `doPlayNextMovie()`, `doPlayPreviousMovie()` | Exit, help, next or previous page | `navigate` |
| `_root.doPlaySpanishAudio()`, `doStopSpanishAudio()`, `doCheckSpanishAudio()` | ES audio channel | `audioRequest` |
| `_global.gSound` (Sound) and `_global.volLevel` | Host volume | `volume` |
| `Send_Quiz_Report_Mc`, `Send_Click_Report_Mc`, `strQuiz_Report_URL`, `strFinalClickURL`, getURL/LoadVars/XML | **Sandboxed**: logged, never sent | `sandboxed` |
| Key-terms shell functions (`doInitKeyTerms`, `doCreateGlossaryWord` …; 3 files) | Implemented if those pages are in scope; otherwise a T0 failure | — |
| Any other `_root.X()` call that resolves to nothing | **T0 failure** (fail closed); add to the contract only after review | — |

## 9. Page output (module, data, media)

Per placement: `<placement>.ts` (generated logic, §3a), `<placement>.data.json` (below), `media/` (narration MP3/WAV, bitmaps, optional Spanish narration), and `<placement>.bytecode.json` (original bytecode per script name, used only by the T0b verifier, never shipped). The lesson folder holds `lesson.json` (outline) and `verification.json`.

```jsonc
{
  "schema": "hfr-page/1",
  "compiler": "hfr-compile <version>",
  "placement": { "animationId": "shared-alg001-l08-p040", "strand": "ALG001", "lesson": 8, "section": "GS", "ordinal": 40 },
  "source": { "path": "HELP_COURSES/ALG001/L8/GS/L8GS02.swf", "sha256": "…", "bytes": 0, "swfVersion": 6 },
  "stage": { "width": 800, "height": 600, "fps": 12, "background": "#ffffff" },
  "dictionary": { "<id>": { "kind": "shape|morph|font|text|edittext|bitmap|sound|button|sprite", "...": "..." } },
  "root": { "frames": [ /* control ops per frame: place / remove / action / init / label / stream */ ] },
  "exports": { "<linkage>": 123 },
  "module": "<placement>.js",                       // compiled from <placement>.ts
  // timelines reference scripts by name: { "op": "action", "script": "sprite255_frame1" }
  "audio": { "streams": [ { "timeline": 0, "file": "stream-0.mp3", "frameMap": [0, 3675] } ], "events": [] },
  "overlays": [ /* optional: { id, kind: "text|asset|script", reviewed_by, reason, patch } */ ],
  "diagnostics": { "unsupported": [], "streamDurationCheck": "pass" }
}
```

Shape paths are SVG path data in twips (`Path2D`-compatible). Output is regenerated from source; any edit goes into an overlay with a reviewer and a reason.

## 10. Accessibility layer

- Decode static and dynamic text to Unicode through each font's code table and mirror it into an off-canvas DOM region in reading order (by depth and position). Expose the page title from the lesson XML.
- Each enabled button or clickable clip gets a focusable proxy element over its hit area. Enter/Space produce press and release; the label comes from nearby text or an overlay label table.
- Honour reduced motion through host policy (offer to pause decorative loops). The 1,360/390 px layouts and root-font enlargement are host responsibilities, tested once in T2.

## 11. Verification

| Tier | Pass criteria | Tooling |
| --- | --- | --- |
| **T0** compile and run | The page converts with no unsupported tag; the module type-checks (`tsc`); the headless run reaches the `begin` frame; no unimplemented opcode or built-in; no unknown shell call; no network; the stream-duration check passes | `hfr-compile`, `tsc`, headless explorer |
| **T0b** translation equivalence | The generated module behaves identically to the original bytecode on the same runtime: play to rest, activate every enabled control (up to 30), then compare the shell-call log, final display list and global variables | `hfr-sample/tools/verify.ts` (reference interpreter vs generated module) |
| **T1** differential | For the scripted exploration (settle, then activate each enabled control in path order, depth-first up to N): the host-call trace is identical to the oracle; frame numbers match at checkpoints; RMSE ≤ 0.05 at keyframes and ≤ 0.08 in transitions (project thresholds); amber when only the visual test fails | Playwright + pinned Ruffle (0.4.1 is in `node_modules`) loading an **instrumented shim SWF**: a small generated AVM1 SWF that defines the shell functions, `trace("HFR|<fn>|<args>")`s every call, and loads the page into `animation_mc` |
| **T2** runtime conformance | Pause/resume, native visibility, Replay, EN/ES audio, focus restoration, 1,360/390 px, root-font 20, reduced motion, on a fixed sample (≥ 2 pages per section code per strand) | Playwright suite, run per runtime version |
| **T3** lesson review | Teaching flow, audio and text quality, Spanish, defects; sign-off per lesson | Review UI listing each page with T1 status and amber diffs |

**Release manifest (one per lesson):**

```jsonc
{ "schema": "hfr-lesson-release/1", "lesson": "ALG001-L08", "runtimeVersion": "hfr@0.3.0",
  "pages": [ { "placement": "shared-alg001-l08-p040", "swfSha": "…", "converter": "hfr-compile@…", "moduleSha": "…", "t0": "pass", "t0b": "identical", "t1": "pass|amber", "t1Report": "sha256:…" } ],
  "t2": "sha256:<suite report>", "review": { "by": "…", "at": "…", "notes": "…" },
  "trackB": [ /* placements served by the labelled Ruffle fallback */ ],
  "acceptanceEffects": { "strictComplete": false, "ownerAccepted": false, "published": false } }
```

## 12. Performance budgets

- Convert: measured about 2.5 s for a 52-page lesson (sample); the whole corpus well under 30 min. T0b: about 1 s per lesson.
- Data file (excluding media): ≤ 1.5 MB gzip per page. Sample: median 0.3 MB raw; the largest, photo-realistic vector artwork, is 9.8 MB raw / 2.3 MB gzip, a candidate for binary path encoding.
- First frame ≤ 1 s on a mid-range laptop and ≤ 2.5 s on a mid-range phone after the assets load.
- Headless T0 for the corpus: ≤ 2 min in CI. Visual T1: ≤ 4 h on 10 workers.

## 13. Gate acceptance

- **G1 (16 Oct):** 60-page stratified sample (15 per strand; all 8 section codes; P040/P050; ≥ 5 drag pages; ≥ 5 MX-component pages). T0 = 100% and T0b = 100%; T1 pass on ≥ 80%; plays in local My Lesson with navigation, glossary and feedback events visible in the host log.
- **G2 (22 Oct):** T0 ≥ 99% and T1 ≥ 90% of 2,282; T2 green; accessibility mirror on; lesson manifests generated.
- **G3 (28 Oct):** ≥ 40 of 44 lessons reviewed and released privately; every remaining placement is HFR-amber with an issue, or Track B.
