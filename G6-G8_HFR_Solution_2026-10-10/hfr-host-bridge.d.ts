/**
 * HELP Flash Runtime (HFR): host-bridge contract (draft v0.1, 10 Oct 2026).
 *
 * HFR implements the HELP Math 1.0 course-shell API that every page calls on
 * _root / _level0 / _global, and translates it into the events and requests
 * below. The My Lesson host implements HfrHost and drives HfrPlayer.
 *
 * The shell surface was measured from the G6–G8 bytecode (see
 * corpus-analysis/hostapi-g678.json). Anything not listed here must fail
 * closed (T0 failure); it is never silently ignored.
 */

export type Locale = "en" | "es";

/** One active placement, as listed in the lesson release manifest. */
export interface PlacementRef {
  animationId: string; // e.g. "shared-alg001-l08-p040"
  strand: "NMS002" | "GEO001" | "ALG001" | "DAT001" | `ELMGR${3 | 4 | 5}`;
  lesson: number;
  section: "IR" | "RW" | "VB" | "IN" | "TI" | "GS" | "TS" | "FQ";
  ordinal: number;
  titleEnglish?: string;
}

/** Immutable bundle produced by hfr-compile (see the specification, §9). */
export interface PageBundleRef {
  bundleId: string; // "sha256:<swf>+hfr-compile@<version>"
  url: string; // where the host serves the bundle JSON and assets
  audio: { streams: string[]; spanish?: string /* SA/<page>.mp3 */ };
}

/** Navigation clips on the 1.0 shell that pages switch between labelled states. */
export type ShellNavButton = "back" | "next" | "replay" | "pause" | "play" | "nextani" | "popup";

export type FeedbackKind = "right" | "wrong";

export interface HfrHost {
  // ---- lifecycle -------------------------------------------------------
  /** The page reached `InternalPreloader.gotoAndPlay("jump_check")`; HFR starts it at label "begin". */
  pageReady(p: PlacementRef): void;
  /** The page's main timelines all stopped (no non-looping timeline is advancing). */
  pageSettled(p: PlacementRef): void;

  // ---- shell functions (measured counts are SWF files in the G6–G8 source view) ----
  /** `_root.DoHyperLinks(...)` (1,904 files): register glossary links for text-field paths. */
  glossaryLinks(fieldPaths: string[], rawArgs: unknown[]): void;
  /** A glossary link inside page text was activated by the learner. */
  openKeyTerm(term: string, locale: Locale): void;
  /** `_root.enableQuizButton()` / `disableQuizButton()` (794 / 806 files). */
  quizControls(enabled: boolean): void;
  /** `_root.showRightFeed()` / `showWrongFeed()` (612 / 602 files); the page shows its own feedback animation. */
  feedback(kind: FeedbackKind, state: { quizSection?: unknown; quizTryCount?: number }): void;
  /** `_root.back_mc.gotoAndStop("active")` and similar: host navigation-button state. */
  navState(button: ShellNavButton, label: string): void;
  /** `_root.setBookMark()` / `getBookMark()`: local progress only (no network). */
  bookmark(set: boolean, value?: string): string | void;
  /** `_root.doCloseApp()`, `doNeedMoreHelp()`, `doPlayNextMovie()`, `doPlayPreviousMovie()`. */
  navigate(intent: "close" | "help" | "next" | "previous"): void;
  /** `_root.doPlayFQQuestionAudio()` / `doPlayFQAnswerAudio()` / `doPlaySpanishAudio()` / `doStopSpanishAudio()`. */
  audioRequest(req: { kind: "fq-question" | "fq-answer" | "spanish" | "stop-spanish"; locale: Locale; args: unknown[] }): void;

  // ---- settings the page reads through shell objects -------------------
  /** Values exposed as `_root.dtfFinalQuizAudio.text` and similar ("ON" | "OFF"). */
  shellFlags(): {
    finalQuizAudio: "ON" | "OFF";
    finalQuizSpanishAudio: "ON" | "OFF";
    finalQuizAnswerAudio: "ON" | "OFF";
    finalQuizAnswerSpanishAudio: "ON" | "OFF";
    clicks: "ON" | "OFF";
  };
  /** Mapped to `_global.gSound` / `_global.volLevel` (0–100). */
  volume(): number;

  // ---- safety ------------------------------------------------------------
  /** getURL / LoadVars / XML / report clips (Send_Quiz_Report_Mc, strQuiz_Report_URL …): never sent. */
  sandboxed(call: { kind: string; target: string; args: unknown[] }): void;
  /** Any unsupported opcode, tag, built-in or unknown shell call (fail closed). */
  unsupported(detail: { kind: "opcode" | "tag" | "builtin" | "shell"; name: string; path?: string }): void;
}

export interface HfrPlayerOptions {
  host: HfrHost;
  canvas: HTMLCanvasElement;
  /** Container for the accessible DOM mirror (text and focusable button proxies). */
  a11yRoot: HTMLElement;
  locale: Locale;
  reducedMotion?: boolean;
  /** Deterministic mode for tests: seeded RNG and a virtual clock. */
  deterministic?: { seed: number; virtualClock: boolean };
  renderer?: "R0" | "R1";
}

export interface HfrTraceEvent {
  tick: number; // 12 fps frames since load
  kind: string; // "shell.feedback", "goto", "nav", "audio", "sandboxed", ...
  path?: string; // display-object target path
  args?: unknown[];
}

export interface HfrPlayer {
  load(p: PlacementRef, bundle: PageBundleRef, opts: HfrPlayerOptions): Promise<void>;
  play(): void;
  pause(): void; // host pause or page hidden
  replay(): void; // restart the page from frame 1 with fresh state
  setLocale(locale: Locale): void;
  setVolume(v: number): void;
  /** Visibility handling: suspend audio and timelines while hidden; never autoplay on return. */
  setVisible(visible: boolean): void;
  /** Deterministic trace for T1 differential testing. */
  trace(): readonly HfrTraceEvent[];
  destroy(): void; // release audio context, timers and listeners
}
