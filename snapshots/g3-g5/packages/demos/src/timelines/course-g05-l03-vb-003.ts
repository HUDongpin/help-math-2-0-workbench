import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_003_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB03.swf",
  swfSha256: "6038575175198e0b7e76254b241f16c23244515b241db092e2abd895b3e5a704",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB03.fla",
  flaSha256: "03349d31da92a20720c843d1aea5ec6a6b0e2df3985856ae39f15ff07446104f",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB03.mp3",
  associatedAudioSha256: "cbf16ad545f639b35dd3b051494b3878b39d70a57c27b25805f0217a77dd703f",
  spriteObjectId: 381,
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

export const COURSE_G05_L03_VB_003_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-003",
  title: "course-g05-l03-vb-003 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_003_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-003/canvas-renderer.js",
  assetSha256: "a0a1969c9de211c30723379f35ad4f466ef896a1f46be4258c75865a02596049",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-381",
  mainFrameCount: 95,
  livePlaybackEndFrame: 39,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 40,
      "lastFrame": 95,
      "reason": "Frames 40..95 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-381-source-static-drawing",
      firstFrame: 1,
      lastFrame: 39,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_003_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
