import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_015_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN15.swf",
  swfSha256: "622161f524469d4ef83692e9b1fffc1af06a978d3800886b5ad56a2a8197b3da",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN15.fla",
  flaSha256: "38055037f9fbbbcd89e8bb40f7d059acd71e1d12579c71ff8d573a36b34a678b",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN15.mp3",
  associatedAudioSha256: "6f2e8c80914df77cc68416896f12293664872b13016131c03de3c794f7446d95",
  spriteObjectId: 236,
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

export const COURSE_G05_L03_IN_015_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-015",
  title: "course-g05-l03-in-015 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_015_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-015/canvas-renderer.js",
  assetSha256: "add867056a52d95f23bc2c771a065ccc8e19387c4621edd4a06486bd05a58f28",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-236",
  mainFrameCount: 302,
  livePlaybackEndFrame: 300,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 301,
      "lastFrame": 302,
      "reason": "Frames 301..302 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-236-source-static-drawing",
      firstFrame: 1,
      lastFrame: 300,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_015_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
