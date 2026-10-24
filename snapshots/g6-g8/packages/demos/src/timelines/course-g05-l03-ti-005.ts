import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_005_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI05.swf",
  swfSha256: "e9cbc2dd4f1e0f8a5c4de8b3f22b18647e9e8b59a2949499601408d1648482d0",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI05.fla",
  flaSha256: "1c8f46170b311e836fca55ef971300e9dd7719507d4b3ce27080e8843c7dcb0e",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI05.mp3",
  associatedAudioSha256: "df3367285f89c071a145b82b4b4eb23c202903c888a194ac74086b26eefdda15",
  spriteObjectId: 180,
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

export const COURSE_G05_L03_TI_005_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-005",
  title: "course-g05-l03-ti-005 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_005_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-005/canvas-renderer.js",
  assetSha256: "1becaef8146e38db3a996fec196473de08c122ef8e37f3880fa42aa72ce2a9e2",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-180",
  mainFrameCount: 250,
  livePlaybackEndFrame: 51,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 52,
      "lastFrame": 250,
      "reason": "Frames 52..250 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-180-source-static-drawing",
      firstFrame: 1,
      lastFrame: 51,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_005_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
