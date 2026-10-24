/** Source drawing only. The maintained player owns one continuous main stream,
 * six glossary keys across six source instances, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P019_DRAWING = {
  animationId: 'shared-alg001-l06-p019',
  title: 'Function Table',
  sourceSwfSha256: 'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p019/canvas-renderer.js',
  assetSha256: '8e33f562010cb30f4dece352cb4167d9b3caed1128605098cea0a12d2b0db59b',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-37', mainFrameCount: 351, livePlaybackEndFrame: 351,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-37-source-drawing', firstFrame: 1, lastFrame: 351}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
