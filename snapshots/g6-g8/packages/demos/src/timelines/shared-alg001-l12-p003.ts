import type {LessonHostRequest} from '../lesson-host-contract';
import type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';
import {
  P003_CLOSE_POLICY,
  P003_GLOSSARY_BUTTONS,
  P003_MAIN_FRAME_COUNT,
  P003_SOURCE_SHA256,
  closeP003Glossary,
  requestP003Glossary,
  setP003Paused,
  type P003GlossaryState,
} from '../alg-l12-p003-glossary-state';

export const SHARED_ALG001_L12_P003_SOURCE = Object.freeze({
  calibrationId: 'g678-alg-l12-p003-current-js-v1',
  deploymentScope: 'local-only',
  source: {
    path: 'G6-G8-shared/ALG001/L12/RW/L12RW03.swf',
    sha256: P003_SOURCE_SHA256,
  },
  reviewedLane: 'behavior-heavy',
  composition: {
    rootFrame: 6,
    rootLayers: [
      {characterId: 2, depth: 1},
      {characterId: 164, depth: 2},
      {characterId: 166, depth: 146},
      {characterId: 167, depth: 148},
    ],
    nestedSprite: {characterId: 22, parentSprite: 164, firstFrame: 124, depth: 8},
  },
  audioPlaybackEnabled: false,
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  strictAcceptanceEffect: 'none',
} as const);

export const SHARED_ALG001_L12_P003_CONFIG = Object.freeze({
  animationId: 'shared-alg001-l12-p003',
  title: 'Page 2',
  sourceSwfSha256: SHARED_ALG001_L12_P003_SOURCE.source.sha256,
  assetSource: '/flash-assets/g678-local/shared-alg001-l12-p003/canvas-renderer.js',
  assetSha256: 'f42b2edc01881c3ec3d60a8de36da436883e6befa8d066fb673592c4c7e6874c',
  stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
  backingStage: {width: 800, height: 600},
  fps: 12,
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: 'sprite-164',
  mainFrameCount: P003_MAIN_FRAME_COUNT,
  companionDomains: [
    {id: 'sprite-22', frameCount: 1, label: 'Source nested sprite'},
    {id: 'sprite-166', frameCount: 1, label: 'Source title sprite'},
  ],
  livePlaybackEndFrame: P003_MAIN_FRAME_COUNT,
  playbackMode: 'once',
  strictCaptureIdentity: true,
  blockedFrameRanges: [],
  visualMarkers: [
    {id: 'sprite-164-with-root-character-title-border-and-nested-22', firstFrame: 1, lastFrame: P003_MAIN_FRAME_COUNT},
  ],
  sourceControlBehaviorLabel: 'Six source glossary releases stop the main sprite. Embedded and lesson-SA audio remain disabled pending review.',
  showEngineeringDisclosure: false,
} satisfies SourceStaticCanvasCandidateConfig);

export const SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES = Object.freeze([
  {characterId: 150, entryId: 'graph'},
  {characterId: 151, entryId: 'relation'},
  {characterId: 156, entryId: 'function'},
  {characterId: 157, entryId: 'equation'},
  {characterId: 161, entryId: 'linear-equation'},
  {characterId: 162, entryId: 'linear-function'},
] as const);

export const P003_MODERN_HOST_CLOSE_POLICY = P003_CLOSE_POLICY;

/** Ordinary host pause and seek display the host frame; a glossary request holds its release frame. */
export function sourceFrameForP003Host(state: P003GlossaryState, hostFrame: number): number {
  return state.pendingGlossary ? state.frame : hostFrame;
}

/** Keep the page-local transport aligned without rerendering on every playing tick. */
export function syncP003HostTransport(
  state: P003GlossaryState,
  hostFrame: number,
  hostPaused: boolean,
): P003GlossaryState {
  if (state.pendingGlossary ||
    (!hostPaused && state.transport === 'playing' && hostFrame < P003_MAIN_FRAME_COUNT)) return state;
  const aligned = {...state, frame: hostFrame};
  const next = hostFrame === P003_MAIN_FRAME_COUNT
    ? {...aligned, transport: 'stopped' as const}
    : setP003Paused(aligned, hostPaused);
  return next.frame === state.frame && next.transport === state.transport ? state : next;
}

/** The pure state retains the transport seen before the modern host request. */
export function closeP003GlossaryForHost(state: P003GlossaryState): P003GlossaryState {
  return closeP003Glossary(state);
}

/** Source release stops even when the modern host later denies the request. */
export function prepareP003GlossaryRequest(
  state: P003GlossaryState,
  characterId: number,
): Readonly<{state: P003GlossaryState; request: Extract<LessonHostRequest, {type: 'open-glossary'}>}> | null {
  const next = requestP003Glossary(state, characterId);
  if (next === state || !next.pendingGlossary) return null;
  const entry = SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES.find(
    item => item.characterId === characterId,
  );
  if (!entry || !P003_GLOSSARY_BUTTONS.some(button =>
    button.characterId === characterId && button.term === next.pendingGlossary?.term)) return null;
  return Object.freeze({
    state: next,
    request: Object.freeze({type: 'open-glossary', entryId: entry.entryId}),
  });
}
