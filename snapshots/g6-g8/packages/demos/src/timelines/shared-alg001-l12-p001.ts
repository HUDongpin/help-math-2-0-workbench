import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";

export const SHARED_ALG001_L12_P001_SOURCE = Object.freeze({
  calibrationId: "g678-alg-l12-intro-source-static-local-v1",
  deploymentScope: "local-only",
  source: {
    path: "G6-G8-shared/ALG001/L12/IR/L12IR01.swf",
    sha256: "393da0d6755e706bf849a2cff0796823e129fa6bc7f438b93d09c05547679b67",
  },
  reviewedLane: "low",
  adapterFamily: "source-static-intro",
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  engineeringPreviewReady: false,
  strictAcceptanceEffect: "none",
} as const);

export const SHARED_ALG001_L12_P001_CONFIG = Object.freeze({
  animationId: "shared-alg001-l12-p001",
  title: "Graphing in the Coordinate Plane — Introduction",
  sourceSwfSha256: SHARED_ALG001_L12_P001_SOURCE.source.sha256,
  assetSource: "/flash-assets/g678-local/shared-alg001-l12-p001/canvas-renderer.js",
  assetSha256: "7e068cf04845b87d9e0e7a9391fdbffc402e5243e9a04b741235f1d25c05294c",
  stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
  nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-142",
  mainFrameCount: 130,
  livePlaybackEndFrame: 130,
  playbackMode: "once",
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [{id: "sprite-142-ffdec-drawing", firstFrame: 1, lastFrame: 130}],
  sourceControlBehaviorLabel:
    "Source-bound script-free Introduction; embedded audio, original runtime and acceptance remain open.",
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);
