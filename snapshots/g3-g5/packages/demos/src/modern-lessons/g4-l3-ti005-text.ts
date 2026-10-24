import type {AnimationRendererProps} from '../contract';
import type {LessonTextBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import type {CourseG04L03Ti005InteractionState} from '../timelines/course-g04-l03-ti-005-pattern-quiz-interaction';
import source from './generated/g4-l3-ti005-introduction.json';

export const TI005_BINDING: LessonTextBinding = {
  ...source.binding as LessonTextBinding,
  version: 'g4-l3-ti005-native-v1',
  blocks: [
    ...source.binding.blocks as LessonTextBinding['blocks'],
    ...([
      ['question-pattern', 'character-184', 'label'],
      ['first-answer', 'character-191', 'answer'],
      ['second-answer', 'character-192', 'answer'],
      ['wrong-feedback', 'character-202', 'feedback'],
      ['close-feedback', 'character-194/run-0', 'label'],
    ] as const).map(([id, sourceTextId, role], index) => ({
      id, sourceTextIds: [sourceTextId], role, language: 'en' as const,
      readingOrder: source.binding.blocks.length + index,
      valueSource: id === 'close-feedback' ? 'source-static' as const : 'maintained-page-state' as const,
    })),
  ],
};

export function getTi005TextSnapshot(state: unknown, context: AnimationRendererProps,
  interaction?: CourseG04L03Ti005InteractionState): TextPresentationSnapshot {
  const s = state as Record<string, unknown> | null;
  const blockers: string[] = [];
  const domain = context.frameDomain ?? 'sprite-208';
  const rootFrame = context.rootFrame ?? 6;
  if (!s || s.animationId !== TI005_BINDING.animationId || s.sourceSwfSha256 !== source.sourceSha256) blockers.push('source-identity-mismatch');
  if (!s || s.status !== 'ready' || s.blocker) blockers.push('source-state-not-ready');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 209 || domain !== 'sprite-208' || rootFrame !== 6 || context.scenario !== 'source-static-frame' || context.lang !== 'en' || context.entryStateSha256) blockers.push('unsupported-native-context');
  if (s && (s.frame !== context.frame || s.frameDomain !== domain || s.rootFrame !== rootFrame || s.scenario !== context.scenario || s.language !== context.lang || s.seed !== context.seed)) blockers.push('source-context-mismatch');
  const question = context.frame === 209;
  if (question && !interaction) blockers.push('interaction-state-required');
  const intro = source.frames[Math.max(0, Math.min(208, context.frame - 1))]!;
  const values: Record<string, string> = {
    number: intro.number, instruction: intro.instruction,
    answerInstruction: intro.answerInstruction, answerEnding: intro.answerEnding,
    newProblemInstruction: intro.newProblemInstruction, newProblemEnding: intro.newProblemEnding,
    questionMark: intro.questionMark,
    checkLabel: question ? source.texts['168'] : intro.checkLabel,
    newProblemLabel: question ? source.texts['170'] : intro.newProblemLabel,
    'pattern-separator': source.texts['165'], 'pattern-ending': source.texts['166'],
    'question-pattern': interaction?.currentQuestion.label ?? '',
    'first-answer': interaction?.answerFirst ?? '', 'second-answer': interaction?.answerSecond ?? '',
    'wrong-feedback': interaction?.feedbackText ?? '', 'close-feedback': 'Close',
  };
  return {
    schemaVersion: 1, animationId: TI005_BINDING.animationId,
    bindingVersion: TI005_BINDING.version, sourceSwfSha256: source.sourceSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: context.frame, frameDomain: domain, rootFrame, scenario: context.scenario,
      language: context.lang, seed: context.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: blockers.length ? [] : TI005_BINDING.blocks.map(block => {
      let text = values[block.id] ?? '', visible = Boolean(text);
      if (/^pattern-\d$/.test(block.id)) {
        text = intro.pattern[Number(block.id.slice(-1))] ?? '';
        visible = intro.exampleVisible;
      }
      if (['pattern-separator', 'pattern-ending'].includes(block.id)) visible = intro.exampleVisible || question;
      if (['question-pattern', 'first-answer', 'second-answer'].includes(block.id)) visible = question;
      if (['wrong-feedback', 'close-feedback'].includes(block.id)) visible = question && interaction?.outcome === 'wrong';
      return {id: block.id, text, role: block.role, language: block.language, readingOrder: block.readingOrder, visible};
    }),
  };
}
