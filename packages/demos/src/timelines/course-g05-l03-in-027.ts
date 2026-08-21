import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_027_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN27.swf",
  swfSha256: "dd05e0548d9cbf5f67ca9f0af09ebe4ef78dc2b920088838991ff8d6b6d83824",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN27.fla",
  flaSha256: "d7fcc4202a780fc9211426dce21126ae9022511f326300ebc0cb114f408289c7",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN27.mp3",
  associatedAudioSha256: "07548562a89d3454d8d690e21726ef60cf1a8f0e251fa656be0785a14097ae5f",
  spriteObjectId: 33,
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

export const COURSE_G05_L03_IN_027_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-027",
  title: "course-g05-l03-in-027 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_027_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-027/canvas-renderer.js",
  assetSha256: "7c644539bbd463377d9ec924fdd682a42f2a37ec63c99716be97935f081164f8",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-33",
  mainFrameCount: 395,
  livePlaybackEndFrame: 395,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-33-source-static-drawing",
      firstFrame: 1,
      lastFrame: 395,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_027_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
