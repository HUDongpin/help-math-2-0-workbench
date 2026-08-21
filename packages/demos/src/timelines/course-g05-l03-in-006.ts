import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_006_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN06.swf",
  swfSha256: "4b49d5efc905b81e949ce49d4092f0b87f6bfaad3142f25c6aed2fbd1b31a348",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN06.fla",
  flaSha256: "3e5564163a5576e21027b838e6a3e86ce444fffb41813340c0b455904631eeef",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN06.mp3",
  associatedAudioSha256: "0ed1abebda6660972191234bbe747cf342b5fecb3e93edcf13bb91f2188a6b56",
  spriteObjectId: 39,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8268,"y":5666}),
  rootPlacementPixels: Object.freeze({"x":413.4,"y":283.3}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_IN_006_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-006",
  title: "course-g05-l03-in-006 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-006/canvas-renderer.js",
  assetSha256: "2d02d8b72d7e93266f047433adf2af9e553f59d2da163aa3b2c40308158b0765",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-39",
  mainFrameCount: 479,
  livePlaybackEndFrame: 479,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-39-source-static-drawing",
      firstFrame: 1,
      lastFrame: 479,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
