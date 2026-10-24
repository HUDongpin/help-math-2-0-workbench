import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_008_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB08.swf",
  swfSha256: "fdcd84ffcd3e26b90e8cd323256db035d0b54314062df982740f8858ece93197",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB08.fla",
  flaSha256: "8105473586c72819ed1c3e000b85e01a57fb06e8c6a20fbaae9c72c81db89fe6",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB08.mp3",
  associatedAudioSha256: "b48fcc8f8fa381c087a6f30002e29f934bef345532a21f1d404a04aab9116c69",
  spriteObjectId: 32,
  rootPreloaderStopFrame: 1,
  rootPreloaderNavigationFrame: 1,
  rootPreloaderNavigationAction: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");",
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({"x":8026,"y":4885}),
  rootPlacementPixels: Object.freeze({"x":401.3,"y":244.25}),
  actionScriptExecuted: false,
  audioRendered: false,
  sourceControlsEnabled: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G05_L03_VB_008_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-008",
  title: "course-g05-l03-vb-008 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_008_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-008/canvas-renderer.js",
  assetSha256: "fcd3f91c1048e354747574c3c1e2633c65e6c98ce4a07381cfc70ee6e5747c09",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-32",
  mainFrameCount: 154,
  livePlaybackEndFrame: 154,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-32-source-static-drawing",
      firstFrame: 1,
      lastFrame: 154,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_008_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
