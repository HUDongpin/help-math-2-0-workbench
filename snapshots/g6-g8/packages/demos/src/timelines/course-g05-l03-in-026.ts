import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_026_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN26.swf",
  swfSha256: "afce93ffb2c880075d2bb5f6f6da10feaa4a80c5ed19c5697543221a0b151fa4",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN26.fla",
  flaSha256: "9b7b0dce018692d1b7dfadd4dca01c4bd177a1a2d67911b3f3b713aee9e2d77f",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN26.mp3",
  associatedAudioSha256: "edb5939503b2ab948edd49b9407f0938cd28c3a7ee61016453b6e98c93834631",
  spriteObjectId: 153,
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

export const COURSE_G05_L03_IN_026_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-026",
  title: "course-g05-l03-in-026 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_026_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-026/canvas-renderer.js",
  assetSha256: "9ba937fa4940530495588095b16783339868d6e87501895e21032348ac1e61ee",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-153",
  mainFrameCount: 252,
  livePlaybackEndFrame: 175,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 176,
      "lastFrame": 252,
      "reason": "Frames 176..252 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-153-source-static-drawing",
      firstFrame: 1,
      lastFrame: 175,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_026_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
