/** Source drawing only. The maintained player owns the four main audio ranges,
 * six glossary actions, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P015_DRAWING = {
  animationId: 'shared-alg001-l06-p015',
  title: 'Function (Input-Output Concept)',
  sourceSwfSha256: 'd0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p015/canvas-renderer.js',
  assetSha256: '4a572881adce44d318329f8895458eed8f63e8679e41ebfd38bbb3f0ee3dcb55',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-270', mainFrameCount: 914, livePlaybackEndFrame: 914,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-270-source-drawing', firstFrame: 1, lastFrame: 914}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
