/** Source drawing plane. The player owns the two embedded-stream ranges,
 * six native glossary actions, and an independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P022_DRAWING = {
  animationId: 'shared-alg001-l06-p022',
  title: 'Graph of a Function',
  sourceSwfSha256: 'a5868c68164c6401d2d79a8548f60f0d62401ca14f01f0494ef8ae6fd0e2d7c1',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p022/canvas-renderer.js',
  assetSha256: '3c23c8416e7c4d331fe3039b72278a094e79715a61b81357702ae149b4bf9568',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-67', mainFrameCount: 422, livePlaybackEndFrame: 422,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-67-source-drawing', firstFrame: 1, lastFrame: 422}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
