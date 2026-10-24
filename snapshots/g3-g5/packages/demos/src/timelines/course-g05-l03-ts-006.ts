import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_006_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS06.swf",
  swfSha256: "70eb103755346b9502b658d67a3abd1c90c994ed8799d64064a65b8468e3f59f",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS06.fla",
  flaSha256: "cda7816328e0ee6bbf3c6739402f687e44bfe545b6082ddcb17cc969f959c6b7",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS06.mp3",
  associatedAudioSha256: "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  spriteObjectId: 12,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8241,"y":5668}),
  rootPlacementPixels: Object.freeze({"x":412.05,"y":283.4}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_TS_006_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-006",
  title: "course-g05-l03-ts-006 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-006/canvas-renderer.js",
  assetSha256: "8a985161ca4e93493de4441cc50e996a9eeb519e91b619ffb531a66386c0fc4a",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-12",
  mainFrameCount: 245,
  livePlaybackEndFrame: 245,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-12-source-static-drawing",
      firstFrame: 1,
      lastFrame: 245,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
