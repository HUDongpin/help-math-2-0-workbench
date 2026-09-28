import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";
import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";

export const COURSE_G04_L03_GS_002_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/GS/L3GS02.swf",
  swfSha256: "d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/GS/L3GS02.fla",
  flaSha256: "096d332d7572235e61c607c6230689713857144243b023026d43786bc5df8b1f",
  associatedAudio: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3GS02.mp3",
  associatedAudioSha256: "bb022576cb0f787245c17fdad4ef2d324115f7066fe2a9732ad27130ee86af68",
  associatedAudioTechnicalDurationMs: 50_880,
  spriteObjectId: 321,
  sourceLocalGameContract: "migrations/course-g04-l03-gs-002/audit/source-local-game-initial-contract.json",
  sourceLocalGameContractSha256: "8ad35175b671913aca904c27d375b3b918d551fce6ee965a90727b7f6c70c0e2",
  livePlaybackEndFrame: 427,
  postStopStaticInspectionFrame: 428,
  allowedVirusIndices: Object.freeze([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]),
  randomCall: Object.freeze({path: "DefineSprite_321/frame_427/DoAction.as",
    sha256: "6bb66f75b8d7f73919c82ce9ca2a5d79a3b7ae97e6695d6f41be90d2e6bf0262"}),
});

export const COURSE_G04_L03_GS_002_CONFIG = Object.freeze({
  animationId: "course-g04-l03-gs-002",
  title: "Game 1 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G04_L03_GS_002_SOURCE.swfSha256,
  assetSource: "/flash-assets/courses/course-g04-l03-gs-002/canvas-renderer.js",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-321",
  mainFrameCount: 428,
  livePlaybackEndFrame: COURSE_G04_L03_GS_002_SOURCE.livePlaybackEndFrame,
  playbackMode: "once",
  companionDomains: Object.freeze([
    [28, 1], [48, 1], [69, 35], [78, 3], [90, 7], [92, 1], [147, 12],
    [149, 10], [158, 15], [164, 1], [206, 2], [207, 1], [306, 6],
    [318, 16], [319, 186],
  ].map(([id, frameCount]) => Object.freeze({id: `sprite-${id}`, frameCount,
    label: "Statically reachable companion; runtime composition disabled"}))),
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "game-1-lead-in-source-static-drawing",
      firstFrame: 1,
      lastFrame: 426,
    }),
    Object.freeze({
      id: "game-1-source-local-initial-state",
      firstFrame: 427,
      lastFrame: 427,
    }),
    Object.freeze({
      id: "game-1-post-stop-structural-inspection",
      firstFrame: 428,
      lastFrame: 428,
    }),
  ]),
  sourceControlBehaviorLabel: "Frame 427 renders a deterministic current-JavaScript source-local initial game state; frame 428 is post-stop structural inspection only. Source buttons, input, movement, scoring, timer/feedback behavior, audio, and all ActionScript execution remain disabled",
} satisfies SourceStaticCanvasCandidateConfig);

/**
 * Acceptance-neutral successor used only behind the current-JavaScript game
 * controls. The preserved renderer above keeps its hash-bound frame-427
 * source-local initial overlay. This successor stops after source sprite 321
 * export case 426, whose source composition omits the initial ship and virus,
 * so React can own the sole actor/timer/score layer without altering pixels.
 */
export const COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG = Object.freeze({
  animationId: "course-g04-l03-gs-002-interaction-base",
  title: "Game 1 — interaction-only source clean base successor",
  sourceSwfSha256: COURSE_G04_L03_GS_002_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l03-gs-002/canvas-interaction-base-renderer.js",
  assetSha256:
    "7e4d352d925c65b1ba1d3d1329d95c690e27be4e2ed01e6683b10c2c12cd4797",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-321",
  mainFrameCount: 428,
  livePlaybackEndFrame: COURSE_G04_L03_GS_002_SOURCE.livePlaybackEndFrame,
  playbackMode: "once",
  companionDomains: Object.freeze([]),
  blockedFrameRanges: Object.freeze([
    Object.freeze({
      firstFrame: 1,
      lastFrame: 426,
      reason: "interaction-only successor is limited to public frame 427",
    }),
    Object.freeze({
      firstFrame: 428,
      lastFrame: 428,
      reason: "post-stop inspection is outside the interaction base contract",
    }),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "source-sprite321-case426-clean-interaction-base",
      firstFrame: 427,
      lastFrame: 427,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Frame 427 draws only source sprite 321 export case 426; the successor omits the source-local initial actor/timer/score overlay so the separate current-JavaScript React layer owns those visuals. This changes no fidelity or acceptance status",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L03_GS_002_AUTHORITY = SOURCE_STATIC_CANDIDATE_AUTHORITY;
