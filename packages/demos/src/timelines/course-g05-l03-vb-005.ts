import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_005_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB05.swf",
  swfSha256: "5b227c7ace9c163bb6a82abb0dc9c8f8be3c32dad7a4f1b79890eb3ad1745c57",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB05.fla",
  flaSha256: "0ca73795d243e864b3c25a750b4d7d0c0a7a458bd63c1c03ede09c8a5016c096",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB05.mp3",
  associatedAudioSha256: "83134100f33ef42a2a1652db4432ce669402d938aa5f0592f1165584a6098c4e",
  spriteObjectId: 20,
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

export const COURSE_G05_L03_VB_005_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-005",
  title: "course-g05-l03-vb-005 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-005/canvas-renderer.js",
  assetSha256: "330288a3aa437a2f1617cbff20471c4425c1b9366e79db731163f7bfa7006b5d",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-20",
  mainFrameCount: 171,
  livePlaybackEndFrame: 171,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-20-source-static-drawing",
      firstFrame: 1,
      lastFrame: 171,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
