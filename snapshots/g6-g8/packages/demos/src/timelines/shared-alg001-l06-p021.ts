/** Source drawing only. The maintained player owns one continuous main stream,
 * six glossary keys across six source instances, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P021_DRAWING = {
  animationId: 'shared-alg001-l06-p021',
  title: 'Set of Function Values',
  sourceSwfSha256: '4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p021/canvas-renderer.js',
  assetSha256: 'f3af3d1445601440dbfa0ab8fce83bc9e6dd499ce14885d9e63c2ac2d80e0ca6',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-43', mainFrameCount: 377, livePlaybackEndFrame: 377,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-43-source-drawing', firstFrame: 1, lastFrame: 377}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
