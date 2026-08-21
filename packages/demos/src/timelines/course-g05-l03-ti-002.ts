import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI02.swf",
  swfSha256: "b465537749366473edd49ff7587acb54a88c96b57287d7a9c46732b2b40e699c",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI02.fla",
  flaSha256: "57a6c0e99606c0a3ecc641851fc13beb0e275ffea5e3b7a7aab80fa8c2653ba1",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI02.mp3",
  associatedAudioSha256: "d440f055061c25644c293e8ce1d41c46120bb6e18d4e22f89b807302457c2c0e",
  spriteObjectId: 258,
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

export const COURSE_G05_L03_TI_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-002",
  title: "course-g05-l03-ti-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-002/canvas-renderer.js",
  assetSha256: "8b4d61b1fc26c88aa5cf5d0433ad162a50b163d3704f4c900c65e30d049efaf3",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-258",
  mainFrameCount: 301,
  livePlaybackEndFrame: 282,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 283,
      "lastFrame": 301,
      "reason": "Frames 283..301 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-258-source-static-drawing",
      firstFrame: 1,
      lastFrame: 282,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
