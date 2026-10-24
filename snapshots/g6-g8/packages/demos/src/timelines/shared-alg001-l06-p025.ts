/** Source drawing plane. The player owns the single embedded-stream range,
 * four native glossary actions, and any independently selected SA audio. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P025_DRAWING = {
  animationId: 'shared-alg001-l06-p025',
  title: 'Independent variable',
  sourceSwfSha256: 'dcb6b709d71eada47053b50bcfcc1161dec5d1717ebca6cbf8463eb6863dbde6',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p025/canvas-renderer.js',
  assetSha256: 'a3fd0f401fa32779ddff8fc41bc423d458b2ea2a929c44a43fbe3446dc5082f9',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-21', mainFrameCount: 299, livePlaybackEndFrame: 299,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-21-source-drawing', firstFrame: 1, lastFrame: 299}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
