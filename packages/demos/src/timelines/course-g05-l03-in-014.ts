import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_014_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN14.swf",
  swfSha256: "693d17246fa04dcff45739df1a41d7ef2b64857a67f8a4745cec60db565a3322",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN14.mp3",
  associatedAudioSha256: "5eb82a9e9bf43f2246c65f4c5415f94f4eddd246bc06a288d01442b79b3017da",
  spriteObjectId: 162,
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

export const COURSE_G05_L03_IN_014_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-014",
  title: "course-g05-l03-in-014 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_014_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-014/canvas-renderer.js",
  assetSha256: "3bbb6fdb034c52d3a18d87280edb23302d45d3c0ef6bb636e92e4b95111e803b",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-162",
  mainFrameCount: 460,
  livePlaybackEndFrame: 380,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 381,
      "lastFrame": 460,
      "reason": "Frames 381..460 enter a stop-, drag-, answer-, and feedback-controlled state whose causal transitions require unresolved ActionScript and host behavior."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-162-source-static-drawing",
      firstFrame: 1,
      lastFrame: 380,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_014_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
