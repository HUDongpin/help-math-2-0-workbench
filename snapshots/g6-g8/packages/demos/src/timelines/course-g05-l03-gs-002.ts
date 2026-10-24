import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_GS_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/GS/L3GS02.swf",
  swfSha256: "39315e9f4b692c97a4556ca63f909d0b799928e89924787ef00a29cc00afa92d",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3GS02.mp3",
  associatedAudioSha256: "2fa9d73a80d4d7bc0504b2c674f5b530083ea59341665402e41bd846b3259b08",
  spriteObjectId: 426,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8348,"y":5506}),
  rootPlacementPixels: Object.freeze({"x":417.4,"y":275.3}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_GS_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-gs-002",
  title: "course-g05-l03-gs-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_GS_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-gs-002/canvas-renderer.js",
  assetSha256: "203d15ce889a29006baba8e4915dfcf6d2ebabfa5e75f6127e31a3ec9e6a32db",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-426",
  mainFrameCount: 520,
  livePlaybackEndFrame: 511,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 512,
      "lastFrame": 520,
      "reason": "Frames 512..520 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-426-source-static-drawing",
      firstFrame: 1,
      lastFrame: 511,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_GS_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
