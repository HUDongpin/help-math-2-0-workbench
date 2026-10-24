import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_010_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB10.swf",
  swfSha256: "a3d055db24d7e79357e29358948ad5a2bb998912b513816ead1b4c2889840c43",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB10.fla",
  flaSha256: "109bd23f770046e6925b27b49007ddc1e0894d2734ea9a1f1c192f6fd206f44f",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB10.mp3",
  associatedAudioSha256: "a43bcabf98e95eda6c14cbb199eacf8ccb8b92f6030b7a095a41a8d93afffb16",
  spriteObjectId: 60,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8026,"y":4885}),
  rootPlacementPixels: Object.freeze({"x":401.3,"y":244.25}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_VB_010_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-010",
  title: "course-g05-l03-vb-010 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_010_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-010/canvas-renderer.js",
  assetSha256: "9b21374b6103ad018952ab002ee2d1f8e5e258bacaa2fee51f967619b07708c6",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-60",
  mainFrameCount: 130,
  livePlaybackEndFrame: 124,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 125,
      "lastFrame": 130,
      "reason": "Frames 125..130 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-60-source-static-drawing",
      firstFrame: 1,
      lastFrame: 124,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_010_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
