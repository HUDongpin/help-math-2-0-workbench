import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_003_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN03.swf",
  swfSha256: "6e60cef217879f4d9c5639b1187e5e9d188268888407fb831e07626543496a1b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN03.fla",
  flaSha256: "5c64f16273a9ca7859af5fbbc7693d65a2b3cbd6bccb7aeecc1cced9e95d8263",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN03.mp3",
  associatedAudioSha256: "46d5b361a17a6e3862a6104a42115f3f0afeb9534bad756091441bdda88876a8",
  spriteObjectId: 101,
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

export const COURSE_G05_L03_IN_003_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-003",
  title: "course-g05-l03-in-003 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-003/canvas-renderer.js",
  assetSha256: "55ae3f35a56612d7e804e44d6b3e5d32a360cf9951a7d2ac851e63b52f42f57b",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-101",
  mainFrameCount: 646,
  livePlaybackEndFrame: 381,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 382,
      "lastFrame": 646,
      "reason": "Frames 382..646 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-101-source-static-drawing",
      firstFrame: 1,
      lastFrame: 381,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
