import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_RW_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/RW/L3RW02.swf",
  swfSha256: "d78c8c08ef795694fe06cc88394e2cc80bbe8a8a16aa96e920bb7470f592e5da",
  pairedFlaStatus: "missing",
  fla: null,
  flaSha256: null,
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3RW02.mp3",
  associatedAudioSha256: "c50e97f070146f111dd5d6ba36bfa9421d3aa79108da98146c1ad2ebac1996cd",
  spriteObjectId: 313,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "Animation",
  rootPlacementTwips: Object.freeze({"x":7219,"y":5460}),
  rootPlacementPixels: Object.freeze({"x":360.95,"y":273}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_RW_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-rw-002",
  title: "course-g05-l03-rw-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_RW_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-rw-002/canvas-renderer.js",
  assetSha256: "e06019413ca850b231f220616e7e8a7d3ed104e02ca5b4cc4435820e39ff3e7c",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-313",
  mainFrameCount: 1745,
  livePlaybackEndFrame: 1745,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-313-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1745,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_RW_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
