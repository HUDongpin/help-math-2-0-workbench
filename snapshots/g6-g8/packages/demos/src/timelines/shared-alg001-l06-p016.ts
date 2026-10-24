/** Source drawing only. The maintained player owns two main audio ranges,
 * the explicit Function action, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P016_DRAWING = {
  animationId: 'shared-alg001-l06-p016',
  title: 'Function (Cause-Effect Concept)',
  sourceSwfSha256: '2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p016/canvas-renderer.js',
  assetSha256: '3f6fddbf841d5cac7e28f1112971faed148c89160a8529ba81a30e12ab146b3a',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-139', mainFrameCount: 815, livePlaybackEndFrame: 815,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-139-source-drawing', firstFrame: 1, lastFrame: 815}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
