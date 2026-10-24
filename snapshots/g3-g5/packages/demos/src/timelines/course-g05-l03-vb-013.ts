import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L03_VB_013_SOURCE = Object.freeze({
  releaseId: "lesson-g05-l03-exponents-prime-factorizations-page-only",
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB13.swf",
  swfSha256: "734dd8a09ddb0b140bdc920324a6701707d910129096a9d36bf9fe08e493b6b3",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/VB/L3VB13.fla",
  flaSha256: "2d8288e9ef18e180ef2345a15d2f901646d9ee8a9b6d51ff96108defdda2eecc",
  associatedAudioKind: "external-file",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L3/SA/L3VB13.mp3",
  associatedAudioSha256: "71d219c617a378c042889b67db24c1b6f218cd8914b7cf18ce4f1ec3c0fdd9f7",
  spriteObjectId: 199,
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

export const COURSE_G05_L03_VB_013_CONFIG = Object.freeze({
  animationId: "course-g05-l03-vb-013",
  title: "course-g05-l03-vb-013 — Exponents & Prime Factorizations — G5 L3 source-static product slice",
  sourceSwfSha256: COURSE_G05_L03_VB_013_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g05-l03-vb-013/canvas-renderer.js",
  assetSha256: "11abb41115d23882cf9622091257e7a5e15b11eea7f3d58b17fd430a9fdd53a1",
  stage: Object.freeze({"width":800,"height":600,"backgroundColor":"#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-199",
  mainFrameCount: 225,
  livePlaybackEndFrame: 126,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    {
      "firstFrame": 127,
      "lastFrame": 225,
      "reason": "Frames 127..225 begin at the first source nonterminal stop; later visual states require unresolved ActionScript, interaction, host, random, or feedback traversal."
    }
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-199-source-static-drawing",
      firstFrame: 1,
      lastFrame: 126,
    }),
  ]),
  sourceControlBehaviorLabel:
    "ActionScript, source controls, audio, Spanish visual disposition, behavior-dependent frames, natural runtime, terminal state, Replay, and fidelity remain separate unresolved gates",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L03_VB_013_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
