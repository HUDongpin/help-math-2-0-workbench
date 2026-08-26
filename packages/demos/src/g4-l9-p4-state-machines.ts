import type {LessonHostRequest} from './lesson-host-contract';

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
  readonly durationMs?: number;
}

export interface G4L9P4DragBinding {
  readonly sourceInstance: `Scr${number}`;
  readonly outcome: 'correct' | 'incorrect';
}

export interface G4L9P4GlossaryHandler {
  readonly handlerIndex: number;
  readonly sourceIntent: string;
  readonly resolvedKeyAttribute: string;
  readonly entryId: string;
  readonly resolution: 'exact-screen-key-term' | 'explicit-source-bound-alias';
}

export interface G4L9P4RandomCycle {
  readonly adapter: 'rndAudio-source-array-seeded-cycle-v1';
  readonly sourceChoices: readonly ['S1', 'S2', 'S3', 'S4'];
  readonly actionSha256: string;
  readonly terminalActionSha256: string;
  readonly terminalCorrectCount: 4;
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
  readonly dragBindings?: readonly G4L9P4DragBinding[];
  readonly glossaryHandlers?: readonly G4L9P4GlossaryHandler[];
  readonly hostContractSymbols?: readonly string[];
  readonly randomQuestionAdapter?: 'doGetRndQuest-maintained-seeded-order-v1';
  readonly randomCycle?: G4L9P4RandomCycle;
  readonly scenarioId?: string;
  readonly scenarioLabel?: string;
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
  readonly tryCount: number;
  readonly feedback: G4L9P4Feedback;
  readonly choiceOrder: readonly number[];
  readonly choiceCycleIndex: number;
  readonly choiceIndex: number;
  readonly choiceLabel: string;
  readonly placedCorrect: readonly string[];
  readonly lastDragSourceInstance: string | null;
  readonly revealed: boolean;
  readonly audioLifecycle: 'idle' | 'requested' | 'stopped' | 'unavailable';
  readonly blockedLegacyIntents: number;
  readonly networkCalls: 0;
}

export type G4L9P4Event =
  | Readonly<{type: 'start'}>
  | Readonly<{type: 'reveal'}>
  | Readonly<{type: 'answer'; option: number}>
  | Readonly<{type: 'drag'; sourceInstance: string}>
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

export function g4L9P4DragOutcome(
  config: G4L9P4PageConfig,
  sourceInstance: string,
): G4L9P4DragBinding['outcome'] | undefined {
  return config.dragBindings?.find(
    (binding) => binding.sourceInstance === sourceInstance,
  )?.outcome;
}

export function createG4L9P4FeedbackHostRequest(
  config: G4L9P4PageConfig,
  state: G4L9P4InteractionState,
  correct: boolean,
): LessonHostRequest {
  if (config.randomCycle) {
    return Object.freeze({
      type: 'record-practice-feedback' as const,
      interactionId:
        `${config.animationId}-${state.choiceLabel.toLowerCase()}-try${state.tryCount + 1}`,
      outcome: correct ? 'correct' as const : 'incorrect' as const,
      branchIndex: state.choiceIndex + 1,
      branchCount: config.randomCycle.sourceChoices.length,
    });
  }
  return config.behavior === 'final-quiz'
    ? Object.freeze({
        type: 'record-fq-score' as const,
        questionId: `${config.animationId}-q${state.questionIndex + 1}`,
        correct,
        pointsAwarded: correct ? 1 : 0,
        pointsPossible: 1,
      })
    : Object.freeze({
        type: 'record-practice-feedback' as const,
        interactionId: `${config.animationId}-q${state.questionIndex + 1}`,
        outcome: correct ? 'correct' as const : 'incorrect' as const,
        // The maintained reducer is zero-based, but the modern host contract
        // deliberately exposes source branch identity as a one-based value.
        branchIndex: state.questionIndex + 1,
        branchCount: config.questionCount,
      });
}

export function createG4L9P4ReplayHostRequests(
  config: G4L9P4PageConfig,
  state: G4L9P4InteractionState,
  activeInteractiveAudioId?: string | null,
): readonly LessonHostRequest[] {
  const requests: LessonHostRequest[] = [];
  const audioCueId = `${config.animationId}-narration`;
  if (
    config.audio &&
    (state.audioLifecycle === 'requested' ||
      activeInteractiveAudioId === audioCueId)
  ) {
    requests.push(Object.freeze({type: 'stop-audio', cueId: audioCueId}));
  }
  requests.push(
    config.behavior === 'final-quiz'
      ? Object.freeze({type: 'reset-fq-score' as const})
      : Object.freeze({type: 'reset-practice-feedback' as const}),
  );
  return Object.freeze(requests);
}

export function createG4L9P4InteractionState(
  config: G4L9P4PageConfig,
  seed: number,
  replay = 0,
): G4L9P4InteractionState {
  const choiceOrder = config.randomCycle
    ? buildG4L9P4SeededOrder(
        config.randomCycle.sourceChoices.length,
        seed + config.expectedOptionOffset,
      )
    : Object.freeze([] as number[]);
  const choiceIndex = choiceOrder[0] ?? 0;
  return Object.freeze({
    seed: normalizeG4L9P4Seed(seed),
    replay: Math.max(0, finiteInteger(replay)),
    phase: config.behavior === 'final-quiz-intro' ? 'intro' : 'question',
    questionIndex: 0,
    score: 0,
    attempts: 0,
    tryCount: 0,
    feedback: 'idle',
    choiceOrder,
    choiceCycleIndex: 0,
    choiceIndex,
    choiceLabel: config.randomCycle?.sourceChoices[choiceIndex] ?? '',
    placedCorrect: Object.freeze([]),
    lastDragSourceInstance: null,
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
      config.randomCycle
        ? state.seed
        : state.seed + Math.max(1, finiteInteger(event.replay, 1)),
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
  if (
    event.type === 'drag' &&
    config.randomCycle &&
    state.phase === 'question'
  ) {
    const outcome = g4L9P4DragOutcome(config, event.sourceInstance);
    if (!outcome) return state;
    const correct = outcome === 'correct';
    const alreadyPlaced = state.placedCorrect.includes(event.sourceInstance);
    const placedCorrect = correct && !alreadyPlaced
      ? Object.freeze([...state.placedCorrect, event.sourceInstance])
      : state.placedCorrect;
    const terminal =
      placedCorrect.length >= config.randomCycle.terminalCorrectCount;
    const nextCycleIndex = terminal
      ? state.choiceCycleIndex
      : (state.choiceCycleIndex + 1) % state.choiceOrder.length;
    const nextChoiceIndex = state.choiceOrder[nextCycleIndex] ?? 0;
    return Object.freeze({
      ...state,
      attempts: state.attempts + 1,
      tryCount: state.tryCount + 1,
      feedback: correct ? 'correct' : 'incorrect',
      phase: terminal ? 'final' : 'feedback',
      score: placedCorrect.length,
      questionIndex: nextCycleIndex,
      choiceCycleIndex: nextCycleIndex,
      choiceIndex: nextChoiceIndex,
      choiceLabel: config.randomCycle.sourceChoices[nextChoiceIndex]!,
      placedCorrect,
      lastDragSourceInstance: event.sourceInstance,
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
    if (config.randomCycle) {
      return Object.freeze({
        ...state,
        phase: 'question',
        feedback: 'idle',
        revealed: false,
      });
    }
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
    scenario: context.scenario || config.scenarioId || 'p4-product-behavior',
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
