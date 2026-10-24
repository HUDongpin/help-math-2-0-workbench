import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';

const titlePath = [
  {timelineId: 'root', depth: 65, generation: 1, characterId: 56},
  {timelineId: 'sprite-56', depth: 1, generation: 1, characterId: 55},
] as const;
const questionPath = [
  {timelineId: 'root', depth: 1, generation: 1, characterId: 53},
  {timelineId: 'sprite-53', depth: 20, generation: 1, characterId: 46},
] as const;
export const P006_TITLE_INSTANCE: LessonTextInstance = Object.freeze({
  id: lessonTextInstanceId(titlePath), path: titlePath,
});
export const P006_QUESTION_INSTANCE: LessonTextInstance = Object.freeze({
  id: lessonTextInstanceId(questionPath), path: questionPath,
});
const underlinePath = [
  {timelineId: 'root', depth: 1, generation: 1, characterId: 53},
  {timelineId: 'sprite-53', depth: 19, generation: 1, characterId: 44},
] as const;
export const P006_QUESTION_UNDERLINE_INSTANCE: LessonTextInstance = Object.freeze({
  id: lessonTextInstanceId(underlinePath), path: underlinePath,
});
const questionPaperPath = [
  {timelineId: 'root', depth: 1, generation: 1, characterId: 53},
  {timelineId: 'sprite-53', depth: 17, generation: 17, characterId: 42},
] as const;
export const P006_QUESTION_PAPER_INSTANCE: LessonTextInstance = Object.freeze({
  id: lessonTextInstanceId(questionPaperPath), path: questionPaperPath,
});
export const P006_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1, version: 'p006-source-native-text-v1',
  placementId: 'shared-alg001-l12-p006', animationId: 'shared-alg001-l12-p006',
  sourceSwfSha256: '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6',
  template: 'explanation',
  blocks: Object.freeze([
    {id: 'title', sourceTextIds: [], sourceShapeIds: [55], role: 'title' as const,
      language: 'en' as const, readingOrder: 0, valueSource: 'source-static' as const, instance: P006_TITLE_INSTANCE},
    {id: 'question', sourceTextIds: Array.from({length: 7}, (_, run) => `character-46/run-${run}`),
      role: 'question' as const, language: 'en' as const, readingOrder: 1,
      valueSource: 'maintained-page-state' as const, instance: P006_QUESTION_INSTANCE},
  ]),
});
export const P006_TITLE = 'Graphing in the Coordinate Plane: Real World Activity';
export const P006_QUESTION = 'Essential Question: How can we use the coordinate plane to graph equations and inequalities?';

/** Exact full-word visibility from font45 glyph extrema and the authored
 * morph43 clip edge. See question-reveal.json / TYPOGRAPHY_SOURCE_2026-09-27.md.
 * Native text uses complete words; partially clipped legacy glyphs are not
 * copied. No word is exposed before its complete source geometry is visible. */
export const P006_QUESTION_WORDS = Object.freeze([
  ['Essential', 254], ['Question:', 259], ['How', 278], ['can', 280], ['we', 282],
  ['use', 284], ['the', 286], ['coordinate', 298], ['plane', 301], ['to', 311],
  ['graph', 314], ['equations', 319], ['and', 331], ['inequalities?', 338],
].map(([text, firstFrame]) => Object.freeze({text: text as string, firstFrame: firstFrame as number})));

export function p006TextSnapshot(context: RuntimeContext): TextPresentationSnapshot {
  const valid = Number.isSafeInteger(context.frame) && context.frame >= 1 && context.frame <= 342 &&
    context.frameDomain === 'sprite-53' && context.rootFrame === 6 &&
    context.scenario === 'source-static-frame' && context.lang === 'en' && context.seed === 0;
  const question = P006_QUESTION_WORDS.filter(word => context.frame >= word.firstFrame).map(word => word.text).join(' ');
  const snapshot = buildLessonTextSnapshot(P006_TEXT_BINDING, context, {
    title: {text: P006_TITLE, visible: true}, question: {text: question, visible: question.length > 0},
  });
  if (!valid) return Object.freeze({...snapshot, status: 'blocked', blocks: [], suppressedInstances: [],
    blockers: Object.freeze([...snapshot.blockers, 'unsupported-p006-source-context'])});
  // The question is placed at 249 before its clipping edge reaches the first
  // whole word. Suppress that exact active instance, including the empty reveal.
  return Object.freeze({...snapshot, suppressedInstances: snapshot.status === 'ready'
    ? Object.freeze([P006_TITLE_INSTANCE,
      ...(context.frame >= 242 ? [P006_QUESTION_PAPER_INSTANCE] : []),
      ...(context.frame >= 249 ? [P006_QUESTION_INSTANCE, P006_QUESTION_UNDERLINE_INSTANCE] : [])])
    : snapshot.suppressedInstances});
}
