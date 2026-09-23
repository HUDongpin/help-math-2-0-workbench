import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_004_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS04.swf",
  swfSha256: "e630013942e6bc164074c4c75db1eaa0154591cb8391ae04714d8e03f9176810",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS04.fla",
  flaSha256: "f0564fe0e4442c16fe36a02bbd96f946d8c91eb53b4a1b01ba949d0c5326ee85",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS04.mp3",
  associatedAudioSha256: "a2505e6988cca2f44777711d87175b385564a51c2cb5284c05d6246635cf5dbf",
  spriteObjectId: 36,
  rootPreloaderStopFrame: null,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":7430,"y":5667}),
  rootPlacementPixels: Object.freeze({"x":371.5,"y":283.35}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_TS_004_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-004",
  title: "course-g05-l03-ts-004 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-004/canvas-renderer.js",
  assetSha256: "832a0aabd41edddc47477d8eb97568931dc1efd37df447f3088e1139fdb696fe",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-36",
  mainFrameCount: 290,
  livePlaybackEndFrame: 290,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-36-source-static-drawing",
      firstFrame: 1,
      lastFrame: 290,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
