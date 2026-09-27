import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_004_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN04.swf",
  swfSha256: "a541f0957ec40f7f6204f09c3da6fd18ae697bbe02da4e8a38ea9b51353a6bf3",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN04.fla",
  flaSha256: "838691b5c5ec16bce4dcfc5d77dba77bf441be2853584fdf469636c9b6c8393a",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN04.mp3",
  associatedAudioSha256: "bdf2bd83d007823641dc258d61392999831e63ce85059265a19a17c9c1a89e6e",
  spriteObjectId: 42,
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

export const COURSE_G05_L03_IN_004_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-004",
  title: "course-g05-l03-in-004 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-004/canvas-renderer.js",
  assetSha256: "766dd7b4c61590b184e7e710f0c361324e63c45a9b8b38d91287a19963cf439c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-42",
  mainFrameCount: 534,
  livePlaybackEndFrame: 534,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-42-source-static-drawing",
      firstFrame: 1,
      lastFrame: 534,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
