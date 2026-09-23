import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_009_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI09.swf",
  swfSha256: "77ef46d46aaf3073a7c15ace8f1d3ffa2342dcf54dd859dd2c2dd6b0abe4dc95",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI09.mp3",
  associatedAudioSha256: "57f15fe22e61f8c4ad8304e073e78c7d7754583c216e6de1bcc8d2e69a7c0af4",
  spriteObjectId: 140,
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

export const COURSE_G05_L03_TI_009_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-009",
  title: "course-g05-l03-ti-009 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_009_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-009/canvas-renderer.js",
  assetSha256: "4978d4a7577a335ab60c52d1a739f6e31195851916a99eb7a1a60339ede6d6b7",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-140",
  mainFrameCount: 111,
  livePlaybackEndFrame: 109,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 110,
      "lastFrame": 111,
      "reason": "Frames 110..111 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-140-source-static-drawing",
      firstFrame: 1,
      lastFrame: 109,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_009_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
