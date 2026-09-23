import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_011_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB11.swf",
  swfSha256: "49aa4e00f02b67884c3027d88109e9b205f100b8ab57c4d5b07f38aef76a448a",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB11.fla",
  flaSha256: "194658af1bfb6a62775bdd69841c113310f662e3cb298b34981c655c403ba90d",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB11.mp3",
  associatedAudioSha256: "091bfbc9406b09f3f9bbf9290a2c076f7833e45b5b3d0f2b1a854d653de57f34",
  spriteObjectId: 25,
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

export const COURSE_G05_L03_VB_011_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-011",
  title: "course-g05-l03-vb-011 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_011_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-011/canvas-renderer.js",
  assetSha256: "eb48a2c757d2a8d7f00cc8f411f658183988512e53c537e31c296caec3ab278e",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-25",
  mainFrameCount: 101,
  livePlaybackEndFrame: 101,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-25-source-static-drawing",
      firstFrame: 1,
      lastFrame: 101,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_011_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
