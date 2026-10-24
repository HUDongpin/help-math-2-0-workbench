/** Source drawing only. The maintained player owns one continuous main stream,
 * six explicit glossary actions, and independently selected optional SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P017_DRAWING = {
  animationId: 'shared-alg001-l06-p017',
  title: 'Equation of a Function',
  sourceSwfSha256: '7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p017/canvas-renderer.js',
  assetSha256: 'b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-42', mainFrameCount: 721, livePlaybackEndFrame: 721,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-42-source-drawing', firstFrame: 1, lastFrame: 721}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
