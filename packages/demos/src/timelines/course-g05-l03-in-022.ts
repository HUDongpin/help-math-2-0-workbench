import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_022_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN22.swf",
  swfSha256: "14e5d846193748a6d5f6e4181364a228c63b9fc56f838b19c7b65c6ad0318f9f",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN22.mp3",
  associatedAudioSha256: "4878cb1080cca8ea9794278fbfc3327caef5af95e59674071633e361ed158829",
  spriteObjectId: 57,
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

export const COURSE_G05_L03_IN_022_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-022",
  title: "course-g05-l03-in-022 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_022_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-022/canvas-renderer.js",
  assetSha256: "3cb5657c65b938d950247c3ecabf2b6b36855d3361d1bc9ab86fa4e19234fd82",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-57",
  mainFrameCount: 380,
  livePlaybackEndFrame: 380,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-57-source-static-drawing",
      firstFrame: 1,
      lastFrame: 380,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_022_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
