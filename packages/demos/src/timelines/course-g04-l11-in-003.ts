import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G04_L11_IN_003_SOURCE = Object.freeze({
  releaseId: "lesson-g04-l11-coordinate-grid",
  releaseOrdinal: 15,
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN03.swf",
  swfSha256:
    "4e7de4f04322e5460b468c3ea066f56345fc345bcd10fca40ed990eefc695885",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/IN/L11IN03.fla",
  flaSha256:
    "9a1a87174c0b71814ef521c48bc7e1de1dee83637d1a061d44a923db8b12ee1f",
  sourceStaticFrameDomain: "sprite-109",
  sourceStaticFrameCount: 781,
  rootBeginFrame: 6,
  rootPlacement: Object.freeze({
    instanceName: "animation",
    depth: "3",
    placementTwips: Object.freeze({x: 8_248, y: 5_666}),
    placementPixels: Object.freeze({x: 412.4, y: 283.3}),
  }),
  candidateManifest:
    "public/flash-assets/courses/course-g04-l11-in-003/manifest.json",
  candidateManifestSha256:
    "662276719290af1c7163c603ca0985d427d94d1755906c8228b3c584886142d0",
  actionScriptExecuted: false,
  sourceEmbeddedAudioEnabled: false,
  sourceEmbeddedAudioAccepted: false,
  sourceExternalSpanishAudioEnabled: false,
  sourceExternalSpanishAudioAccepted: false,
  sourceButtonDefinitionCount: 6,
  modernPedagogicalControlCount: 6,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellIncluded: false,
  registered: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_IN_003_CONFIG = Object.freeze({
  animationId: "course-g04-l11-in-003",
  title: "Locate Points on a Coordinate Grid — unregistered Lesson-internal instruction candidate",
  sourceSwfSha256: COURSE_G04_L11_IN_003_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g04-l11-in-003/canvas-renderer.js",
  assetSha256:
    "eb8ebf3bb534cc201a0cf75c3260ff8ce43795a4157b199e16361658afc1d26a",
  stage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  nativeStage: Object.freeze({
    width: 800,
    height: 600,
    backgroundColor: "#b8d8f7",
  }),
  backingStage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-109",
  mainFrameCount: 781,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "sprite-109-ffdec-source-static-drawing",
      firstFrame: 1,
      lastFrame: 781,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Six glossary controls are locally modernized outside the generated Canvas runtime; legacy globals, Shell navigation, player chrome, embedded narration, external Spanish audio, unproved Spanish source visuals, natural entry, and terminal behavior remain disabled or unresolved",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G04_L11_IN_003_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
