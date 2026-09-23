import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_019_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN19.swf",
  swfSha256: "dcb4087cb535503f0ad092346fde5047cd942ec0a7418ff09e2e48260b6634fe",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN19.fla",
  flaSha256: "d5569a334311d323b84a26e34fc8934c8f04c17d4a98611f9360f4e2bf47de09",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN19.mp3",
  associatedAudioSha256: "e171d4e06901bbd7aea9c379f0519cb7c85d83cf2587c9def12c3ef579ddc3c3",
  spriteObjectId: 33,
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

export const COURSE_G05_L03_IN_019_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-019",
  title: "course-g05-l03-in-019 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_019_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-019/canvas-renderer.js",
  assetSha256: "cc774a47b45483039d0b20248c154737d78f1e6e1f83ae3d08ebacb7e9459f73",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-33",
  mainFrameCount: 752,
  livePlaybackEndFrame: 750,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 751,
      "lastFrame": 752,
      "reason": "Frames 751..752 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-33-source-static-drawing",
      firstFrame: 1,
      lastFrame: 750,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_019_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
