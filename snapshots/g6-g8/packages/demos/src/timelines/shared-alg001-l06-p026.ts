/** Source drawing plane. Player owns two separate main audio ranges and explicit optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P026_DRAWING = {
  animationId: 'shared-alg001-l06-p026',
  title: 'Dependent variable',
  sourceSwfSha256: 'a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p026/canvas-renderer.js',
  assetSha256: '5f7b9b0cc37cb536113280c5fd35236cc67c9445b9802c86fce354801a742382',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-55', mainFrameCount: 389, livePlaybackEndFrame: 389,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-55-source-drawing', firstFrame: 1, lastFrame: 389}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
