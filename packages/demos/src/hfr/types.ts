// HFR runtime · shared types for generated page modules, page data and the host.
/* eslint-disable @typescript-eslint/no-explicit-any */

/** `$` is the ActionScript scope (variables resolve through it), `$$` the local scope. */
export type Script = ($: any, $$: any) => any;
export type PageScripts = Record<string, Script>;
/**
 * Helper functions with exact ActionScript semantics, injected into each page
 * module. The members that take page closures are declared explicitly so the
 * closures in generated code get their parameter types under `strict`.
 */
export interface Helpers {
  fn: ($: any, name: string, params: string[], body: Script) => any;
  fn2: (
    $: any,
    name: string,
    spec: {params: string[]; paramRegs: number[]; regs: number; flags: number},
    body: ($: any, $$: any, R: any[]) => any,
  ) => any;
  withScope: ($: any, o: any, body: Script) => void;
  [name: string]: (...args: any[]) => any;
}
export type PageModule = { default: (h: Helpers) => PageScripts };
export type PageFactory = (h: Helpers) => PageScripts;

export interface Placement { animationId: string; module: string; course: string; lesson: number; lessonTitle: string; sectionCode: string; sectionName?: string; sectionNameEs?: string; ordinal: number; titleEnglish?: string }
export interface StreamInfo { timeline: number; src: string; rate: number; frames: [number, number][]; samples: number }
export interface PageData {
  schema: "hfr-page/1"; compiler: string; placement: Placement;
  source: { path: string; sha256: string; bytes: number; swfVersion: number };
  stage: { width: number; height: number; fps: number; background: number[] };
  module: string; dictionary: Record<string, any>; root: { frameCount: number; frames: any[][]; labels: Record<string, number> };
  exports: Record<string, number>; streams: StreamInfo[]; spanishAudio?: string;
  stats: { scripts: number; codeBodies: number; fallbackBodies: number; characters: number; mediaFiles: number };
}
export interface HostCall { tick: number; kind: string; args: any[] }

/**
 * Build-time facts about one converted page, written by the workbench emit
 * step next to the generated module. `dataUrl` is the content-addressed page
 * data under the HFR asset base; media paths inside the data are relative to it.
 */
export interface HfrPageMeta {
  readonly key: string;
  readonly lessonKey: string;
  readonly dataUrl: string;
  readonly sourceSha256: string;
  readonly compiler: string;
  readonly stage: Readonly<{width: number; height: number; fps: number}>;
  /** Timeline that owns the longest narration stream; 0 is the page root. */
  readonly progressTimeline: number;
  readonly progressFrameCount: number;
  readonly completionMode: 'timeline' | 'activity';
  /** Active pages of this lesson by upper-case source SWF stem, for page jumps. */
  readonly lessonPagesByFile: Readonly<Record<string, string>>;
  readonly previousKey: string | null;
  readonly nextKey: string | null;
  readonly hasSpanishNarration: boolean;
}
