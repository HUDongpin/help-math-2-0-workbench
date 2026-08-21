import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_004_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB04.swf",
  swfSha256: "9a2c4e6d4bb8b26e30ed27da6d96a7135a32d2bac686eb2b96a1ddb846d125e1",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB04.fla",
  flaSha256: "b714268c9663ad58cb7af8fb87ccf082cbca401e9413a7c37aed90ef3bf68d88",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB04.mp3",
  associatedAudioSha256: "1ffd5f9dff94eebf133742b51421c2f3bf71c5837a15f60f556b0040a202ce8b",
  spriteObjectId: 383,
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

export const COURSE_G05_L03_VB_004_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-004",
  title: "course-g05-l03-vb-004 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-004/canvas-renderer.js",
  assetSha256: "cf1ce25264996ae8c61d409365330345c4d7a2328f8cba36e570b374e36e846b",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-383",
  mainFrameCount: 133,
  livePlaybackEndFrame: 79,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 80,
      "lastFrame": 133,
      "reason": "Frames 80..133 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-383-source-static-drawing",
      firstFrame: 1,
      lastFrame: 79,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
