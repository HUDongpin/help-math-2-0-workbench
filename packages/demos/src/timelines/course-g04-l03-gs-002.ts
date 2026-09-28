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

export const COURSE_G04_L03_GS_002_SPRITE_319_CAPTURE = Object.freeze({
  animationId: "course-g04-l03-gs-002",
  frameDomain: "sprite-319",
  localFrameCount: 186,
  rootEntryFrame: 6,
  scenario: "source-static-reachable-domain",
  language: "en" as const,
  sourceFrame: 428,
  sourceFrameDomain: "sprite-321",
  sourceScenario: "source-static-frame",
  behaviorCompositeContractId:
    "g04-l03-gs-002-parent-composite-observability-v1",
  behaviorCompositeStatePrefix: "sprite319-p01-target-frame-",
  assetKey: "course-g04-l03-gs-002-parent-composite",
  assetSource:
    "/flash-assets/courses/course-g04-l03-gs-002-parent-composite/canvas-renderer.js",
  assetSha256:
    "de9057d5e2d1ddf8c562acd92124a5a379173736cc0edd3b4f55af674b8b3556",
  assetManifest:
    "public/flash-assets/courses/course-g04-l03-gs-002-parent-composite/manifest.json",
  assetManifestSha256:
    "950a3f0dd943ece3c172570f6e4e92f12422c7567f92ad5184f1b4b7bc6ba168",
  assetReport: "reports/g4-l3-parent-composite-assets.json",
  assetReportSha256:
    "4da7012b4bcd9821a9ddbe28944ab834830ff5bd58946209ab4821f39831bd2d",
  uniqueTargetVisualCount: 103,
  authority:
    "source-static-parent-composite-frame-override-not-original-runtime-or-fidelity",
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L03_GS_002_SPRITE_319_CONFIG = Object.freeze({
  animationId: COURSE_G04_L03_GS_002_SPRITE_319_CAPTURE.assetKey,
  title: "Game 1 sprite-319 source-static behavior-composite diagnostic",
  sourceSwfSha256: COURSE_G04_L03_GS_002_SOURCE.swfSha256,
  assetSource: COURSE_G04_L03_GS_002_SPRITE_319_CAPTURE.assetSource,
  assetSha256: COURSE_G04_L03_GS_002_SPRITE_319_CAPTURE.assetSha256,
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-321",
  mainFrameCount: 428,
  playbackMode: "once",
  sourceBehaviorCompositeContractId:
    COURSE_G04_L03_GS_002_SPRITE_319_CAPTURE.behaviorCompositeContractId,
  showEngineeringDisclosure: false,
  visualMarkers: Object.freeze([Object.freeze({
    id: "sprite-319-source-static-parent-composite",
    firstFrame: 428,
    lastFrame: 428,
  })]),
  sourceControlBehaviorLabel:
    "AVM1, natural reachability, audio, Spanish visual parity, fidelity, human review, and Owner acceptance remain disabled",
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

import type {CourseG04L03SourceGlossaryConfig} from "./course-g04-l03-source-glossary-interaction";

// Source Button 17/18 placements at frames 86–425; no AVM1 execution.
export const COURSE_G04_L03_GS_002_GLOSSARY_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: "positive-sign-f86",
    characterId: 17,
    keyAttribute: "Positive sign",
    firstFrame: 86,
    lastFrame: 425,
    depth: 28,
    sourceBounds: Object.freeze({"left": 196.5, "right": 279.9277038574219, "top": 114.25, "bottom": 129.79764556884766}),
    entryIds: Object.freeze({"en": "en-0500-775c58d3252e", "es": "es-0629-c57c3426838b"}),
    labels: Object.freeze({"en": "Positive sign", "es": "Signo positivo"}),
  }),
  Object.freeze({
    id: "negative-sign-f86",
    characterId: 18,
    keyAttribute: "Negative sign",
    firstFrame: 86,
    lastFrame: 425,
    depth: 30,
    sourceBounds: Object.freeze({"left": 137.9, "right": 228.4024185180664, "top": 135.8, "bottom": 150.5781219482422}),
    entryIds: Object.freeze({"en": "en-0412-b773bc431c0b", "es": "es-0628-56899e0c404a"}),
    labels: Object.freeze({"en": "Negative sign", "es": "Signo negativo"}),
  }),
]);
export const COURSE_G04_L03_GS_002_GLOSSARY_CONFIG = Object.freeze({
  animationId: "course-g04-l03-gs-002",
  frameDomain: "sprite-321",
  terms: COURSE_G04_L03_GS_002_GLOSSARY_HOTSPOTS,
  playbackDisposition: "reversible-support-pause",
  sourceAction: "DoHyperLinks",
  sourceStopTarget: "_root.animation_mc.animation.stop()",
  glossaryAuthority: "grade-wide-shell-keyterms-static-candidate",
  glossarySourceDisposition: "unresolved-lesson-vs-grade-wide",
} satisfies CourseG04L03SourceGlossaryConfig);
