import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TS_007_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS07.swf",
  swfSha256: "854bd3c51c04f473bbfc8a007c73e9550d37bd42a585bb0ecae5db1574691a6d",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TS/L3TS07.fla",
  flaSha256: "b8b3e83627ed83dfcf2808c8b6a99fa1ef91222a0431bbf4d34c2e4681e2c706",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TS07.mp3",
  associatedAudioSha256: "a117dae1c204f2b8e88897dc8049157217d555ac098318af7c8f0e73629a0309",
  spriteObjectId: 371,
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

export const COURSE_G05_L03_TS_007_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ts-007",
  title: "course-g05-l03-ts-007 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TS_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ts-007/canvas-renderer.js",
  assetSha256: "593cf5ec5ffa4858d81cfcfba6ee02c69f3f12af596d5851727209f67489882f",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-371",
  mainFrameCount: 691,
  livePlaybackEndFrame: 254,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 255,
      "lastFrame": 691,
      "reason": "Frames 255..691 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-371-source-static-drawing",
      firstFrame: 1,
      lastFrame: 254,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TS_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
