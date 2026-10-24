/** Source drawing only. The maintained My Lesson player owns playback,
 * the two distinct Input/Output actions and independently selected SA. */
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const ALG_L06_P013_DRAWING = {
  animationId: 'shared-alg001-l06-p013',
  title: 'Input and Output',
  sourceSwfSha256: '1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35',
  assetSource: '/flash-assets/g678-local/shared-alg001-l06-p013/canvas-v1',
  assetSha256: '0fcb9e14cbae8ff38b0fbf213b090e1299d65027abd4b365950ca875042b4b0d',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-140', mainFrameCount: 372, livePlaybackEndFrame: 372,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite-140-source-drawing', firstFrame: 1, lastFrame: 372}],
  showEngineeringDisclosure: false,
} as const satisfies SourceStaticCanvasCandidateConfig;
