import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_013_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN13.swf",
  swfSha256: "bcda34bc754c57b06b461f837bcd18d994bc79c9b681ae7744cc9f623098938b",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN13.mp3",
  associatedAudioSha256: "f2b33822c513c24eb1292f4b6d70dfa562faa6b5a768cd489ab1e975b53f3f6e",
  spriteObjectId: 376,
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

export const COURSE_G05_L03_IN_013_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-013",
  title: "course-g05-l03-in-013 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_013_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-013/canvas-renderer.js",
  assetSha256: "9bdda1202199ce41253dc4d2ee6b8abd41e07dfc5ddc6eb6286f15c156473009",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-376",
  mainFrameCount: 454,
  livePlaybackEndFrame: 445,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 446,
      "lastFrame": 454,
      "reason": "Frames 446..454 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-376-source-static-drawing",
      firstFrame: 1,
      lastFrame: 445,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_013_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
