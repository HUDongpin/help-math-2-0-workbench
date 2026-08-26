import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_005_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN05.swf",
  swfSha256: "e150f7dfd7b5e5d3b4ac9cf3fbf12db3bc5532c18bcfb14d20a76f7f308af0ce",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN05.mp3",
  associatedAudioSha256: "f9019725f3cdb670225ebeed42854c1eddb036aba825efc39dff197b14fa6dd3",
  spriteObjectId: 242,
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

export const COURSE_G05_L03_IN_005_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-005",
  title: "course-g05-l03-in-005 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-005/canvas-renderer.js",
  assetSha256: "573c6b42ef5c12913c8793c74e788a6b2399940ce22543021e35cd64e847db50",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-242",
  mainFrameCount: 311,
  livePlaybackEndFrame: 305,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 306,
      "lastFrame": 311,
      "reason": "Frames 306..311 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-242-source-static-drawing",
      firstFrame: 1,
      lastFrame: 305,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
