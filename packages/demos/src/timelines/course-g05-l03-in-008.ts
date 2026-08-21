import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_008_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN08.swf",
  swfSha256: "407b1cc146ed8dfc657e1e7eae224f4c9a44a2565a3434e08d33f4bf99a11f4c",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN08.fla",
  flaSha256: "de9b089f93376345e568a1eada56738a869ebd0ad88423f69424ad3a6cfb1b11",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN08.mp3",
  associatedAudioSha256: "a9705ee55c0aa1c5f64a4e21170ce423ffba8e576ee32dc37371786144b4e67a",
  spriteObjectId: 40,
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

export const COURSE_G05_L03_IN_008_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-008",
  title: "course-g05-l03-in-008 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-008/canvas-renderer.js",
  assetSha256: "f6b937024923a57a3c7862cb0580ef6f418d5745bbbdaa75d88a71d84d9deb3f",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-40",
  mainFrameCount: 357,
  livePlaybackEndFrame: 209,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 210,
      "lastFrame": 357,
      "reason": "Frames 210..357 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-40-source-static-drawing",
      firstFrame: 1,
      lastFrame: 209,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
