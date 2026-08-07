import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_TS_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS06.swf",
  swfSha256:
    "efa39aa768ba3b5712286641153b80dc2210ee7bc6cad1fe3a16932434b581d1",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/TS/L4TS06.fla",
  flaSha256:
    "a98ee8157cafcb2d99783a39661db173a1fbdac3a248d9475c1420fe476243dc",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4TS06.mp3",
  associatedAudioSha256:
    "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  spriteObjectId: 12,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_241, y: 5_668}),
  rootPlacementPixels: Object.freeze({x: 412.05, y: 283.4}),
});

export const COURSE_G05_L04_TS_006_CONFIG = Object.freeze({
  animationId: "course-g05-l04-ts-006",
  title:
    "Number Lines: 4 - Step Plan, Page 6 — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_TS_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-ts-006/canvas-renderer.js",
  assetSha256:
    "c05ebcfe5a7530662265994a5311a21a65c80404136b24988a687f12e0c0551c",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-12",
  mainFrameCount: 245,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "four-step-plan-page-6-source-drawing", firstFrame: 1, lastFrame: 245}),
  ]),
  sourceControlBehaviorLabel:
    "Legacy ActionScript, root controls, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_TS_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
