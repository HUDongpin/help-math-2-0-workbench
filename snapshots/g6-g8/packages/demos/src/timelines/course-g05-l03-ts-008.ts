import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_008_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS08.swf",
  swfSha256: "51dfb02a692a0bb80ae99b18b6891e797bfed418ca3dc486b08c76cc22769149",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS08.fla",
  flaSha256: "65e4be96bcba6fd33fd9c09d633bc485b60b318a18d9e639f4f10efb6857de7a",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS08.mp3",
  associatedAudioSha256: "dfd8731d90406d32b2d78a5c55a9cb55ebaeb80b4e99a2a4a0071434831e1b64",
  spriteObjectId: 378,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8247,"y":5658}),
  rootPlacementPixels: Object.freeze({"x":412.35,"y":282.9}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_TS_008_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-008",
  title: "course-g05-l03-ts-008 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-008/canvas-renderer.js",
  assetSha256: "d06820f4c6f602e52294a2a47ec605ce941471b244fec0c30e5c525bd9a6f680",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-378",
  mainFrameCount: 704,
  livePlaybackEndFrame: 261,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 262,
      "lastFrame": 704,
      "reason": "Frames 262..704 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-378-source-static-drawing",
      firstFrame: 1,
      lastFrame: 261,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
