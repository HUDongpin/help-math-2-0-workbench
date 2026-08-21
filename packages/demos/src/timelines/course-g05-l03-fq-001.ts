import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_FQ_001_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/FQ/L3FQ01.swf",
  swfSha256: "edf302ad8ddd1ab8943ea57f94793e58713485c94d8cd5a5e933b86f8ba486e2",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/FQ/L3FQ01.fla",
  flaSha256: "d1f2837b0c83aa4d4bb550b3ddd0e714be8b99e69890fb8aa262fc2885fe1d7c",
  associatedAudioKind: "embedded-swf-stream-container",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/FQ/L3FQ01.swf",
  associatedAudioSha256: "edf302ad8ddd1ab8943ea57f94793e58713485c94d8cd5a5e933b86f8ba486e2",
  spriteObjectId: 42,
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

export const COURSE_G05_L03_FQ_001_CONFIG = Object.freeze({
  animationId: "course-g05-l03-fq-001",
  title: "course-g05-l03-fq-001 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_FQ_001_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-fq-001/canvas-renderer.js",
  assetSha256: "7dba6bf2b0ca81e21d2708fc6f1924735bb19c1983e96b0fc82e274d727d0b55",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-42",
  mainFrameCount: 52,
  livePlaybackEndFrame: 52,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-42-source-static-drawing",
      firstFrame: 1,
      lastFrame: 52,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_FQ_001_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
