import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';
import meta from '../../../../migrations/shared-alg001-l12-p010/typography-v1/runtime-meta.json';

export const SHARED_ALG001_L12_P010_SOURCE = Object.freeze({
  deploymentScope: 'local-only',
  source: {path: 'G6-G8-shared/ALG001/L12/VB/L12VB05.swf', sha256: meta.sourceSha256},
  registrationAuthority: 'private-current-js-registry',
  complexityLane: 'compiler-assisted-source-native-state-machine',
  productCalibrationPassed: false,
  audioPlaybackEnabled: true,
  audioSchedule: 'full-native-buffer-modern-full-frame-terminal',
  sourceTerminalStop: false,
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  strictAcceptanceEffect: 'none',
} as const);

/** The shared factory supplies only source frame/state metadata. The page's
 * maintained native renderer owns the explicit 2x drawing buffer and text;
 * the factory's legacy 1x Canvas renderer is never exported or selected. */
export const SHARED_ALG001_L12_P010_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p010', title: 'Plotting Points',
  sourceSwfSha256: meta.sourceSha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p010/typography-renderer.js',
  assetSha256: meta.runtimeSha256,
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-96', mainFrameCount: 465, livePlaybackEndFrame: 465,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [], blockedFrameRanges: [],
  visualMarkers: [{id: 'source-native-plotting-points', firstFrame: 1, lastFrame: 465}],
  sourceControlBehaviorLabel: 'Source glossary actions use a maintained host; full frame465 hold is modern; the source child has no stop.',
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);
