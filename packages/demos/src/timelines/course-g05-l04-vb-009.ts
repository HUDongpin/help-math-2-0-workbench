import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_VB_009_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB09.swf",
  swfSha256:
    "83439d13b2c967eb035c08459ae712ccb950d5f41450fa823271dc5ded178b9f",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB09.fla",
  flaSha256:
    "f5282098dec244928710c939e55fb8854418a95200a3acef3da2e4a0739ea12e",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB09.mp3",
  associatedAudioSha256:
    "a77734966226bebd0435556520d137f47c2cc394226845277fa310068b5e7a8e",
  spriteObjectId: 51,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G05_L04_VB_009_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-009",
  title:
    "Number Lines: Negative Integers — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_009_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-009/canvas-renderer.js",
  assetSha256:
    "3d63ad097db4e2d1082a17b427296406f01c62b770376d75bbfe264647848bee",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-51",
  mainFrameCount: 189,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "negative-integers-source-drawing", firstFrame: 1, lastFrame: 189}),
  ]),
  sourceControlBehaviorLabel:
    "Four source buttons, legacy ActionScript, embedded audio, associated audio, Spanish visuals, and Replay are disabled; once is a current-JavaScript clamp only",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_009_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
