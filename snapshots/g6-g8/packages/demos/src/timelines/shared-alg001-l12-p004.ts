import type {LessonHostRequest} from '../lesson-host-contract';
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';
import {
  P004_GLOSSARY_BUTTONS,
  P004_MAIN_FRAME_COUNT,
  P004_SOURCE_SHA256,
  closeP004Glossary,
  requestP004Glossary,
  resumeP004Glossary,
  type P004GlossaryState,
} from '../alg-l12-p004-glossary-state';

export const SHARED_ALG001_L12_P004_SOURCE = Object.freeze({
  calibrationId: 'g678-alg-l12-p004-current-js-v1',
  deploymentScope: 'local-only',
  source: {
    path: 'G6-G8-shared/ALG001/L12/RW/L12RW04.swf',
    sha256: P004_SOURCE_SHA256,
  },
  reviewedLane: 'interactive-understood',
  composition: {rootFrame: 6, mainSprite: 90, titleSprite: 92, frameShape: 93},
  audioPlaybackEnabled: false,
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  strictAcceptanceEffect: 'none',
} as const);

export const SHARED_ALG001_L12_P004_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p004',
  title: 'Page 3',
  sourceSwfSha256: SHARED_ALG001_L12_P004_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p004/canvas-renderer.js',
  assetSha256: 'd4cd5a861761c4548793b8f94468b5284d5a1c98a68bc99ff5267344df124d13',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-90',
  mainFrameCount: P004_MAIN_FRAME_COUNT,
  companionDomains: [{id: 'sprite-92', frameCount: 1, label: 'Source title sprite'}],
  livePlaybackEndFrame: P004_MAIN_FRAME_COUNT,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [
    {id: 'sprite-90-with-root-title-and-border', firstFrame: 1, lastFrame: P004_MAIN_FRAME_COUNT},
  ],
  sourceControlBehaviorLabel: 'Source glossary requests stop the main sprite. Embedded and lesson-SA audio remain disabled pending review.',
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);

export const SHARED_ALG001_L12_P004_GLOSSARY_ENTRIES = Object.freeze([
  {characterId: 63, entryId: 'vertical-line-test'},
  {characterId: 66, entryId: 'vertical'},
  {characterId: 67, entryId: 'graph'},
  {characterId: 71, entryId: 'point'},
  {characterId: 72, entryId: 'function'},
] as const);

export const P004_MODERN_HOST_CLOSE_POLICY =
  'restore-pre-request-pause-on-dialog-close; original-host-parity-pending';

/** Page-local adapter for the current lesson host's glossary close behavior. */
export function closeP004GlossaryForHost(
  state: P004GlossaryState,
  pausedBeforeRequest: boolean,
): P004GlossaryState {
  const closed = closeP004Glossary(state);
  return pausedBeforeRequest ? closed : resumeP004Glossary(closed);
}

/** A later explicit host Play releases a pre-existing pause after the dialog closes. */
export function resumeP004GlossaryAfterHostPlay(
  state: P004GlossaryState,
  wasHostPaused: boolean,
  isHostPaused: boolean,
): P004GlossaryState {
  if (!wasHostPaused || isHostPaused || state.pendingGlossary || state.transport !== 'paused') {
    return state;
  }
  return resumeP004Glossary(state);
}

/** The source release stops independently of whether the modern host accepts the request. */
export function prepareP004GlossaryRequest(
  state: P004GlossaryState,
  characterId: number,
): Readonly<{state: P004GlossaryState; request: Extract<LessonHostRequest, {type: 'open-glossary'}>} > | null {
  const next = requestP004Glossary(state, characterId);
  if (next === state || !next.pendingGlossary) return null;
  const entry = SHARED_ALG001_L12_P004_GLOSSARY_ENTRIES.find(
    item => item.characterId === characterId,
  );
  if (!entry || !P004_GLOSSARY_BUTTONS.some(button =>
    button.characterId === characterId && button.term === next.pendingGlossary?.term)) return null;
  return Object.freeze({
    state: next,
    request: Object.freeze({type: 'open-glossary', entryId: entry.entryId}),
  });
}
