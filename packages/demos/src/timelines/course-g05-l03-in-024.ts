import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_024_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN24.swf",
  swfSha256: "575c1155067be4556f9bdec976e5d81d4b23432852fb0be871d96c331e3cb6a9",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN24.fla",
  flaSha256: "eb227510e1ab9cecd9bd2c3b6803637a1537387359b48c79de04a399bd4ca818",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN24.mp3",
  associatedAudioSha256: "41046d80e3de990f7b749ed48b46e52dff6cef070070e0ace339109669054ab4",
  spriteObjectId: 165,
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

export const COURSE_G05_L03_IN_024_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-024",
  title: "course-g05-l03-in-024 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_024_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-024/canvas-renderer.js",
  assetSha256: "3c8a36cd95d61a81bd64302917ab16af12240e69309d3338ce6c8e4decd4ea48",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-165",
  mainFrameCount: 395,
  livePlaybackEndFrame: 336,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 337,
      "lastFrame": 395,
      "reason": "Frames 337..395 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-165-source-static-drawing",
      firstFrame: 1,
      lastFrame: 336,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_024_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
