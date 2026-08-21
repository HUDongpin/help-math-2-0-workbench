import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_TI_006_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/TI/L3TI06.swf",
  swfSha256: "4c5fca28988917e505fe9b3a90237c2dd312d9efc1bf5edc6126d882c206e5b7",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3TI06.mp3",
  associatedAudioSha256: "ec0884eaf412805e568b69c25134e757714f22b0bab306b7d71c54b2ec3c4b91",
  spriteObjectId: 138,
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

export const COURSE_G05_L03_TI_006_CONFIG = Object.freeze({
  animationId: "course-g05-l03-ti-006",
  title: "course-g05-l03-ti-006 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_TI_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-ti-006/canvas-renderer.js",
  assetSha256: "8f34f90bd0360dd12cf93609d1cdb586e15b15a7950908010ae9917b34e392cf",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-138",
  mainFrameCount: 186,
  livePlaybackEndFrame: 184,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 185,
      "lastFrame": 186,
      "reason": "Frames 185..186 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-138-source-static-drawing",
      firstFrame: 1,
      lastFrame: 184,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_TI_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
