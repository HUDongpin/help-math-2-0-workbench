import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_012_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB12.swf",
  swfSha256: "206542217962211031e3b392044eaf54f4672ecea3111147eddfa537321f1627",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB12.fla",
  flaSha256: "a4ad6b7fb2b5eaadf8cddbaacd8ca1e47b70d54199479ece3fe4cd409fdabcea",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB12.mp3",
  associatedAudioSha256: "41df76499c0c9b7e9f2b4a017e50a0f4178fe1ea69ca5b3dfc5a259fe89c65f2",
  spriteObjectId: 37,
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

export const COURSE_G05_L03_VB_012_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-012",
  title: "course-g05-l03-vb-012 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_012_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-012/canvas-renderer.js",
  assetSha256: "5917b0d010e29e642545d5fb50d437b5b028a0f0f8146a8c0f7d4fd573c82ff3",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-37",
  mainFrameCount: 534,
  livePlaybackEndFrame: 534,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-37-source-static-drawing",
      firstFrame: 1,
      lastFrame: 534,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_012_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
