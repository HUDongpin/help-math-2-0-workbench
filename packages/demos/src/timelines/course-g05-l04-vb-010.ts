import {SOURCE_STATIC_CANDIDATE_AUTHORITY} from "../source-static-candidate-authority";
import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

const BLOCKED_REASON =
  "Frames 36..88 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.";

export const COURSE_G05_L04_VB_010_SOURCE = Object.freeze({
  swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB10.swf",
  swfSha256:
    "f6791a43f2abf60b9b76a6eb50e3b32886389a4474372198ead760398bc8d224",
  pairedFlaStatus: "present",
  fla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/VB/L4VB10.fla",
  flaSha256:
    "1927673cd35dcd3a4550799bcbf1b36af15aac3f6a56561b7aadd5607ae21530",
  associatedAudio:
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4VB10.mp3",
  associatedAudioSha256:
    "5be41765d7cff865f231fdb425b69a40ca7e1e50ce458bf125ba205c33812876",
  spriteObjectId: 228,
  rootPreloaderStopFrame: 1,
  rootBeginFrame: 6,
  rootPlacementName: "animation",
  rootPlacementTwips: Object.freeze({x: 8_248, y: 5_666}),
  rootPlacementPixels: Object.freeze({x: 412.4, y: 283.3}),
});

export const COURSE_G05_L04_VB_010_CONFIG = Object.freeze({
  animationId: "course-g05-l04-vb-010",
  title: "Integers Practice — English source-static engineering candidate",
  sourceSwfSha256: COURSE_G05_L04_VB_010_SOURCE.swfSha256,
  assetSource:
    "/flash-assets/courses/course-g05-l04-vb-010/canvas-renderer.js",
  assetSha256:
    "f4ee5f0dc04ad767abe51f255114b969b87b89c0a546a0fe3f2bcf57e3682bd7",
  stage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-228",
  mainFrameCount: 88,
  livePlaybackEndFrame: 35,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: Object.freeze([
    Object.freeze({firstFrame: 36, lastFrame: 88, reason: BLOCKED_REASON}),
  ]),
  visualMarkers: Object.freeze([
    Object.freeze({
      id: "integers-practice-page-10-source-drawing",
      firstFrame: 1,
      lastFrame: 35,
    }),
  ]),
  sourceControlBehaviorLabel:
    "Quiz answer and feedback frames 36..88, source controls, audio, Spanish visuals, and Replay are disabled",
} satisfies SourceStaticCanvasCandidateConfig);

export const COURSE_G05_L04_VB_010_AUTHORITY =
  SOURCE_STATIC_CANDIDATE_AUTHORITY;
