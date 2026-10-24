import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const SHARED_ALG001_L12_P002_SOURCE = Object.freeze({
  calibrationId: 'g678-alg-l12-p002-current-js-v1',
  deploymentScope: 'local-only',
  source: {
    path: 'G6-G8-shared/ALG001/L12/RW/L12RW02.swf',
    sha256: '15e67732b739f0194087ded0748c2d23f9871363ed33388807c351f2aad6fb62',
  },
  reviewedLane: 'interactive-understood',
  composition: {rootFrame: 6, mainSprite: 454, titleSprite: 458, frameShape: 459},
  audioPlaybackEnabled: false,
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  strictAcceptanceEffect: 'none',
} as const);

export const SHARED_ALG001_L12_P002_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p002',
  title: 'Graphing in the Coordinate Plane: Real World Activity',
  sourceSwfSha256: SHARED_ALG001_L12_P002_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p002/canvas-renderer.js',
  assetSha256: '993722d3cf0c30601805005fe8b750cecf50620a9b6692f5628f342184b4a3e4',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-454',
  mainFrameCount: 1951,
  livePlaybackEndFrame: 1951,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [
    {id: 'sprite-454-with-root-title-and-frame', firstFrame: 1, lastFrame: 1951},
  ],
  sourceControlBehaviorLabel:
    'Source-composed drawing only; embedded stream and lesson-SA audio are disabled pending source timing and listening review.',
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);
