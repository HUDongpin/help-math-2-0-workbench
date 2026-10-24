/** Source-bound p044 behavior only. No renderer, timers, registry or legacy execution. */
export type P044Input = 'mouse' | 'Enter' | ' ';
export type P044Mode = 'natural' | 'reduced-motion';
export type P044StopFrame = 312 | 449 | 575 | 697 | 737;
export type P044AnswerName = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export type P044Term = 'total' | 'multiplication' | 'solve';
export type P044FeedbackName = `Mc_Right_Feed${1 | 2 | 3 | 4}` | `Mc_Wrong_Feed${1 | 2 | 3}`;
export type P044Phase = 'teaching' | 'guided' | 'quiz' | 'feedback' | 'explanation-opening' |
  'explanation-held' | 'explanation-closing' | 'popup' | 'awaiting-main-resume' | 'complete';
export interface P044InstanceSegment {
  readonly parentDomain: 'root' | 'sprite-293'; readonly placementFrame: number;
  readonly sourceObjectId: number; readonly depth: number; readonly name: string | null;
}
export interface P044SourceContext {
  readonly sourceObjectId: number;
  readonly sourceInstanceName: string | null;
  readonly sourceDepth: number;
  readonly instanceKey: string;
  readonly instancePath: readonly P044InstanceSegment[];
  readonly frame: number;
  readonly visible: boolean;
  readonly playing: boolean;
}
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const MAIN = {parentDomain: 'root', placementFrame: 6, sourceObjectId: 293, depth: 3, name: 'animation'} as const;
const stops = [312, 449, 575, 697, 737] as const;
const feedback = [
  {name: 'Mc_Right_Feed1', kind: 'right', sourceObjectId: 196, depth: 219, placementFrame: 737, terminalFrame: 27},
  {name: 'Mc_Right_Feed2', kind: 'right', sourceObjectId: 212, depth: 228, placementFrame: 737, terminalFrame: 28},
  {name: 'Mc_Right_Feed3', kind: 'right', sourceObjectId: 172, depth: 215, placementFrame: 737, terminalFrame: 28},
  {name: 'Mc_Right_Feed4', kind: 'right', sourceObjectId: 224, depth: 238, placementFrame: 737, terminalFrame: 25},
  {name: 'Mc_Wrong_Feed1', kind: 'wrong', sourceObjectId: 276, depth: 264, placementFrame: 737, terminalFrame: 28},
  {name: 'Mc_Wrong_Feed2', kind: 'wrong', sourceObjectId: 236, depth: 248, placementFrame: 737, terminalFrame: 29},
  {name: 'Mc_Wrong_Feed3', kind: 'wrong', sourceObjectId: 248, depth: 254, placementFrame: 737, terminalFrame: 28},
] as const;
const explanations = [
  {index: 1, stopFrame: 575, placementFrame: 575, sourceObjectId: 106, depth: 120, name: 'Mc_box1', frameCount: 21,
    heldFrame: 15, closeTerminalFrame: 20, closeButtonId: 105},
  {index: 2, stopFrame: 697, placementFrame: 697, sourceObjectId: 139, depth: 126, name: 'Mc_box2', frameCount: 55,
    heldFrame: 49, closeTerminalFrame: 55, closeButtonId: 130},
] as const;
export const P044_CONFIG = freeze({
  animationId: 'shared-nms002-l01-p044',
  sourceSha256: '8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76',
  sourceXmlSha256: '3a3338eacd66b788cdda556128e0ff4715eb5647f3dfb16d1e5a2e0243d5a1fa',
  structuralCrosscheckSha256: '619c6c158288b9f036fd0b4c75bba033d0a1d5f411a5b52894ca37c078c2dc0c',
  stage: {width: 800, height: 600}, fps: 12, rootFrameCount: 10, rootEntryFrame: 6,
  mainFrameDomain: 'sprite-293', mainFrameCount: 759, liveTerminalFrame: 756,
  mainInstance: MAIN, mainTranslation: {x: 412.35, y: 282.9}, sourceLanguage: 'en',
  stops: stops.map(frame => ({frame, resumeFrame: frame + 1, id: `p044-source-stop-${frame}`,
    rendererStateOnResume: 'preserve' as const})),
  guidedTargets: [
    {stopFrame: 312, continueDepth: 23, alternateDepth: 25, alternateAction: 'continue'},
    {stopFrame: 449, continueDepth: 23, alternateDepth: 30, alternateAction: 'continue'},
    {stopFrame: 575, continueDepth: 24, alternateDepth: 30, alternateAction: 'explanation'},
    {stopFrame: 697, continueDepth: 23, alternateDepth: 30, alternateAction: 'explanation'},
  ] as const,
  answers: [
    {instanceName: 'AnsBtn1', visualOrder: 1, letter: 'A', label: '$43.00', sourceCharacterId: 143, depth: 207, sourceTextId: 30, outcome: 'wrong'},
    {instanceName: 'AnsBtn3', visualOrder: 2, letter: 'B', label: '$120.00', sourceCharacterId: 144, depth: 205, sourceTextId: 39, outcome: 'right'},
    {instanceName: 'AnsBtn4', visualOrder: 3, letter: 'C', label: '$140.00', sourceCharacterId: 143, depth: 203, sourceTextId: 36, outcome: 'wrong'},
    {instanceName: 'AnsBtn2', visualOrder: 4, letter: 'D', label: '$160.00', sourceCharacterId: 142, depth: 201, sourceTextId: 33, outcome: 'wrong'},
  ] as const,
  explanations, feedback,
  popup: {sourceObjectId: 292, depth: 273, placementFrame: 737, name: 'Mc_Popup', openButtonId: 13, closeButtonId: 278},
  glossary: [{id: 'total', sourceButtonId: 20}, {id: 'multiplication', sourceButtonId: 285}, {id: 'solve', sourceButtonId: 286}] as const,
  opaqueResidual: {domain: 'sprite-196', start: 517626, end: 518012, bytes: 386, nonzeroBytes: 17,
    sha256: 'd14a608f74eab33aa50401e45f0226b845a8b29aa02417254d15dc8675accaa0', semanticsEstablished: false},
  candidatePolicies: {
    feedbackSelection: 'seeded-per-kind-cycle-v1-not-original-random',
    openingEntry: 'gotoAndPlay(1) request advances opening from source1; initial-stop ordering parity unresolved',
    glossary: 'typed request freezes page clocks; matching close/denial restores prior transport; original host close parity unresolved',
    emptyContinue: 'sprite43 source action with explicit maintained accessible hit area, not source-derived geometry',
    earlier85: 'idle source1 at each actual placement; no invented page-event activation',
    invisibleTotal: 'source20 placed main1/depth3 through759; alpha0 on1, positive on2; no maintained activation while alpha0',
    aText: 'unbound legacy write; no named a_text or DefineEditText exists in exact XML; no local visual override',
  },
  currentJavaScriptRegistered: false, originalRuntimeAccepted: false, audioIntegrated: false,
});

export interface P044State {
  readonly sourceSha256: typeof P044_CONFIG.sourceSha256;
  readonly seed: number;
  readonly epoch: number;
  readonly mode: P044Mode;
  readonly clockToken: number;
  readonly mainFrame: number;
  readonly phase: P044Phase;
  readonly paused: boolean;
  readonly quizSection: boolean;
  readonly quizAttempts: 0 | 1;
  readonly resolvedStops: readonly P044StopFrame[];
  readonly pendingMainResume: Readonly<{stopFrame: P044StopFrame; resumeFrame: number}> | null;
  readonly selectedAnswer: P044AnswerName | null;
  readonly activeFeedback: P044FeedbackName | null;
  readonly activeExplanation: 1 | 2 | null;
  readonly activeNestedFrames: readonly P044SourceContext[];
  readonly explanationUsed: Readonly<{1: boolean; 2: boolean}>;
  readonly explanationVisible: Readonly<{1: boolean; 2: boolean}>;
  readonly aTextVisible: boolean;
  readonly selections: Readonly<{right: number; wrong: number}>;
  readonly glossarySequence: number;
  readonly glossary: Readonly<{term: P044Term; requestToken: number; status: 'requested' | 'open'; resumeMain: boolean}> | null;
}
type EpochEvent = Readonly<{epoch: number}>;
export type P044Event = EpochEvent & (
  | Readonly<{type: 'main-frame'; frame: number; clockToken: number}>
  | Readonly<{type: 'nested-frame'; sourceObjectId: number; frame: number; clockToken: number}>
  | Readonly<{type: 'continue'; stopFrame: P044StopFrame; sourceTarget: 43 | 44; input: P044Input}>
  | Readonly<{type: 'open-explanation'; stopFrame: 575 | 697; input: P044Input}>
  | Readonly<{type: 'close-explanation'; sourceObjectId: 106 | 139; input: P044Input}>
  | Readonly<{type: 'choose-answer'; instanceName: P044AnswerName; input: P044Input}>
  | Readonly<{type: 'open-popup' | 'close-popup'; input: P044Input}>
  | Readonly<{type: 'open-glossary'; term: P044Term; input: P044Input}>
  | Readonly<{type: 'glossary-result'; requestToken: number; allowed: boolean}>
  | Readonly<{type: 'close-glossary'; requestToken: number}>
  | Readonly<{type: 'pause'; paused: boolean}>
  | Readonly<{type: 'replay'; input: P044Input; seed?: number; paused?: boolean}>
);
export type P044Intent = Readonly<{epoch: number}> & (
  | Readonly<{kind: 'resolve-main-stop'; stopId: string; stopFrame: P044StopFrame; resumeFrame: number; cause: 'source-continue' | 'source-feedback-terminal'}>
  | Readonly<{kind: 'transport'; action: 'play' | 'pause' | 'reset'; frame: number}>
  | Readonly<{kind: 'glossary-open'; term: P044Term; sourceButtonId: number; requestToken: number}>
  | Readonly<{kind: 'glossary-close'; requestToken: number; disposition: 'closed' | 'denied'}>
  | Readonly<{kind: 'practice-feedback'; outcome: 'right' | 'wrong'; sourceButtonId: number; sourceInstanceName: P044AnswerName; feedbackVariant: P044FeedbackName; originalRandomAuthority: false}>
);
export interface P044Transition {readonly state: P044State; readonly intents: readonly P044Intent[]; readonly accepted: boolean; readonly reason?: string}
const integer = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): n is number => Number.isSafeInteger(n) && Number(n) >= min && Number(n) <= max;
const validInput = (input: unknown) => input === 'mouse' || input === 'Enter' || input === ' ';
function requireState(state: P044State) {
  if (!state || state.sourceSha256 !== P044_CONFIG.sourceSha256 || !integer(state.seed, 0, 0xffffffff) ||
    !integer(state.epoch) || !integer(state.clockToken) || !integer(state.mainFrame, 1, 756) ||
    typeof state.paused !== 'boolean' || !['natural', 'reduced-motion'].includes(state.mode) ||
    ![0, 1].includes(state.quizAttempts) || !integer(state.selections?.right) || !integer(state.selections?.wrong) ||
    !Array.isArray(state.resolvedStops) || state.resolvedStops.some((stop, index) => stop !== stops[index]) ||
    state.resolvedStops.length > 5 || !Array.isArray(state.activeNestedFrames) || state.activeNestedFrames.length > 1 ||
    !['teaching', 'guided', 'quiz', 'feedback', 'explanation-opening', 'explanation-held', 'explanation-closing', 'popup', 'awaiting-main-resume', 'complete'].includes(state.phase) ||
    typeof state.quizSection !== 'boolean' || typeof state.aTextVisible !== 'boolean' || !integer(state.glossarySequence) ||
    [1, 2].some(index => typeof state.explanationUsed?.[index as 1 | 2] !== 'boolean' || typeof state.explanationVisible?.[index as 1 | 2] !== 'boolean') ||
    (state.pendingMainResume !== null && (!stops.includes(state.pendingMainResume.stopFrame) || state.pendingMainResume.resumeFrame !== state.pendingMainResume.stopFrame + 1 ||
      state.pendingMainResume.stopFrame !== state.mainFrame || state.phase !== 'awaiting-main-resume')) ||
    (state.phase === 'awaiting-main-resume' && state.pendingMainResume === null))
    throw new Error('P044 controller state is invalid');
}
function context(spec: {sourceObjectId: number; depth: number; name: string | null; placementFrame: number}, frame: number,
  visible = true, playing = false): P044SourceContext {
  return freeze({sourceObjectId: spec.sourceObjectId, sourceInstanceName: spec.name, sourceDepth: spec.depth,
    instanceKey: `root/d3-c293/d${spec.depth}-c${spec.sourceObjectId}`,
    instancePath: [MAIN, {parentDomain: 'sprite-293', placementFrame: spec.placementFrame,
      sourceObjectId: spec.sourceObjectId, depth: spec.depth, name: spec.name}], frame, visible, playing});
}
export function createP044State(options: Readonly<{seed?: number; epoch?: number; paused?: boolean; mode?: P044Mode}> = {}): P044State {
  const {seed = 0, epoch = 0, paused = false, mode = 'natural'} = options;
  if (!integer(seed, 0, 0xffffffff) || !integer(epoch) || typeof paused !== 'boolean' || !['natural', 'reduced-motion'].includes(mode))
    throw new Error('P044 initial source context is invalid');
  return freeze({sourceSha256: P044_CONFIG.sourceSha256, seed, epoch, mode, clockToken: 0, mainFrame: 1,
    phase: 'teaching', paused, quizSection: false, quizAttempts: 0, resolvedStops: [], pendingMainResume: null,
    selectedAnswer: null, activeFeedback: null, activeExplanation: null, activeNestedFrames: [],
    explanationUsed: {1: false, 2: false}, explanationVisible: {1: false, 2: false}, aTextVisible: true,
    selections: {right: 0, wrong: 0}, glossarySequence: 0, glossary: null});
}
function result(state: P044State, patch: Partial<P044State>, intents: readonly P044Intent[] = []): P044Transition {
  return freeze({state: freeze({...state, ...patch}), intents: [...intents], accepted: true});
}
function blocked(state: P044State, reason: string): P044Transition {return freeze({state, intents: [], accepted: false, reason});}
function requestResume(state: P044State, stopFrame: P044StopFrame, cause: 'source-continue' | 'source-feedback-terminal',
  patch: Partial<P044State> = {}): P044Transition {
  // Callback returns void: do not invent an acknowledgement or jump source frame.
  return result(state, {...patch, phase: 'awaiting-main-resume', pendingMainResume: {stopFrame, resumeFrame: stopFrame + 1},
    quizSection: false, activeNestedFrames: [], activeFeedback: null, activeExplanation: null, clockToken: state.clockToken + 1},
  [{epoch: state.epoch, kind: 'resolve-main-stop', stopId: `p044-source-stop-${stopFrame}`, stopFrame,
    resumeFrame: stopFrame + 1, cause}]);
}
function arrive(state: P044State, frame: number, resolvedStops = state.resolvedStops): P044Transition {
  const next = stops[resolvedStops.length];
  if (next !== undefined && frame > next) return blocked(state, 'observed-frame-crossed-unresolved-source-stop');
  const atStop = frame === next;
  return result(state, {mainFrame: frame, resolvedStops, pendingMainResume: null,
    phase: frame === 756 ? 'complete' : atStop ? frame === 737 ? 'quiz' : 'guided' : 'teaching',
    quizSection: atStop, quizAttempts: frame === 737 ? 0 : state.quizAttempts,
    aTextVisible: atStop && frame !== 737 ? false : state.aTextVisible,
    activeNestedFrames: [], activeFeedback: null, activeExplanation: null,
    explanationVisible: frame === 575 ? {...state.explanationVisible, 1: false} : frame === 697 ? {...state.explanationVisible, 2: false} : state.explanationVisible,
    clockToken: state.clockToken + (atStop || state.pendingMainResume ? 1 : 0)});
}

export function reduceP044(state: P044State, event: P044Event): P044Transition {
  requireState(state);
  if (!event || !integer(event.epoch) || event.epoch !== state.epoch) return blocked(state, 'stale-or-invalid-epoch');
  if (event.type === 'replay') {
    if (!validInput(event.input) || !integer(event.seed ?? state.seed, 0, 0xffffffff) ||
      (event.paused !== undefined && typeof event.paused !== 'boolean') || !integer(state.epoch + 1)) return blocked(state, 'invalid-replay');
    const next = createP044State({seed: event.seed ?? state.seed, epoch: state.epoch + 1, paused: event.paused ?? false, mode: state.mode});
    return freeze({state: next, accepted: true, intents: [{epoch: next.epoch, kind: 'transport', action: 'reset', frame: 1}]});
  }
  if (!integer(state.clockToken + 1)) return blocked(state, 'clock-token-exhausted');
  if (event.type === 'pause') {
    if (typeof event.paused !== 'boolean') return blocked(state, 'invalid-pause');
    if (event.paused === state.paused) return blocked(state, 'unchanged-pause');
    return result(state, {paused: event.paused, clockToken: state.clockToken + 1});
  }
  if (event.type === 'glossary-result' || event.type === 'close-glossary') {
    if (!state.glossary || !integer(event.requestToken) || event.requestToken !== state.glossary.requestToken)
      return blocked(state, 'stale-glossary-request');
    if (event.type === 'glossary-result') {
      if (typeof event.allowed !== 'boolean') return blocked(state, 'invalid-glossary-result');
      if (state.glossary.status !== 'requested') return blocked(state, 'glossary-request-already-settled');
      if (event.allowed) return result(state, {glossary: {...state.glossary, status: 'open'}});
    }
    const intents: P044Intent[] = [{epoch: state.epoch, kind: 'glossary-close', requestToken: event.requestToken,
      disposition: event.type === 'close-glossary' ? 'closed' : 'denied'}];
    if (state.glossary.resumeMain && !state.paused) intents.push({epoch: state.epoch, kind: 'transport', action: 'play', frame: state.mainFrame});
    return result(state, {glossary: null, clockToken: state.clockToken + 1}, intents);
  }
  if (state.paused) return blocked(state, 'paused');
  if (state.glossary) return blocked(state, 'glossary-holds-page-clocks');
  if (event.type === 'main-frame' || event.type === 'nested-frame') {
    if (event.clockToken !== state.clockToken || !integer(event.clockToken)) return blocked(state, 'stale-clock-token');
    if (!integer(event.frame, 1, 759)) return blocked(state, 'invalid-source-frame');
    if (event.type === 'main-frame') {
      if (state.pendingMainResume) {
        if (event.frame < state.pendingMainResume.resumeFrame) return blocked(state, 'awaiting-observed-main-resume');
        if (event.frame > 756) return blocked(state, 'observed-frame-past-source-terminal');
        return arrive(state, event.frame, [...state.resolvedStops, state.pendingMainResume.stopFrame]);
      }
      if (state.phase !== 'teaching') return blocked(state, 'main-held-by-source-state');
      if (event.frame <= state.mainFrame) return blocked(state, 'stale-or-unchanged-main-frame');
      if (event.frame > 756) return blocked(state, 'observed-frame-past-source-terminal');
      return arrive(state, event.frame);
    }
    const active = state.activeNestedFrames[0];
    if (!active || active.sourceObjectId !== event.sourceObjectId || event.frame <= active.frame)
      return blocked(state, 'stale-or-inactive-nested-frame');
    if (state.phase === 'explanation-opening' || state.phase === 'explanation-closing') {
      const box = explanations.find(box => box.index === state.activeExplanation)!;
      const terminal = state.phase === 'explanation-opening' ? box.heldFrame : box.closeTerminalFrame;
      if (event.frame > terminal) return blocked(state, 'nested-frame-crossed-source-boundary');
      if (event.frame === terminal && state.phase === 'explanation-closing') {
        return result(state, {phase: 'guided', activeExplanation: null, activeNestedFrames: [], clockToken: state.clockToken + 1});
      }
      return result(state, {phase: event.frame === terminal ? 'explanation-held' : state.phase,
        activeNestedFrames: [context(box, event.frame, true, event.frame !== terminal)],
        clockToken: state.clockToken + (event.frame === terminal ? 1 : 0)});
    }
    if (state.phase === 'feedback') {
      const selected = feedback.find(item => item.name === state.activeFeedback)!;
      if (event.frame > selected.terminalFrame) return blocked(state, 'nested-frame-crossed-source-boundary');
      if (event.frame < selected.terminalFrame) return result(state, {activeNestedFrames: [context(selected, event.frame, true, true)]});
      if (selected.kind === 'right') return requestResume(state, 737, 'source-feedback-terminal');
      if (state.quizAttempts === 1) return requestResume(state, 737, 'source-feedback-terminal', {quizAttempts: 0});
      return result(state, {phase: 'quiz', quizAttempts: 1, activeFeedback: null, activeNestedFrames: [], clockToken: state.clockToken + 1});
    }
    return blocked(state, 'nested-timeline-held');
  }
  if (['continue', 'open-explanation', 'close-explanation', 'choose-answer', 'open-popup', 'close-popup', 'open-glossary'].includes(event.type) &&
    (!('input' in event) || !validInput(event.input))) return blocked(state, 'invalid-activation-input');
  if (event.type === 'continue') {
    const target = P044_CONFIG.guidedTargets.find(t => t.stopFrame === state.mainFrame);
    if (state.phase !== 'guided' || !target || event.stopFrame !== state.mainFrame ||
      (event.sourceTarget !== 43 && !(event.sourceTarget === 44 && target.alternateAction === 'continue')))
      return blocked(state, 'source-continue-unavailable');
    return requestResume(state, event.stopFrame, 'source-continue');
  }
  if (event.type === 'open-explanation') {
    const box = explanations.find(box => box.stopFrame === event.stopFrame);
    if (!box || state.phase !== 'guided' || state.mainFrame !== box.stopFrame || state.explanationUsed[box.index])
      return blocked(state, 'source-explanation-unavailable');
    return result(state, {phase: 'explanation-opening', activeExplanation: box.index,
      explanationUsed: {...state.explanationUsed, [box.index]: true}, explanationVisible: {...state.explanationVisible, [box.index]: true},
      activeNestedFrames: [context(box, 1, true, true)], clockToken: state.clockToken + 1});
  }
  if (event.type === 'close-explanation') {
    const box = explanations.find(box => box.index === state.activeExplanation);
    if (state.phase !== 'explanation-held' || !box || event.sourceObjectId !== box.sourceObjectId)
      return blocked(state, 'source-close-unavailable');
    // Source105/130: the button's _parent is box106/139, NOT main293.
    return result(state, {phase: 'explanation-closing', quizSection: false,
      activeNestedFrames: [context(box, box.heldFrame, true, true)], clockToken: state.clockToken + 1});
  }
  if (event.type === 'choose-answer') {
    const answer = P044_CONFIG.answers.find(answer => answer.instanceName === event.instanceName);
    if (state.phase !== 'quiz' || state.mainFrame !== 737 || !answer) return blocked(state, 'source-answer-unavailable');
    const choices = feedback.filter(f => f.kind === answer.outcome);
    if (!integer(state.selections[answer.outcome] + 1)) return blocked(state, 'feedback-selection-counter-exhausted');
    const selected = choices[(state.seed % choices.length + state.selections[answer.outcome] % choices.length) % choices.length];
    return result(state, {phase: 'feedback', selectedAnswer: answer.instanceName, activeFeedback: selected.name,
      selections: {...state.selections, [answer.outcome]: state.selections[answer.outcome] + 1},
      activeNestedFrames: [context(selected, 1, true, true)], clockToken: state.clockToken + 1},
    [{epoch: state.epoch, kind: 'practice-feedback', outcome: answer.outcome, sourceButtonId: answer.sourceCharacterId,
      sourceInstanceName: answer.instanceName, feedbackVariant: selected.name, originalRandomAuthority: false}]);
  }
  if (event.type === 'open-popup') {
    if (state.phase !== 'quiz') return blocked(state, 'source-popup-unavailable');
    return result(state, {phase: 'popup', activeNestedFrames: [context(P044_CONFIG.popup, 1)], clockToken: state.clockToken + 1});
  }
  if (event.type === 'close-popup') {
    if (state.phase !== 'popup') return blocked(state, 'source-popup-not-open');
    return result(state, {phase: 'quiz', activeNestedFrames: [], clockToken: state.clockToken + 1});
  }
  if (event.type === 'open-glossary') {
    const term = P044_CONFIG.glossary.find(term => term.id === event.term);
    if (!term || (term.id === 'total' && state.mainFrame < 2) || (term.id !== 'total' && state.phase !== 'popup') || state.pendingMainResume)
      return blocked(state, 'source-glossary-unavailable');
    const requestToken = state.glossarySequence + 1;
    if (!integer(requestToken)) return blocked(state, 'glossary-token-exhausted');
    return result(state, {glossary: {term: term.id, requestToken, status: 'requested', resumeMain: state.phase === 'teaching'},
      glossarySequence: requestToken, clockToken: state.clockToken + 1},
    [{epoch: state.epoch, kind: 'transport', action: 'pause', frame: state.mainFrame},
      {epoch: state.epoch, kind: 'glossary-open', term: term.id, sourceButtonId: term.sourceButtonId, requestToken}]);
  }
  return blocked(state, 'unsupported-event');
}

export function queryP044(state: P044State) {
  requireState(state);
  const enabled = !state.paused && !state.glossary && !state.pendingMainResume;
  const guided = P044_CONFIG.guidedTargets.find(item => item.stopFrame === state.mainFrame);
  const activeBox = explanations.find(item => item.index === state.activeExplanation);
  const sourceContexts: P044SourceContext[] = [];
  const active = state.activeNestedFrames[0];
  // Override by full instance path. These lifetimes are source Place/Remove
  // observations; symbol85's two simultaneous placements are not conflated.
  if (state.mainFrame >= 450 && state.mainFrame <= 697) sourceContexts.push(context({sourceObjectId: 85, depth: 32, placementFrame: 450, name: 'Mc_Wrong_Feed1'}, 1));
  if (state.mainFrame === 575) sourceContexts.push(context({sourceObjectId: 85, depth: 74, placementFrame: 575, name: 'Mc_Wrong_Feed1'}, 1));
  for (const box of explanations) if (state.mainFrame === box.stopFrame) {
    sourceContexts.push(context({sourceObjectId: 44, depth: 30, placementFrame: box.stopFrame, name: null},
      1, !state.explanationUsed[box.index]));
    sourceContexts.push(context(box, active?.sourceObjectId === box.sourceObjectId ? active.frame : 1,
      state.explanationVisible[box.index], enabled && active?.sourceObjectId === box.sourceObjectId &&
      (state.phase === 'explanation-opening' || state.phase === 'explanation-closing')));
  }
  if (state.mainFrame === 737) {
    for (const item of feedback) sourceContexts.push(context(item, active?.sourceObjectId === item.sourceObjectId ? active.frame : 1,
      true, enabled && state.phase === 'feedback' && active?.sourceObjectId === item.sourceObjectId));
    sourceContexts.push(context(P044_CONFIG.popup, 1, state.phase === 'popup'));
  }
  return freeze({animationId: P044_CONFIG.animationId, rootFrame: 6, frameDomain: 'sprite-293', sourceLanguage: 'en',
    mainFrame: state.mainFrame, phase: state.phase, paused: state.paused, epoch: state.epoch, clockToken: state.clockToken,
    mainPlaying: enabled && state.phase === 'teaching', nestedPlaying: enabled &&
      ['feedback', 'explanation-opening', 'explanation-closing'].includes(state.phase),
    pendingMainResume: state.pendingMainResume, sourceContexts,
    activeNestedFrames: state.activeNestedFrames.map(item => ({...item, playing: enabled && item.playing})),
    sourceVisibility: {a_text: state.aTextVisible, Mc_Popup: state.phase === 'popup'},
    unboundLegacyWrites: {a_text: {requestedVisible: state.aTextVisible, sourceInstancePath: null, localVisualOverride: false}},
    quizAttempts: state.quizAttempts, quizSection: state.quizSection,
    selectedAnswer: state.selectedAnswer, activeFeedback: state.activeFeedback,
    controls: {
      continueTargets: enabled && state.phase === 'guided' && guided
        ? [43, ...(guided.alternateAction === 'continue' ? [44] : [])] : [],
      explanation: enabled && state.phase === 'guided' ? explanations.find(box => box.stopFrame === state.mainFrame && !state.explanationUsed[box.index])?.sourceObjectId ?? null : null,
      explanationClose: enabled && state.phase === 'explanation-held' ? activeBox?.closeButtonId ?? null : null,
      answers: enabled && state.phase === 'quiz' ? P044_CONFIG.answers : [],
      popupOpen: enabled && state.phase === 'quiz', popupClose: enabled && state.phase === 'popup',
      glossary: enabled && state.mainFrame >= 2 ? state.phase === 'popup' ? P044_CONFIG.glossary : [P044_CONFIG.glossary[0]] : [],
      replay: true,
    },
    glossary: state.glossary, completed: state.phase === 'complete',
    sourceResidualSemanticsEstablished: false, originalRuntimeAccepted: false, audioIntegrated: false,
  });
}
export type P044Query = ReturnType<typeof queryP044>;
