import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_016_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN16.swf",
  swfSha256: "20bba4a338c10005508cef8a4d619848342f56e0c6a5cdc93cbed6e31ab6dc4d",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN16.fla",
  flaSha256: "633285ad0fe532e9a84dc4ea36c8a4f6c3aa74b47faba1976073bf387059588a",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN16.mp3",
  associatedAudioSha256: "3c6e0ce52222b6777e14a581c304223587c9845d9c40081c86c2f34070913d8b",
  spriteObjectId: 47,
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

export const COURSE_G05_L03_IN_016_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-016",
  title: "course-g05-l03-in-016 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_016_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-016/canvas-renderer.js",
  assetSha256: "cf064fea042893a4dbdadb2da7221ee1d5b2c8057b14b253d174ba0209c53c62",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-47",
  mainFrameCount: 579,
  livePlaybackEndFrame: 576,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 577,
      "lastFrame": 579,
      "reason": "Frames 577..579 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-47-source-static-drawing",
      firstFrame: 1,
      lastFrame: 576,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_016_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
