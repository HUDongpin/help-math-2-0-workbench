import {P047_SOURCE} from './nms-l01-p047-source-data-v1';

export type P047Choice = 'A' | 'B' | 'C' | 'D';
export type P047Phase = 'question' | 'result' | 'review' | 'closed';
export type P047Question = (typeof P047_SOURCE.questions)[number];
export interface P047Response {
  readonly questionId: number;
  readonly ordinal: number;
  readonly choice: P047Choice;
  readonly sourceInstance: string;
  readonly correct: boolean;
  readonly elapsedMs: number;
}
export interface P047QuizState {
  readonly seed: number;
  readonly replay: number;
  readonly revision: number;
  readonly phase: P047Phase;
  readonly rngState: number;
  readonly remaining: readonly number[];
  readonly order: readonly number[];
  readonly responses: readonly P047Response[];
  readonly reviewIndex: number | null;
  readonly elapsedMs: number;
  readonly finishedElapsedMs: number | null;
}
export interface P047InputIdentity {
  readonly seed: number;
  readonly replay: number;
  readonly revision: number;
  readonly phase: P047Phase;
  readonly questionId: number | null;
  readonly ordinal: number | null;
}
export type P047Action =
  | Readonly<{type: 'answer'; identity: P047InputIdentity; choice: P047Choice; elapsedMs: number}>
  | Readonly<{type: 'review'; identity: P047InputIdentity}>
  | Readonly<{type: 'review-next'; identity: P047InputIdentity}>
  | Readonly<{type: 'close'; identity: P047InputIdentity}>
  | Readonly<{type: 'replay'; identity: P047InputIdentity}>;

export const P047_ADAPTATIONS = Object.freeze({
  random: 'Seeded Mulberry32 draws follow the source splice-without-replacement rule; no AVM1 random-output parity.',
  reviewEntry: 'An explicit modern Review control connects Finish to the authored doGetReview sequence; no source-local edge is established.',
  sourceNames: 'Q23 selected C stores actual A231Opt3; review maps to R23Opt3. Q21 selected C maps to actual R210Opt3.',
  elapsedTime: 'Caller supplies monotonic active elapsed milliseconds. Completion freezes the source report snapshot; no learner data is sent.',
  close: 'Only marks this local state closed; the typed modern host owns any navigation. No legacy URL or closeApp execution.',
  language: 'Source English text is retained for EN and ES interfaces; source EN/ES recordings are selected independently.',
});

function freezeState(state: P047QuizState): P047QuizState {
  return Object.freeze({...state, remaining: Object.freeze([...state.remaining]), order: Object.freeze([...state.order]),
    responses: Object.freeze(state.responses.map(response => Object.freeze({...response})))});
}
function requireUint(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) throw new Error(`P047 invalid ${name}`);
  return value;
}
function draw(remaining: readonly number[], rngState: number) {
  if (!remaining.length) throw new Error('P047 empty question bank');
  const next = (rngState + 0x6d2b79f5) >>> 0;
  let value = next;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  const unit = ((value ^ value >>> 14) >>> 0) / 4294967296;
  const index = Math.floor(unit * remaining.length);
  return {id: remaining[index]!, rngState: next, remaining: remaining.filter((_, i) => i !== index)};
}
export function createP047Quiz(seed: number, replay = 0): P047QuizState {
  requireUint(seed, 'seed'); requireUint(replay, 'replay');
  const first = draw(P047_SOURCE.questions.map(question => question.id), seed);
  return freezeState({seed, replay, revision: 0, phase: 'question', rngState: first.rngState,
    remaining: first.remaining, order: [first.id], responses: [], reviewIndex: null, elapsedMs: 0, finishedElapsedMs: null});
}
export function p047Question(id: number): P047Question {
  const question = P047_SOURCE.questions.find(candidate => candidate.id === id);
  if (!question) throw new Error(`P047 unknown question ${id}`);
  return question;
}
export function p047InputIdentity(state: P047QuizState): P047InputIdentity {
  const index = state.phase === 'question' ? state.responses.length : state.phase === 'review' ? state.reviewIndex : null;
  return Object.freeze({seed: state.seed, replay: state.replay, revision: state.revision, phase: state.phase,
    questionId: index === null ? null : state.order[index]!, ordinal: index === null ? null : index + 1});
}
function matches(state: P047QuizState, identity: P047InputIdentity) {
  const actual = p047InputIdentity(state);
  return identity && Object.keys(actual).every(key => actual[key as keyof P047InputIdentity] === identity[key as keyof P047InputIdentity]);
}

/** One accepted release consumes one response. An old DOM event can never
 * answer the next question or mutate a replayed quiz. No timer, RNG or I/O is
 * hidden in this reducer; the full state can be deterministically queried. */
export function reduceP047Quiz(state: P047QuizState, action: P047Action): P047QuizState {
  if (!matches(state, action.identity)) return state;
  if (action.type === 'replay') {
    if (state.replay === 0xffffffff) return state;
    return createP047Quiz(state.seed, state.replay + 1);
  }
  if (action.type === 'answer') {
    if (state.phase !== 'question' || !['A', 'B', 'C', 'D'].includes(action.choice)
      || !Number.isFinite(action.elapsedMs) || action.elapsedMs < state.elapsedMs || action.elapsedMs < 0) return state;
    const question = p047Question(state.order[state.responses.length]!);
    const option = question.options.find(option => option.letter === action.choice)!;
    const responses = [...state.responses, {questionId: question.id, ordinal: state.responses.length + 1,
      choice: action.choice, sourceInstance: option.sourceInstance, correct: option.correct, elapsedMs: action.elapsedMs}];
    if (responses.length === P047_SOURCE.sessionQuestionCount) {
      return freezeState({...state, phase: 'result', responses, revision: state.revision + 1,
        elapsedMs: action.elapsedMs, finishedElapsedMs: action.elapsedMs});
    }
    const next = draw(state.remaining, state.rngState);
    return freezeState({...state, responses, order: [...state.order, next.id], remaining: next.remaining,
      rngState: next.rngState, revision: state.revision + 1, elapsedMs: action.elapsedMs});
  }
  if (action.type === 'review' && state.phase === 'result') {
    return freezeState({...state, phase: 'review', reviewIndex: 0, revision: state.revision + 1});
  }
  if (action.type === 'review-next' && state.phase === 'review' && state.reviewIndex !== null) {
    const next = state.reviewIndex + 1;
    return freezeState({...state, phase: next === state.responses.length ? 'result' : 'review',
      reviewIndex: next === state.responses.length ? null : next, revision: state.revision + 1});
  }
  if (action.type === 'close' && state.phase === 'result') {
    return freezeState({...state, phase: 'closed', revision: state.revision + 1});
  }
  return state;
}

export function p047Results(state: P047QuizState) {
  if (state.responses.length !== 10) return null;
  const correct = state.responses.filter(response => response.correct).length;
  const grade = correct <= 3 ? 'Unsatisfactory' : correct <= 6 ? 'Partially Proficient' : correct <= 8 ? 'Proficient' : 'Advanced';
  return Object.freeze({correct, wrong: 10 - correct, total: 10, grade, elapsedMs: state.finishedElapsedMs});
}
export function p047Review(state: P047QuizState) {
  if (state.phase !== 'review' || state.reviewIndex === null) return null;
  const response = state.responses[state.reviewIndex]!;
  const question = p047Question(response.questionId);
  return Object.freeze({question, response, options: question.options.map(option => Object.freeze({
    letter: option.letter, value: option.value, sourceInstance: option.reviewInstance,
    selected: response.choice === option.letter, correct: option.correct,
    // The later source correct-answer assignment wins over its earlier label.
    feedback: option.correct ? 'Correct' : response.choice === option.letter ? 'Incorrect' : '',
  }))});
}
export function p047SourceFrame(state: P047QuizState) {
  const review = p047Review(state);
  return Object.freeze({rootFrame: 6, frameDomain: 'sprite-1024',
    frame: review?.question.reviewFrame ?? p047Question(state.order[state.order.length - 1]!).questionFrame,
    finishVisible: state.phase === 'result' || state.phase === 'closed', finishFrame: 2});
}
export function p047AudioAsset(questionId: number, language: 'en' | 'es', choice: P047Choice | null) {
  const asset = P047_SOURCE.audio.find(asset => asset.question === questionId && asset.language === language && asset.choice === choice);
  if (!asset) throw new Error('P047 audio selection has no exact source binding');
  return asset;
}
