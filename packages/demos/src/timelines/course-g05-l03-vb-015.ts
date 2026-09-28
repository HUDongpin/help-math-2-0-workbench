import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_015_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB15.swf",
  swfSha256: "eb19b616b91432cf3995dbeaaedd8aefdf56d77b67f41d4bc5e3b5c4a3db08e3",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB15.fla",
  flaSha256: "e06d0f71aea85c26b41799c35d51c2ec5594b5283a86326fb8f641e300a9f529",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB15.mp3",
  associatedAudioSha256: "7dddc0f3556a692a7f96ad954f74cbae4918d8ae25f310eeb7932c60a20e9e34",
  spriteObjectId: 203,
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

export const COURSE_G05_L03_VB_015_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-015",
  title: "course-g05-l03-vb-015 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_015_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-015/canvas-renderer.js",
  assetSha256: "18e82725dad7bbc317faf3abc8753ca549fe06ae43801bc61f8f25ba304fd87c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-203",
  mainFrameCount: 125,
  livePlaybackEndFrame: 68,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 69,
      "lastFrame": 125,
      "reason": "Frames 69..125 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-203-source-static-drawing",
      firstFrame: 1,
      lastFrame: 68,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_015_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
