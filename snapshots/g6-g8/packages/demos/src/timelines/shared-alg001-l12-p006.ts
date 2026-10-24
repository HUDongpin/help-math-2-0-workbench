import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';

export const SHARED_ALG001_L12_P006_SOURCE = Object.freeze({
  deploymentScope: 'local-only',
  source: {path: 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf', sha256: '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6'},
  currentJavaScriptRegistered: true, productCalibrationPassed: false, audioPlaybackEnabled: true,
  spanishTextPolicy: 'english-source-fallback-translation-pending', strictAcceptanceEffect: 'none',
  audioHold: 'Embedded 22050Hz stream extracted; original clock, terminal tail and listening pending.',
} as const);

export const SHARED_ALG001_L12_P006_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p006', title: 'Page 5',
  sourceSwfSha256: SHARED_ALG001_L12_P006_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p006/canvas-renderer.js',
  assetSha256: 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600}, fps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: 'sprite-53', mainFrameCount: 342, livePlaybackEndFrame: 342,
  playbackMode: 'once', strictCaptureIdentity: true,
  companionDomains: [{id: 'sprite-56', frameCount: 1, label: 'Source title'}],
  blockedFrameRanges: [],
  visualMarkers: [{id: 'sprite53-four-layer-mask-corrected', firstFrame: 1, lastFrame: 342}],
  sourceControlBehaviorLabel: 'Source stop at342; masked glossary controls and audio remain separate engineering candidates.',
  showEngineeringDisclosure: false, // Host companion and page disclose all pending gates outside the clipped stage.
} satisfies SourceStaticCanvasCandidateConfig);
