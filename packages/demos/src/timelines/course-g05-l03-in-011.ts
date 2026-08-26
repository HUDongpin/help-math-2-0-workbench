import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_011_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN11.swf",
  swfSha256: "c2319e303778e2952faac9b0601ce3a28eadfaa0b90b195164bda0e2332c1c18",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN11.mp3",
  associatedAudioSha256: "e7330bd8b2f86f3b06e85d2dd41c9888b62279a306e199a0b4dfe35cad75b390",
  spriteObjectId: 31,
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

export const COURSE_G05_L03_IN_011_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-011",
  title: "course-g05-l03-in-011 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_011_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-011/canvas-renderer.js",
  assetSha256: "df363ee13d8b5fd09aa41f41144a994b14920c073139c8dda6a24d01581ca4aa",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-31",
  mainFrameCount: 325,
  livePlaybackEndFrame: 325,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-31-source-static-drawing",
      firstFrame: 1,
      lastFrame: 325,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_011_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
