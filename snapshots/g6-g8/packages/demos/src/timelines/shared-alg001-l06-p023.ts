/** Source drawing plane. The player owns the single embedded-stream range,
 * four native glossary actions, and any independently selected SA audio. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P023_DRAWING = {
  animationId: 'shared-alg001-l06-p023',
  title: 'Domain',
  sourceSwfSha256: '40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p023/canvas-renderer.js',
  assetSha256: '537dc11715e7f7353e1bab5263a126516160328dde94976bce85c288ad61fa42',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-38', mainFrameCount: 410, livePlaybackEndFrame: 410,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-38-source-drawing', firstFrame: 1, lastFrame: 410}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
