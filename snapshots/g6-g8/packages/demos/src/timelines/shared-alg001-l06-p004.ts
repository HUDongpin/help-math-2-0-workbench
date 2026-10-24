/** Source-bound drawing domain. Maintained audio, glossary, and readable text live in the lesson adapter. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P004_DRAWING = {
  animationId: 'shared-alg001-l06-p004',
  title: 'Understanding Functions: Real World Activity',
  sourceSwfSha256: '514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p004/canvas-v1',
  assetSha256: '6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-95',
  mainFrameCount: 831,
  livePlaybackEndFrame: 831,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  companionDomains: [{id: 'sprite-98', frameCount: 1, label: 'Root overlay'}],
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-95-source-drawing', firstFrame: 1, lastFrame: 831}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
