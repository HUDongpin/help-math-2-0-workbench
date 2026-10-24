/** SWF-bound drawing configuration. Runtime/audio acceptance remains separate. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P003_DRAWING = {
  animationId: 'shared-alg001-l06-p003',
  title: 'Understanding Functions: Real World Activity',
  sourceSwfSha256: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p003/canvas-renderer.js',
  assetSha256: '87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-154',
  mainFrameCount: 719,
  livePlaybackEndFrame: 719,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  companionDomains: [{id: 'sprite-158', frameCount: 1, label: 'Root overlay'}],
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-154-source-drawing', firstFrame: 1, lastFrame: 719}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
