import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const COURSE_G05_L04_VB_006_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB06.swf",
  swfSha256:
    "4da6a1a556e786e560aa489e566667ef0ff14de9a829428c844661d419271f5a",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB06.fla",
  flaSha256:
    "b534e62503edf5d1266c6718f631081e077a0cc4ec92a70bdcd3763d67bdad05",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB06.mp3",
  associatedAudioSha256:
    "53133ac7e563c4720a14ba17e9a91c12df363f470aeb933b2a6133dbc97e4f3f",
  spriteObjectId: 42,
  rootBeginFrame: 6,
  rootPlacementTwips: Object.freeze({x: 8_026, y: 4_885}),
  rootPlacementPixels: Object.freeze({x: 401.3, y: 244.25}),
});

export const COURSE_G05_L04_VB_006_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-006",
  title:
    "Number Lines: Important Words — Opposites — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_006_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-006/canvas-renderer.js",
  assetSha256:
    "0b64b9a1d28af78ec44dc5cac48b76e263556187fec31c46f721bf4e41b2b2fa",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-42",
  mainFrameCount: 166,
  playbackMode: "once",
  strictCaptureIdentity: true,
  visualMarkers: Object.freeze([
    Object.freeze({id: "opposites-vocabulary-source-drawing", firstFrame: 1, lastFrame: 166}),
  ]),
  sourceControlBehaviorLabel:
    "Four source vocabulary buttons, host callbacks, embedded audio, associated audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_006_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
