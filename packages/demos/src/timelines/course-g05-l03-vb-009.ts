import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_009_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB09.swf",
  swfSha256: "9b931b16dd2b12d910b3464663e9ba106cdbf8b830ab0c28db28cf57526708f7",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB09.fla",
  flaSha256: "ddc85ada1f60fcdb6d68e43a17697642547a88b63195f771676e389161712f29",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB09.mp3",
  associatedAudioSha256: "650320000c9693b398e380ae0ee43ed36eea2a96db589852376d144c62f3b68d",
  spriteObjectId: 33,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8026,"y":4885}),
  rootPlacementPixels: Object.freeze({"x":401.3,"y":244.25}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_VB_009_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-009",
  title: "course-g05-l03-vb-009 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_009_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-009/canvas-renderer.js",
  assetSha256: "c8c3f8a0d73d77c28681dee8c67ab6b64144dfa5d4a822ed8765137790b7ed70",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-33",
  mainFrameCount: 312,
  livePlaybackEndFrame: 312,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-33-source-static-drawing",
      firstFrame: 1,
      lastFrame: 312,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_009_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
