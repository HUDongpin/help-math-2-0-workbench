import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_004_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI04.swf",
  swfSha256: "51552b1d224c54b4edbe13dd96434e6ffd6559148571680eecab3c9651f536d5",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI04.fla",
  flaSha256: "54f32ef14292aa945d873646151e7f6d12f7c3be20d5cdf2b04ddc31300cc45f",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI04.mp3",
  associatedAudioSha256: "a3dc5207ab27f9c88a52f8f61a67aace8cef6bf0c146018398bb54808e765a72",
  spriteObjectId: 217,
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

export const COURSE_G05_L03_TI_004_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-004",
  title: "course-g05-l03-ti-004 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_004_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-004/canvas-renderer.js",
  assetSha256: "4f77d5fcea3a4ab84fcb577d4ed46c47b0fd3d9482bc39bbb96273614109710b",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-217",
  mainFrameCount: 284,
  livePlaybackEndFrame: 136,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 137,
      "lastFrame": 284,
      "reason": "Frames 137..284 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-217-source-static-drawing",
      firstFrame: 1,
      lastFrame: 136,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_004_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
