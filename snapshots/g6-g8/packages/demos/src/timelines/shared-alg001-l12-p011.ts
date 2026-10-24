import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const SHARED_ALG001_L12_P011_SOURCE = Object.freeze({
  calibrationId: 'g678-alg-l12-origin-local-candidate-v2',
  deploymentScope: 'local-only',
  source: {
    path: 'G6-G8-shared/ALG001/L12/VB/L12VB06.swf',
    sha256: 'c26cce962362fe8aa1782e3cf5c4f358f76f3276af9dce4b14cbe81e0e049655',
  },
  reviewedLane: 'interactive-understood',
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  strictAcceptanceEffect: 'none',
} as const);

export const SHARED_ALG001_L12_P011_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p011',
  title: 'Origin',
  sourceSwfSha256: SHARED_ALG001_L12_P011_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p011/canvas-renderer.js',
  assetSha256: '70bab6fd85db2afa782f987a241aef0abbf6deb5b98bffcca1146b440c541031',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-33',
  mainFrameCount: 118,
  livePlaybackEndFrame: 118,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-33-with-source-title', firstFrame: 1, lastFrame: 118}],
  sourceControlBehaviorLabel: 'Origin source glossary; My Lesson and audio acceptance pending.',
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);
