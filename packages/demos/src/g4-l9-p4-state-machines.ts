export const G4_L9_P4_SEED = 4092026;

export type G4L9P4Lane =
  | 'factory'
  | 'advanced-manual';

export type G4L9P4Behavior =
  | 'intro-input'
  | 'reveal'
  | 'typed-practice'
  | 'linear-model'
  | 'balance-practice'
  | 'drag-model'
  | 'choice-practice'
  | 'final-quiz-intro'
  | 'final-quiz';

export interface G4L9P4AudioIdentity {
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly candidatePath: string;
  readonly spokenLanguage: 'undetermined';
}

export interface G4L9P4PageConfig {
  readonly animationId: string;
  readonly placementId: string;
  readonly sourceOccurrence: number;
  readonly sectionCode: string;
  readonly pageTitle: string;
  readonly sourceSwfPath: string;
  readonly sourceSwfSha256: string;
  readonly sourceSwfBytes: number;
  readonly lane: G4L9P4Lane;
  readonly complexityLane: 'low' | 'interactive-understood' | 'behavior-heavy';
  readonly behavior: G4L9P4Behavior;
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly rootFrameCount: number;
  readonly fps: number;
  readonly questionCount: number;
  readonly expectedOptionOffset: number;
  readonly audio: G4L9P4AudioIdentity | null;
  readonly legacyNetworkPolicy: 'deny-by-default';
  readonly f08ScaleOut: false | 'not-applicable';
}

export type G4L9P4Feedback = 'idle' | 'correct' | 'incorrect';
export type G4L9P4Phase = 'intro' | 'question' | 'feedback' | 'final';

export interface G4L9P4InteractionState {
  readonly seed: number;
  readonly replay: number;
  readonly phase: G4L9P4Phase;
  readonly questionIndex: number;
  readonly score: number;
  readonly attempts: number;
  readonly feedback: G4L9P4Feedback;
  readonly revealed: boolean;
  readonly audioLifecycle: 'idle' | 'requested' | 'stopped' | 'unavailable';
  readonly blockedLegacyIntents: number;
  readonly networkCalls: 0;
}

export type G4L9P4Event =
  | Readonly<{type: 'start'}>
  | Readonly<{type: 'reveal'}>
  | Readonly<{type: 'answer'; option: number}>
  | Readonly<{type: 'next'}>
  | Readonly<{type: 'replay'; replay: number}>
  | Readonly<{type: 'audio-request'}>
  | Readonly<{type: 'audio-stop'}>
  | Readonly<{type: 'legacy-intent'}>;

function finiteInteger(value: number, fallback = 0): number {
  return Number.isSafeInteger(value) ? value : fallback;
}

export function normalizeG4L9P4Seed(seed: number): number {
  const value = finiteInteger(seed, G4_L9_P4_SEED);
  return ((value % 2_147_483_647) + 2_147_483_647) % 2_147_483_647;
}

export function buildG4L9P4SeededOrder(length: number, seed: number): readonly number[] {
  const size = Math.max(0, finiteInteger(length));
  const order = Array.from({length: size}, (_, index) => index);
  let state = normalizeG4L9P4Seed(seed) || 1;
  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (state * 48_271) % 2_147_483_647;
    const target = state % (index + 1);
    [order[index], order[target]] = [order[target]!, order[index]!];
  }
  return Object.freeze(order);
}

export function expectedG4L9P4Option(
  config: G4L9P4PageConfig,
  questionIndex: number,
  seed: number,
): number {
  const order = buildG4L9P4SeededOrder(
    Math.max(3, config.questionCount),
    seed + config.expectedOptionOffset,
  );
  return order[Math.max(0, questionIndex) % order.length]! % 3;
}

export function createG4L9P4InteractionState(
  config: G4L9P4PageConfig,
  seed: number,
  replay = 0,
): G4L9P4InteractionState {
  return Object.freeze({
    seed: normalizeG4L9P4Seed(seed),
    replay: Math.max(0, finiteInteger(replay)),
    phase: config.behavior === 'final-quiz-intro' ? 'intro' : 'question',
    questionIndex: 0,
    score: 0,
    attempts: 0,
    feedback: 'idle',
    revealed: false,
    audioLifecycle: config.audio ? 'idle' : 'unavailable',
    blockedLegacyIntents: 0,
    networkCalls: 0,
  });
}

export function reduceG4L9P4Interaction(
  config: G4L9P4PageConfig,
  state: G4L9P4InteractionState,
  event: G4L9P4Event,
): G4L9P4InteractionState {
  if (event.type === 'replay') {
    return createG4L9P4InteractionState(
      config,
      state.seed + Math.max(1, finiteInteger(event.replay, 1)),
      event.replay,
    );
  }
  if (event.type === 'start') {
    return Object.freeze({...state, phase: 'question', feedback: 'idle'});
  }
  if (event.type === 'reveal') {
    return Object.freeze({...state, revealed: true});
  }
  if (event.type === 'audio-request') {
    return Object.freeze({
      ...state,
      audioLifecycle: config.audio ? 'requested' : 'unavailable',
    });
  }
  if (event.type === 'audio-stop') {
    return Object.freeze({
      ...state,
      audioLifecycle: config.audio ? 'stopped' : 'unavailable',
    });
  }
  if (event.type === 'legacy-intent') {
    return Object.freeze({
      ...state,
      blockedLegacyIntents: state.blockedLegacyIntents + 1,
      networkCalls: 0,
    });
  }
  if (event.type === 'answer' && state.phase === 'question') {
    const correct = event.option === expectedG4L9P4Option(
      config,
      state.questionIndex,
      state.seed,
    );
    return Object.freeze({
      ...state,
      attempts: state.attempts + 1,
      feedback: correct ? 'correct' : 'incorrect',
      phase: 'feedback',
      score: state.score + (correct ? 1 : 0),
    });
  }
  if (event.type === 'next' && state.phase === 'feedback') {
    const last = state.questionIndex + 1 >= config.questionCount;
    return Object.freeze({
      ...state,
      phase: last ? 'final' : 'question',
      questionIndex: last ? state.questionIndex : state.questionIndex + 1,
      feedback: 'idle',
      revealed: false,
    });
  }
  return state;
}

export interface G4L9P4FrameState {
  readonly animationId: string;
  readonly frame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly status: 'ready';
  readonly actionScriptExecuted: false;
  readonly originalRuntimeValidated: false;
  readonly fidelityAccepted: false;
  readonly audioAccepted: false;
  readonly legacyNetworkPolicy: 'deny-by-default';
  readonly networkCalls: 0;
}

export function getG4L9P4FrameState(
  config: G4L9P4PageConfig,
  frame: number,
  context: Readonly<{
    frameDomain?: string;
    lang: 'en' | 'es';
    scenario: string;
    seed: number;
    replay?: number;
  }>,
): G4L9P4FrameState {
  return Object.freeze({
    animationId: config.animationId,
    frame: Math.min(config.frameCount, Math.max(1, finiteInteger(frame, 1))),
    frameDomain: context.frameDomain === config.frameDomain
      ? config.frameDomain
      : config.frameDomain,
    rootFrame: Math.min(config.rootFrameCount, 1),
    scenario: context.scenario || 'p4-product-behavior',
    language: context.lang,
    seed: normalizeG4L9P4Seed(context.seed),
    replay: Math.max(0, finiteInteger(context.replay ?? 0)),
    status: 'ready',
    actionScriptExecuted: false,
    originalRuntimeValidated: false,
    fidelityAccepted: false,
    audioAccepted: false,
    legacyNetworkPolicy: 'deny-by-default',
    networkCalls: 0,
  });
}
