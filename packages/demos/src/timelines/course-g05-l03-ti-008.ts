import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_008_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI08.swf",
  swfSha256: "0ab5ba1eebaaa89be81a0c65dd06230fa80611382e24843498d11f81a6bad612",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI08.fla",
  flaSha256: "a5227311ef1c8237c780d2669340772d196fb95ade018e07af4d5c49d600ca2f",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI08.mp3",
  associatedAudioSha256: "c0e521fbc82301290a63fd8e890679e87a1edb6d3aad6a66eaeaaf0254978b76",
  spriteObjectId: 240,
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

export const COURSE_G05_L03_TI_008_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-008",
  title: "course-g05-l03-ti-008 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-008/canvas-renderer.js",
  assetSha256: "bbda43c98f9e00ed7b971d47d0705cc24d68ee1302298b7c5d98bc1804fd8dea",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-240",
  mainFrameCount: 225,
  livePlaybackEndFrame: 48,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 49,
      "lastFrame": 225,
      "reason": "Frames 49..225 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-240-source-static-drawing",
      firstFrame: 1,
      lastFrame: 48,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
