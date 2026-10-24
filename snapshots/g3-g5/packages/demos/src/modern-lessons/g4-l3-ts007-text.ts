import type {RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextBlockBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {COURSE_G04_L03_TS_007_SOURCE} from '../timelines/course-g04-l03-ts-007';
import {
  COURSE_G04_L03_TS_007_CHOICES as CHOICES,
  COURSE_G04_L03_TS_007_HELP as HELP,
  COURSE_G04_L03_TS_007_HELP_AXIS as HELP_AXIS,
  COURSE_G04_L03_TS_007_QUESTION as QUESTION,
  COURSE_G04_L03_TS_007_WALKTHROUGH_COPY as WALKTHROUGH,
  createCourseG04L03Ts007InteractionState,
  type CourseG04L03Ts007InteractionState,
} from '../timelines/course-g04-l03-ts-007-practice-question-interaction';

const ID = 'course-g04-l03-ts-007';
const DOMAIN = 'sprite-441';
const VERSION = 'g04-l03-placement-035-native-text-v1';
const runs = (character: number, count = 1) => Array.from({length: count}, (_, run) => `character-${character}/run-${run}`);
const signed = (value: number) => value < 0 ? `−${-value}` : String(value);

/** Source sprite441 depth40/14 and the main figure fade at frames1..7.
 * Answer characters first exist at8 alpha0 and fade8..12. Glossary assistance
 * from8 is safe-disabled modern UI, not temporary source-highlight parity. */
export const TS007_INTRO_SOURCE_ALPHA = Object.freeze([0,43,85,128,171,213,256] as const);
export function TS007_INTRO_OPACITY(frame: number): number {
  if (!Number.isInteger(frame) || frame < 1 || frame > 235) return 0;
  return frame <= 7 ? TS007_INTRO_SOURCE_ALPHA[frame - 1] / 256 : 1;
}
export const TS007_INTRO_CHOICES_SOURCE_ALPHA = Object.freeze([0,64,128,192,256] as const);
export function TS007_INTRO_CHOICES_OPACITY(frame: number): number {
  if (!Number.isInteger(frame) || frame < 8 || frame > 235) return 0;
  return frame <= 12 ? TS007_INTRO_CHOICES_SOURCE_ALPHA[frame - 8] / 256 : 1;
}

/** Source parent500 offers sprite114 Draw; parent617 offers sprite127 Guess.
 * Inline complete diagrams are modern teaching projections, not child clocks. */
export const TS007_NATIVE_WALKTHROUGH = Object.freeze([
  WALKTHROUGH[0], WALKTHROUGH[1],
  Object.freeze({sourceFrame: 500, sourceTextIds: Object.freeze([92,91,94,95,96]),
    paragraphs: Object.freeze([...WALKTHROUGH[2].paragraphs,
      'Use strategy: Draw a picture.', 'Label the number line to see where −2 is.',
      'The correct answer choice is B.'])}),
  Object.freeze({sourceFrame: 617, sourceTextIds: Object.freeze([117,118,96]),
    paragraphs: Object.freeze(['Use strategy: Guess and Check',
      'Where is each symbol located?', 'The correct answer choice is B.'])}),
]);

export const TS007_GUESS_LOCATIONS = Object.freeze([
  {choiceId: 'A', value: -4, sourceTextIds: [...runs(119), ...runs(126)], sourceShapeIds: [19]},
  {choiceId: 'B', value: -2, sourceTextIds: [...runs(120), ...runs(123)], sourceShapeIds: [19]},
  {choiceId: 'C', value: 2, sourceTextIds: [...runs(121), ...runs(123)]},
  {choiceId: 'D', value: 4, sourceTextIds: [...runs(124), ...runs(126)]},
] as const);

const axisCharacters: Readonly<Record<number, number>> = {
  '-5': 17, '-4': 108, '-3': 110, '-2': 111, '-1': 113,
  '0': 16, '1': 113, '2': 111, '3': 110, '4': 108, '5': 17,
};
export const TS007_MAIN_AXIS_LABEL_SOURCE_IDS = Object.freeze(Object.fromEntries(
  Object.entries(axisCharacters).map(([value, character]) => [value, runs(character)]),
) as Readonly<Record<number, readonly string[]>>);

const block = (id: string, sourceTextIds: readonly string[], role: LessonTextBlockBinding['role'],
  readingOrder: number, sourceShapeIds?: readonly number[]): LessonTextBlockBinding => ({
  id, sourceTextIds, role, readingOrder, ...(sourceShapeIds ? {sourceShapeIds} : {}),
  language: 'en', valueSource: 'maintained-page-state',
});

export const TS007_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-035', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_007_SOURCE.swfSha256, template: 'exercise',
  blocks: [
    block('question', runs(14, 5), 'question', 0, [18]),
    block('where-question', runs(50), 'body', 10, [19]),
    block('given', runs(92, 2), 'body', 20),
    block('needed', runs(91, 2), 'body', 21, [19]),
    block('draw-strategy', runs(94), 'body', 22),
    block('draw-instruction', runs(95), 'body', 23, [19]),
    block('draw-result', runs(96), 'body', 24),
    block('guess-strategy', runs(117), 'body', 30),
    block('guess-question', runs(118), 'body', 31),
    block('guess-result', runs(96), 'body', 36),
    ...Array.from({length: 11}, (_, index) => index - 5).map((value, index) =>
      block(`main-tick-${value}`, TS007_MAIN_AXIS_LABEL_SOURCE_IDS[value], 'label', 50 + index,
        value === -5 ? [18] : value < 0 ? [109] : undefined)),
    block('main-caption', [], 'label', 49),
    ...CHOICES.map((choice, index) => block(`main-symbol-${choice.id}`, [], 'label', 65 + index,
      choice.id === 'D' ? [15,97,125] : [15,97,122])),
    ...TS007_GUESS_LOCATIONS.map((location, index) =>
      block(`guess-${location.choiceId}`, location.sourceTextIds, 'label', 32 + index,
        'sourceShapeIds' in location ? location.sourceShapeIds : undefined)),
    ...CHOICES.map((choice, index) => block(`choice-${choice.id}`,
      runs([35,42,37,39][index]), 'answer', 80 + index)),
    block('need-more-help', [...runs(4), ...runs(5)], 'answer', 85),
    block('glossary-symbol', runs(44), 'answer', 86),
    block('glossary-number-line', runs(46), 'answer', 87),
    block('help-description', runs(141, 9), 'body', 100),
    block('help-example', runs(140, 5), 'body', 101, [142]),
    block('help-negative', runs(146), 'body', 102),
    block('help-positive', runs(147), 'body', 103),
    block('help-caption', [], 'label', 104),
    ...HELP_AXIS.map((tick, index) => block(`help-tick-${tick.value}`,
      runs(tick.sourceTextId), 'label', 110 + index, tick.value < 0 ? [174] : undefined)),
    block('close', runs(100), 'answer', 140),
    block('feedback-heading', [187,188,190,197,198,220,221,280,281,283,319,320,339,340,379,380]
      .flatMap(character => runs(character)), 'feedback', 150),
    // Outcome/retry/terminal copy belongs to maintained interaction assistance.
    block('feedback-assistive', [], 'feedback', 151),
    block('terminal', [], 'feedback', 160),
    block('walkthrough-progress', [], 'label', 170),
    block('continue', [], 'answer', 171),
    block('replay', [], 'answer', 172),
  ],
};

export function TS007_NATIVE_FEEDBACK_TEXT(interaction: CourseG04L03Ts007InteractionState): string {
  if (interaction.feedback?.kind === 'right') return 'Correct. The heart, answer B, is located at negative two.';
  return interaction.wrongTryCount === 0
    ? 'That answer is not correct. After this feedback, try the question again.'
    : 'That answer is not correct. This is the second try; the activity will continue to its terminal state.';
}

/** The host's initial snapshot has no learner-state claim. The component passes
 * its actual reducer state for every visible native update. */
export function getTs007TextSnapshot(input: unknown, context: RuntimeContext,
  interaction: CourseG04L03Ts007InteractionState = createCourseG04L03Ts007InteractionState(context.seed),
): TextPresentationSnapshot {
  const state = (input && typeof input === 'object' ? input : {}) as Partial<SourceStaticCanvasFrameState>;
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== TS007_BINDING.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6)) blockers.push('unsupported-root-context');
  if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 235
    || state.frame !== context.frame) blockers.push('unsupported-native-frame');
  if (state.seed !== (context.seed >>> 0) || interaction.seed !== (context.seed >>> 0)) blockers.push('source-seed-mismatch');
  if (context.entryStateSha256 || state.entryStateSha256) blockers.push('capture-uses-source-canvas');
  const ready = blockers.length === 0;
  const interactive = context.frame === 235;
  const intro = context.frame < 235;
  const introFigure = intro && context.frame >= 2;
  const introChoices = intro && context.frame >= 9;
  const introGlossary = intro && context.frame >= 8;
  const help = interactive && interaction.phase === 'need-more-help';
  const gate = interactive && interaction.phase === 'walkthrough' ? interaction.walkthroughGate : null;
  const quiz = interactive && interaction.phase === 'quiz';
  const feedback = interactive && interaction.phase === 'feedback';
  const values: Record<string, {text: string; visible: boolean}> = {};
  const put = (id: string, text: string, visible: boolean) => {values[id] = {text, visible};};
  put('question', QUESTION.prompt, introFigure || gate === 0 || quiz);
  put('where-question', WALKTHROUGH[1].paragraphs[0], gate === 1);
  put('given', WALKTHROUGH[2].paragraphs[0], gate === 2);
  put('needed', WALKTHROUGH[2].paragraphs[1], gate === 2);
  TS007_NATIVE_WALKTHROUGH[2].paragraphs.slice(2).forEach((text, index) =>
    put(['draw-strategy','draw-instruction','draw-result'][index], text, gate === 2));
  TS007_NATIVE_WALKTHROUGH[3].paragraphs.forEach((text, index) =>
    put(['guess-strategy','guess-question','guess-result'][index], text,
      gate === 3 || (quiz && index < 2)));
  for (let value = -5; value <= 5; value++) put(`main-tick-${value}`, signed(value),
    (introFigure || gate !== null || quiz) && (gate === 2 || value === -5 || value === 0 || value === 5));
  put('main-caption', 'Positions on the number line', introFigure || gate !== null || quiz);
  CHOICES.forEach((choice, index) => put(`main-symbol-${choice.id}`, ['●','♥','■','▲'][index], introFigure || gate !== null || quiz));
  TS007_GUESS_LOCATIONS.forEach(location => put(`guess-${location.choiceId}`,
    `${location.choiceId}: ${signed(location.value)}`, gate === 3 || quiz));
  CHOICES.forEach(choice => put(`choice-${choice.id}`, `${choice.id} ${choice.symbol}`, introChoices || quiz));
  put('need-more-help', 'Need More Help', quiz || help);
  put('glossary-symbol', 'Symbol glossary unavailable', introGlossary || quiz);
  put('glossary-number-line', 'Number line glossary unavailable', introGlossary || quiz);
  put('help-description', HELP.description, help);
  put('help-example', HELP.example, help);
  put('help-negative', HELP.negativeTitle, help);
  put('help-positive', HELP.positiveTitle, help);
  put('help-caption', 'Number line from −10 to 10', help);
  HELP_AXIS.forEach(tick => put(`help-tick-${tick.value}`, signed(tick.value), help));
  put('close', 'Close', help);
  put('feedback-heading', interaction.feedback?.sourceWindow.sourceHeading ?? '', feedback);
  put('feedback-assistive', TS007_NATIVE_FEEDBACK_TEXT(interaction), feedback);
  put('terminal', 'Question complete\nUse Replay to restart the complete walkthrough and quiz state.', interactive && interaction.phase === 'terminal');
  put('walkthrough-progress', `Walkthrough checkpoint ${(gate ?? 0) + 1} of 4.`, gate !== null);
  put('continue', 'Continue', gate !== null || feedback);
  put('replay', 'Replay', interactive && interaction.phase === 'terminal');
  return {schemaVersion: 1, animationId: ID, bindingVersion: VERSION,
    sourceSwfSha256: TS007_BINDING.sourceSwfSha256, status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state.frame ?? context.frame, frameDomain: state.frameDomain ?? DOMAIN,
      rootFrame: state.rootFrame ?? context.rootFrame ?? 6, scenario: state.scenario ?? context.scenario,
      language: state.language ?? context.lang, seed: state.seed ?? context.seed, replay: context.replay ?? 0},
    suppressedInstances: [], blocks: ready ? TS007_BINDING.blocks.map(binding => ({
      id: binding.id, text: values[binding.id]?.text ?? '', visible: values[binding.id]?.visible ?? false,
      role: binding.role, language: binding.language, readingOrder: binding.readingOrder,
    })) : [],
  };
}
