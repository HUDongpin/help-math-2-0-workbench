// HFR runtime · shared types for generated page modules, page data and the host.
/* eslint-disable @typescript-eslint/no-explicit-any */

/** `$` is the ActionScript scope (variables resolve through it), `$$` the local scope. */
export type Script = ($: any, $$: any) => any;
export type PageScripts = Record<string, Script>;
/** Helper functions with exact ActionScript semantics, injected into each page module. */
export type Helpers = Record<string, (...args: any[]) => any>;
export type PageModule = { default: (h: Helpers) => PageScripts };

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
