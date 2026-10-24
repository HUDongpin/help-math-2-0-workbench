import type {AnimationRendererProps} from '../contract';
import type {LessonTextBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import type {CourseG04L03Ti006NumberLineDragState} from '../timelines/course-g04-l03-ti-006-number-line-drag-interaction';
import {COURSE_G04_L03_TI_006_CARDS as cards} from '../timelines/course-g04-l03-ti-006-number-line-drag-interaction';
import source from './generated/g4-l3-ti006-introduction.json';
import help from './generated/g4-l3-ti006-help.json';

export const TI006_BINDING: LessonTextBinding = {
  ...source.binding as LessonTextBinding,
  version: 'g4-l3-ti006-native-v1',
  blocks: [
    ...(source.binding.blocks as LessonTextBinding['blocks']).map(b => ({...b,
      ...(b.id.startsWith('axis-') ? {sourceShapeIds: [...new Set([
        ...(b.sourceShapeIds ?? []),
        ...source.axis.filter(a => b.id === `axis-${a.value}`).flatMap(a => a.sign ? [a.sign.characterId] : []),
      ])]} : {}),
    })),
    ...help.prose.map(p => ({id: `help-${p.characterId}`, sourceTextIds: p.sourceTextIds,
      role: 'body' as const, language: 'en' as const, readingOrder: 25+p.characterId-234, valueSource: 'source-static' as const})),
    ...help.labels.map((l, i) => ({id: `help-tick-${l.value}`, sourceTextIds: l.sourceTextIds, sourceShapeIds: help.sourceShapeIds,
      role: 'label' as const, language: 'en' as const, readingOrder: 27+i, valueSource: 'source-static' as const})),
    ...([['help-button','character-4/run-0'],['close-help','character-213/run-0'],
      ['close-wrong','character-213/run-0'],['completion','character-267/run-0']] as const).map(([id, sourceTextId], i) => ({
        id, sourceTextIds: [sourceTextId], role: 'label' as const, language: 'en' as const,
        readingOrder: 48+i, valueSource: 'source-static' as const,
      })),
    {id: 'wrong-feedback', sourceTextIds: help.wrongFeedback.sourceTextIds, role: 'feedback',
      language: 'en', readingOrder: 52, valueSource: 'source-static'},
  ],
};

/** The external _global.WrongFeed value stays unresolved; the unnamed static
 * DefineText221 is independently source-bound and retained in the wrong popup. */
export function getTi006TextSnapshot(state: unknown, context: AnimationRendererProps,
  interaction?: CourseG04L03Ti006NumberLineDragState, helpOpen = false): TextPresentationSnapshot {
  const s = state as Record<string, unknown> | null;
  const blockers: string[] = [];
  const domain = context.frameDomain ?? 'sprite-269', rootFrame = context.rootFrame ?? 6;
  if (!s || s.animationId !== TI006_BINDING.animationId || s.sourceSwfSha256 !== source.sourceSha256) blockers.push('source-identity-mismatch');
  if (!s || s.status !== 'ready' || s.blocker) blockers.push('source-state-not-ready');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 166 || domain !== 'sprite-269'
    || rootFrame !== 6 || context.scenario !== 'source-static-frame' || context.lang !== 'en' || context.entryStateSha256) blockers.push('unsupported-native-context');
  if (s && (s.frame !== context.frame || s.frameDomain !== domain || s.rootFrame !== rootFrame || s.scenario !== context.scenario
    || s.language !== context.lang || s.seed !== context.seed)) blockers.push('source-context-mismatch');
  const question = context.frame === 166;
  if (question && !interaction) blockers.push('interaction-state-required');
  const intro = source.frames[Math.max(0, Math.min(165, Math.floor(context.frame)-1))] ?? source.frames[0]!;
  const values: Record<string,string> = {number: intro.number, instruction: intro.instruction, instructionEnding: intro.instructionEnding,
    'help-button': 'Need More Help', 'close-help': 'Close', 'close-wrong': 'Close', completion: 'Correct!!!',
    'wrong-feedback': help.wrongFeedback.text};
  for (const a of source.axis) values[`axis-${a.value}`] = a.label;
  for (const p of help.prose) values[`help-${p.characterId}`] = p.text;
  for (const l of help.labels) values[`help-tick-${l.value}`] = l.label;
  for (const [i,c] of cards.entries()) values[`card-${i+1}`] = question ? c.accessibleLabel : intro.cards[i]?.lines.join(' ') ?? '';
  return {schemaVersion: 1, animationId: TI006_BINDING.animationId, bindingVersion: TI006_BINDING.version,
    sourceSwfSha256: source.sourceSha256, status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: context.frame, frameDomain: domain, rootFrame, scenario: context.scenario,
      language: context.lang, seed: context.seed, replay: context.replay ?? 0}, suppressedInstances: [],
    blocks: blockers.length ? [] : TI006_BINDING.blocks.map(b => {
      const text = values[b.id] ?? '';
      let visible = Boolean(text);
      if (b.id.startsWith('axis-')) visible = intro.axisVisible || question;
      if (b.id.startsWith('help-') || b.id === 'close-help') visible = question && helpOpen;
      if (b.id === 'help-button') visible = question;
      if (b.id === 'close-wrong' || b.id === 'wrong-feedback') visible = question && interaction?.outcome === 'wrong';
      if (b.id === 'completion') visible = question && interaction?.outcome === 'complete';
      return {id: b.id, text, visible, role: b.role, language: b.language, readingOrder: b.readingOrder};
    })};
}
