/** Source drawing plane; the maintained player owns the quiz and independent audio domains. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P024_DRAWING = {
  animationId: 'shared-alg001-l06-p024',
  title: 'Range',
  sourceSwfSha256: 'e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p024/canvas-renderer.js',
  assetSha256: 'e23b1e17c8c9a87b2c6165ac4e22a4710d221f0a70ef3cbe1c24fde343093070',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-208', mainFrameCount: 381, livePlaybackEndFrame: 381,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-208-source-drawing', firstFrame: 1, lastFrame: 381}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
