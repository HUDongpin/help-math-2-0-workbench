import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_IN_002_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN02.swf",
  swfSha256: "7e87f101d993198a56afb549cbfd7061a39c35d40774cfa334ff694a6948ac29",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/IN/L3IN02.fla",
  flaSha256: "2a9b3c4ba3a17644795438c80ef6a2f259bbe78e985399c5b574e2d9a8c08e52",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3IN02.mp3",
  associatedAudioSha256: "3d000ea83223ef4cb349792cfad1f9104dda1f4efd4fb8fb944ff897a89c4eec",
  spriteObjectId: 184,
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

export const COURSE_G05_L03_IN_002_CONFIG = Object.freeze({
  animationId: "course-g05-l03-in-002",
  title: "course-g05-l03-in-002 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_IN_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-in-002/canvas-renderer.js",
  assetSha256: "42af47d8d044e99b44eef74ee39934d16af9bf761310471211a9d0114a6ba145",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 11,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-184",
  mainFrameCount: 702,
  livePlaybackEndFrame: 702,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-184-source-static-drawing",
      firstFrame: 1,
      lastFrame: 702,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_IN_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
