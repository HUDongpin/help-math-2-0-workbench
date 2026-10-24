/** Source drawing contract; the My Lesson adapter owns audio and native text. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P008_DRAWING = {
  animationId: 'shared-alg001-l06-p008',
  title: 'Understanding Functions: Real World Activity',
  sourceSwfSha256: '6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p008/canvas-v1',
  assetSha256: 'ef40a85081b1cd131e3751fbaec8242a847592247f1b1992f681dd499309c33e',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-507', mainFrameCount: 938, livePlaybackEndFrame: 938,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [{id: 'sprite-510', frameCount: 1, label: 'Source title'}],
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-507-source-drawing', firstFrame: 1, lastFrame: 938}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
