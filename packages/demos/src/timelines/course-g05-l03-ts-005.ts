import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_005_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS05.swf",
  swfSha256: "0b47b032ee767b177080a707ae5c8c9b2ec5b84671adea5e6cf5b43b4cc46081",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS05.fla",
  flaSha256: "d32627243af07dff05eeaee67d531875b16695111500e02fda667654eba390c0",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS05.mp3",
  associatedAudioSha256: "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
  spriteObjectId: 30,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":7477,"y":5666}),
  rootPlacementPixels: Object.freeze({"x":373.85,"y":283.3}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_TS_005_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-005",
  title: "course-g05-l03-ts-005 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-005/canvas-renderer.js",
  assetSha256: "553fa043883183824c3ea72a93ef6e01db1ba347a65a3c13eb1baab3d0ec550a",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-30",
  mainFrameCount: 234,
  livePlaybackEndFrame: 234,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-30-source-static-drawing",
      firstFrame: 1,
      lastFrame: 234,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
