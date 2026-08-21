import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_028_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN28.swf",
  swfSha256: "c2c3c4148cd85179dd82c9d7efc149e6d5b6ca193392f1a77f00ea64369d2fe2",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN28.fla",
  flaSha256: "1cd8be8d7019abcd1dcf58e7d209e40fa064a47efe0a1ede2a379f4271a9756c",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN28.mp3",
  associatedAudioSha256: "5442f3d205403ce36bf5e0662622d27f07c4546bc3178f2b792cfc1e81d2dbda",
  spriteObjectId: 224,
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

export const COURSE_G05_L03_IN_028_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-028",
  title: "course-g05-l03-in-028 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_028_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-028/canvas-renderer.js",
  assetSha256: "5c7ea6598b88a68f0ceaea1b2730be73e705b1bc854c3f070862c04b5281b147",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-224",
  mainFrameCount: 365,
  livePlaybackEndFrame: 269,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 270,
      "lastFrame": 365,
      "reason": "Frames 270..365 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-224-source-static-drawing",
      firstFrame: 1,
      lastFrame: 269,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_028_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
