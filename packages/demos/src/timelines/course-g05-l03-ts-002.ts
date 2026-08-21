import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS02.swf",
  swfSha256: "56523f9cf170eee4c671c6580407f1c2c977c87e51ac72eb90f69b03113f1b1a",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS02.fla",
  flaSha256: "990b4eaf7e297a0379a009a59f60ec71c73925ca2cd6bb7cda4a8e4b1b2cf0c1",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS02.mp3",
  associatedAudioSha256: "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
  spriteObjectId: 28,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8248,"y":5666}),
  rootPlacementPixels: Object.freeze({"x":412.4,"y":283.3}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_TS_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-002",
  title: "course-g05-l03-ts-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-002/canvas-renderer.js",
  assetSha256: "c60c34a09c7d60f19f94a29cfc5a1c90622578e9e7818614c8f561f8caa8a254",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-28",
  mainFrameCount: 324,
  livePlaybackEndFrame: 324,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-28-source-static-drawing",
      firstFrame: 1,
      lastFrame: 324,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
