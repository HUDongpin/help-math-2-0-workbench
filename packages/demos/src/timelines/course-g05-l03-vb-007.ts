import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_007_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB07.swf",
  swfSha256: "dcbe6f35492b852afeba19909ce132e00314f4d2e7ea1713b4488b146157726a",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB07.fla",
  flaSha256: "6e0abf8f8190cc1d777237d2063f9865b7730691f3cc4b2fd88f7db043ba97fa",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB07.mp3",
  associatedAudioSha256: "d414159e0bf3a9dea0a82e52e9d2c009842e3d496b3bc8d5b5ce942d696e7d79",
  spriteObjectId: 65,
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

export const COURSE_G05_L03_VB_007_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-007",
  title: "course-g05-l03-vb-007 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_007_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-007/canvas-renderer.js",
  assetSha256: "0b4b115212d33b43edf2e65790423775b18039b0e2c897d5dfdb0b4bad306415",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-65",
  mainFrameCount: 248,
  livePlaybackEndFrame: 184,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 185,
      "lastFrame": 248,
      "reason": "Frames 185..248 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-65-source-static-drawing",
      firstFrame: 1,
      lastFrame: 184,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_007_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
