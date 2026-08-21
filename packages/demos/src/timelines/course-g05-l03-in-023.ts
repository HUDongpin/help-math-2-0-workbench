import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_023_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN23.swf",
  swfSha256: "1b213ae60a4893e31399040fb5abc1cb8d990b6d364185e3e798825bb0bd206a",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN23.fla",
  flaSha256: "5920b7d779e60bc83db0ecc65b83b8f42190e19eb42ccffc1b8245e0d8ec41f0",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN23.mp3",
  associatedAudioSha256: "e00a90837ec595fe1f21cb24d988fabd768fdfa4fe7c386e8d8d176ba8b1c2a4",
  spriteObjectId: 41,
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

export const COURSE_G05_L03_IN_023_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-023",
  title: "course-g05-l03-in-023 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_023_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-023/canvas-renderer.js",
  assetSha256: "07005d5985714c5f57ff9be2ff9bdf80da963da3080f8bf6afab2becab37349e",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-41",
  mainFrameCount: 598,
  livePlaybackEndFrame: 598,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-41-source-static-drawing",
      firstFrame: 1,
      lastFrame: 598,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_023_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
