import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_RW_003_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/RW/L3RW03.swf",
  swfSha256: "f9808420c93fb05ccf9946b67f267766623a9c7b1dc57e2b8edde0ea1ca24f6b",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/RW/L3RW03.fla",
  flaSha256: "e3da78db35ef198bee4a18a9490562e537642ac1df2cb37502384c4b78f4e3e5",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3RW03.mp3",
  associatedAudioSha256: "4a036c7cd657528ee7ed2edd0706bbac29de6fb843d2a1fb8cd82413ae8d7edd",
  spriteObjectId: 71,
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

export const COURSE_G05_L03_RW_003_CONFIG = Object.freeze({
  animationId: "course-g05-l03-rw-003",
  title: "course-g05-l03-rw-003 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_RW_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-rw-003/canvas-renderer.js",
  assetSha256: "c4ccf91df6431f36435555d9bf6974994e5ba84e9724ac79a966b10350b3574f",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-71",
  mainFrameCount: 1590,
  livePlaybackEndFrame: 1590,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-71-source-static-drawing",
      firstFrame: 1,
      lastFrame: 1590,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_RW_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
