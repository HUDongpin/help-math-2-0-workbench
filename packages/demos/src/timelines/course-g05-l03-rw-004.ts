import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_RW_004_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/RW/L3RW04.swf",
  swfSha256: "b5447a0edc0320a3bd04b9f3c39e5ffa5616127afc187ee6daed15322bb3918e",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/RW/L3RW04.fla",
  flaSha256: "9ded72cae24b0580b68967de122bbe99379ce020f75f6dc9d3d669f098ab07a6",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3RW04.mp3",
  associatedAudioSha256: "135a5218fd59cb3183609b7487ff40c6df801747ad6f6a2db3820492c8de87b5",
  spriteObjectId: 77,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "Animation",
  rootPlacementTwips: Object.freeze({"x":7219,"y":5460}),
  rootPlacementPixels: Object.freeze({"x":360.95,"y":273}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_RW_004_CONFIG = Object.freeze({
  animationId: "course-g05-l03-rw-004",
  title: "course-g05-l03-rw-004 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_RW_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-rw-004/canvas-renderer.js",
  assetSha256: "f3e18bfa5366b3c143e92819ad87b85ff4630b5d04b3fae49ec294c4c0c5e2e0",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-77",
  mainFrameCount: 308,
  livePlaybackEndFrame: 308,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-77-source-static-drawing",
      firstFrame: 1,
      lastFrame: 308,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_RW_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
