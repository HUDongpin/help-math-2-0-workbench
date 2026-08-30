import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_FQ_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/FQ/L3FQ02.swf",
  swfSha256: "92cf7837137f61e1fa912d08caf936b0016971af069c5a10be04fd89a4308ced",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "embedded-swf-stream-container",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/FQ/L3FQ02.swf",
  associatedAudioSha256: "92cf7837137f61e1fa912d08caf936b0016971af069c5a10be04fd89a4308ced",
  spriteObjectId: 729,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":7350,"y":4322}),
  rootPlacementPixels: Object.freeze({"x":367.5,"y":216.1}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_FQ_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-fq-002",
  title: "course-g05-l03-fq-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_FQ_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-fq-002/canvas-renderer.js",
  assetSha256: "579f4ae0acce86490a29e80b9f210252aa775974680974d50f77f297851890f6",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-729",
  mainFrameCount: 68,
  livePlaybackEndFrame: 42,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 43,
      "lastFrame": 68,
      "reason": "Frames 43..68 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-729-source-static-drawing",
      firstFrame: 1,
      lastFrame: 42,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_FQ_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
