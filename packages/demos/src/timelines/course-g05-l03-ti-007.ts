import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_007_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI07.swf",
  swfSha256: "01baff512577e52f5584896b875580e140952ee2792378fd26db64b60bc7da18",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI07.mp3",
  associatedAudioSha256: "4493be3ef84481fa31a9b0b8c2b01d05bb31e3a6f5ad3230abc927b610a9175c",
  spriteObjectId: 79,
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

export const COURSE_G05_L03_TI_007_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-007",
  title: "course-g05-l03-ti-007 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-007/canvas-renderer.js",
  assetSha256: "e6ed2c9351dd3568023fb1abf1ae2052bc355f105240d7bfcd61b8b042aa461c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-79",
  mainFrameCount: 180,
  livePlaybackEndFrame: 178,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 179,
      "lastFrame": 180,
      "reason": "Frames 179..180 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-79-source-static-drawing",
      firstFrame: 1,
      lastFrame: 178,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
