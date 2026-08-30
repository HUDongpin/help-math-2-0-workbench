import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_006_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB06.swf",
  swfSha256: "38fd37e0d2b73329ba7080f466ee582a659f0eeabb0d84c8ac8d5155232232eb",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB06.fla",
  flaSha256: "e54014f150dc5a2f0dd6797a34bb7d60a9891b103e0178d5fe5da5c2c21155a3",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB06.mp3",
  associatedAudioSha256: "ebe5e0180006e1b8e3d002bcad0bf7a0081423d6041f3d35c224101248e54c52",
  spriteObjectId: 26,
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

export const COURSE_G05_L03_VB_006_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-006",
  title: "course-g05-l03-vb-006 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_006_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-006/canvas-renderer.js",
  assetSha256: "cbfad50fcaecde53beeab29d14a7f5b252122523bcb500c84d62fd34ec4cc9e9",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-26",
  mainFrameCount: 306,
  livePlaybackEndFrame: 306,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-26-source-static-drawing",
      firstFrame: 1,
      lastFrame: 306,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_006_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
