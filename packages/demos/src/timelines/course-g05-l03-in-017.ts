import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_017_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN17.swf",
  swfSha256: "36bbd4a2f402bc7ce980d630f0a5890d7c5c2333dcc3335718ca3b28e72aa711",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN17.mp3",
  associatedAudioSha256: "46ff772bf89422a127e253954d21047d65a3dbf0ba3fd25741fbe1382116f55e",
  spriteObjectId: 28,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8268,"y":5666}),
  rootPlacementPixels: Object.freeze({"x":413.4,"y":283.3}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_IN_017_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-017",
  title: "course-g05-l03-in-017 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_017_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-017/canvas-renderer.js",
  assetSha256: "3b7551a534045a37b73c032e17ae5a276f75e0aa28e702ba5fa2b8920b35e381",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-28",
  mainFrameCount: 364,
  livePlaybackEndFrame: 364,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-28-source-static-drawing",
      firstFrame: 1,
      lastFrame: 364,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_017_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
