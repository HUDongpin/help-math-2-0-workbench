import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {LessonTextBinding} from './lesson-text-contract';
import {P047_SOURCE} from './nms-l01-p047-source-data-v1';
import {p047InputIdentity, p047Question, p047Results, p047Review, p047SourceFrame, type P047QuizState} from './nms-l01-p047-quiz-v1';

export const P047_TEXT_BINDING: LessonTextBinding = Object.freeze({...P047_SOURCE.textBinding,
  blocks: Object.freeze([...P047_SOURCE.textBinding.blocks, ...P047_SOURCE.figureText.map(value => value.binding),
    {id: 'progress', sourceTextIds: [...P047_SOURCE.dynamicRoleTextIds['session-ordinal'], ...P047_SOURCE.dynamicRoleTextIds['session-total']],
      role: 'label' as const, language: 'en' as const, readingOrder: 140, valueSource: 'maintained-page-state' as const},
    {id: 'finish-score', sourceTextIds: P047_SOURCE.dynamicRoleTextIds['finish-score'],
      role: 'feedback' as const, language: 'en' as const, readingOrder: 141, valueSource: 'maintained-page-state' as const},
    {id: 'review-selected', sourceTextIds: P047_SOURCE.dynamicRoleTextIds['review-selected-letter'],
      role: 'feedback' as const, language: 'en' as const, readingOrder: 142, valueSource: 'maintained-page-state' as const},
    {id: 'review-correct', sourceTextIds: P047_SOURCE.dynamicRoleTextIds['review-correct-letter'],
      role: 'feedback' as const, language: 'en' as const, readingOrder: 143, valueSource: 'maintained-page-state' as const},
    {id: 'finish-message', sourceTextIds: ['character-14'], role: 'body' as const, language: 'en' as const, readingOrder: 144, valueSource: 'source-static' as const},
    {id: 'finish-score-label', sourceTextIds: ['character-15'], role: 'label' as const, language: 'en' as const, readingOrder: 145, valueSource: 'source-static' as const},
    {id: 'source-quiz-title', sourceTextIds: [], sourceShapeIds: [3], role: 'title' as const, language: 'en' as const, readingOrder: 146, valueSource: 'source-static' as const},
  ])});

/** The quiz state is the only source of question, figure and text visibility.
 * A locale or font/layout change has no effect on this state. */
export function p047TextSnapshot(state: P047QuizState, language: 'en' | 'es') {
  const identity = p047InputIdentity(state), source = p047SourceFrame(state);
  const current = identity.questionId === null ? null : p047Question(identity.questionId);
  const review = p047Review(state), result = p047Results(state);
  const values: Record<string, {text: string; visible: boolean}> = {};
  for (const question of P047_SOURCE.questions) {
    values[question.promptBlockId] = {text: question.prompt, visible: current?.id === question.id};
    for (const option of question.options) values[option.blockId] = {text: option.value, visible: current?.id === question.id};
  }
  for (const value of P047_SOURCE.figureText) values[value.binding.id] = {text: value.text, visible: current?.id === value.question};
  values.progress = {text: `${identity.ordinal ?? 10} / 10`, visible: current !== null};
  values['finish-score'] = {text: result ? `${result.correct} / ${result.total}.` : '', visible: state.phase === 'result'};
  values['review-selected'] = {text: review?.response.choice ?? '', visible: review !== null};
  values['review-correct'] = {text: review?.question.correctLetter ?? '', visible: review !== null};
  values['finish-message'] = {text: 'You have completed the quiz.', visible: state.phase === 'result'};
  values['finish-score-label'] = {text: 'Your score is', visible: state.phase === 'result'};
  values['source-quiz-title'] = {text: 'Positive & Negative Numbers: Final Quiz', visible: true};
  return buildLessonTextSnapshot(P047_TEXT_BINDING, {frame: source.frame, rootFrame: source.rootFrame,
    frameDomain: source.frameDomain, scenario: 'source-quiz', lang: language, seed: state.seed, replay: state.replay}, values);
}
