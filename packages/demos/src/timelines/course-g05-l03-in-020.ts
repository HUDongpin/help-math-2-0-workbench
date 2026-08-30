import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_020_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN20.swf",
  swfSha256: "e65fc28b6fc7e973ab4e0f30a328322cbfc22c4845998055b8c32d63468624df",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN20.fla",
  flaSha256: "364cd4a8457b988ad189d83677f24d8b276fb393c1a839edc90184aea729df19",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN20.mp3",
  associatedAudioSha256: "898786fee6ee7e39d4e2ee08663260bcd213f46b01c9a897f9bf9cc1467b1ddf",
  spriteObjectId: 66,
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

export const COURSE_G05_L03_IN_020_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-020",
  title: "course-g05-l03-in-020 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_020_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-020/canvas-renderer.js",
  assetSha256: "bab2520c800a1a4d13d174321e644e5f7bcae133b1fe7cb14e6bc88342ce2d8c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-66",
  mainFrameCount: 301,
  livePlaybackEndFrame: 301,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-66-source-static-drawing",
      firstFrame: 1,
      lastFrame: 301,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_020_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
