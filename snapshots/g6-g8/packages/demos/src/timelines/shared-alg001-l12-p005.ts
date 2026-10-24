import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const SHARED_ALG001_L12_P005_SOURCE = Object.freeze({
  deploymentScope: 'local-only',
  source: {
    path: 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf',
    sha256: 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe',
  },
  reviewedLane: 'behavior-heavy',
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  audioPlaybackEnabled: false,
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  strictAcceptanceEffect: 'none',
  audioHold: 'Source stream gap340-383 and signed seek headers require a validated clock; do not play concatenated MP3 continuously.',
} as const);

export const SHARED_ALG001_L12_P005_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p005',
  title: 'Page 4',
  sourceSwfSha256: SHARED_ALG001_L12_P005_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p005/canvas-renderer.js',
  assetSha256: '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-391',
  mainFrameCount: 968,
  livePlaybackEndFrame: 968,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  companionDomains: [
    {id: 'sprite-78', frameCount: 36, label: 'Source child 78'},
    {id: 'sprite-147', frameCount: 22, label: 'Source child 147'},
    {id: 'sprite-258', frameCount: 63, label: 'Source child 258'},
    {id: 'sprite-289', frameCount: 63, label: 'Source child 289'},
    {id: 'sprite-306', frameCount: 54, label: 'Source child 306'},
    {id: 'sprite-346', frameCount: 20, label: 'Source child 346'},
    {id: 'sprite-395', frameCount: 1, label: 'Source title'},
  ],
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite391-root-title-border-opaque-clipping', firstFrame: 1, lastFrame: 968}],
  sourceControlBehaviorLabel: 'Source main terminal stop at968. Six source-timed nested drawings; independent natural traces and audio synchronization pending.',
  showEngineeringDisclosure: true,
} satisfies SourceStaticCanvasCandidateConfig);
