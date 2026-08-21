import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_025_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN25.swf",
  swfSha256: "d7678b6fbb7c8d48bb0ca602d2170912140dfa07d56d239e0b4ffba51ef6bc6b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN25.fla",
  flaSha256: "296e2e153cca0af44f8e354fbe125503bb15fa98f57440d00c0e8c7462022243",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN25.mp3",
  associatedAudioSha256: "cbe703324e4672f6cc9a5ee8b3d13e9c62f25aa89104fdf43366da838aa47fe4",
  spriteObjectId: 164,
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

export const COURSE_G05_L03_IN_025_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-025",
  title: "course-g05-l03-in-025 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_025_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-025/canvas-renderer.js",
  assetSha256: "2036c8b758e342cf76c03eef2468e081679201329192508c2ea50039626cfe4c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-164",
  mainFrameCount: 346,
  livePlaybackEndFrame: 122,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 123,
      "lastFrame": 346,
      "reason": "Frames 123..346 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-164-source-static-drawing",
      firstFrame: 1,
      lastFrame: 122,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_025_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
