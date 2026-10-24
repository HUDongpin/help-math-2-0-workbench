/** Source drawing only. The maintained player owns one continuous main stream,
 * five glossary keys across seven source instances, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P018_DRAWING = {
  animationId: 'shared-alg001-l06-p018',
  title: 'Evaluate',
  sourceSwfSha256: '400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p018/canvas-renderer.js',
  assetSha256: '0204230c05b37bc076ae7510bbb4f6ef56b25d1fe50945f2bbb35e43521e88c6',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-32', mainFrameCount: 648, livePlaybackEndFrame: 648,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-32-source-drawing', firstFrame: 1, lastFrame: 648}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
