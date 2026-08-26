import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_014_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB14.swf",
  swfSha256: "9cf9d0eca644212cf2cd587b2f779248565e17fe02bf8f795155abed6c68d5ee",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB14.fla",
  flaSha256: "e81db4d12d989c5a5e0305566d32e7cdc44007e503bfbc8cb6849eeb9598f4d7",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB14.mp3",
  associatedAudioSha256: "3889c69504498c7dd0097089d39e9709815a26472a774e123eb996cd677ca230",
  spriteObjectId: 24,
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

export const COURSE_G05_L03_VB_014_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-014",
  title: "course-g05-l03-vb-014 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_014_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-014/canvas-renderer.js",
  assetSha256: "4707c22cd4d05799a2033c9a0252155ac33845f8ebc04e82a43ed28b5133ad84",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-24",
  mainFrameCount: 321,
  livePlaybackEndFrame: 321,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-24-source-static-drawing",
      firstFrame: 1,
      lastFrame: 321,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_014_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
