import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_012_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN12.swf",
  swfSha256: "7799b262e1202833010ec6897d53adb8a44318eeb364be56deef82839570240b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN12.fla",
  flaSha256: "0fc9c58163ce96a1fe3cf3be659b1a789b7ccd2095d06834e066edb1a308d253",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN12.mp3",
  associatedAudioSha256: "b341bd81a0b658a8840cbf41b790b780295d6bb37204d1e3cccf551b66c45c39",
  spriteObjectId: 22,
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

export const COURSE_G05_L03_IN_012_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-012",
  title: "course-g05-l03-in-012 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_012_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-012/canvas-renderer.js",
  assetSha256: "2ffb3f0ae527be00972dd188c2f922b8f8da10a3669b53d0d69983dfc4834573",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-22",
  mainFrameCount: 50,
  livePlaybackEndFrame: 48,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 49,
      "lastFrame": 50,
      "reason": "Frames 49..50 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-22-source-static-drawing",
      firstFrame: 1,
      lastFrame: 48,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_012_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
