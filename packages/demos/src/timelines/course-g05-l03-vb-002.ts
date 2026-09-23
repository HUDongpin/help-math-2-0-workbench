import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB02.swf",
  swfSha256: "34fd149529c8a53e97cedb09d9349a30392b222b83281aa5d64b3c70c5529489",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB02.fla",
  flaSha256: "e782b614dd09146467bdcaab3f755910b44a50c199f1076a9a158ed1e69a8b1a",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB02.mp3",
  associatedAudioSha256: "9abe2ab66b7c8a97c9ecce878813a9939db69e1961a317bee0f789c44b982a52",
  spriteObjectId: 30,
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

export const COURSE_G05_L03_VB_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-002",
  title: "course-g05-l03-vb-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-002/canvas-renderer.js",
  assetSha256: "81bbdc9ba91ab20aeb08f697994c0ff28eaee5ff0b13ab95ef5643e87c63224b",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-30",
  mainFrameCount: 177,
  livePlaybackEndFrame: 177,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-30-source-static-drawing",
      firstFrame: 1,
      lastFrame: 177,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
