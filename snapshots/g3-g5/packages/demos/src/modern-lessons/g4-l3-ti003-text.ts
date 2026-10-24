import type {AnimationRendererProps} from '../contract';
import type {LessonTextBinding, TextPresentationSnapshot} from '../lesson-text-contract';
import type {CourseG04L03Ti003NumberLineDragState} from '../timelines/course-g04-l03-ti-003-number-line-drag-interaction';
import {COURSE_G04_L03_TI_003_CARDS as cards} from '../timelines/course-g04-l03-ti-003-number-line-drag-interaction';
import source from './generated/g4-l3-ti003-intro.json';
export const TI003_BINDING = source.binding as LessonTextBinding;
export function getTi003TextSnapshot(state: unknown, context: AnimationRendererProps,
  interaction?: CourseG04L03Ti003NumberLineDragState, helpOpen = false): TextPresentationSnapshot {
  const s = state as Record<string, unknown> | null;
  const blockers: string[] = [];
  if (!s || s.animationId !== TI003_BINDING.animationId || s.sourceSwfSha256 !== source.sourceSha256) blockers.push('source-identity-mismatch');
  if (!s || s.status !== 'ready' || s.blocker) blockers.push('source-state-not-ready');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 139 || (context.frameDomain ?? 'sprite-126') !== 'sprite-126' || (context.rootFrame ?? 6) !== 6 || context.scenario !== 'source-static-frame' || context.lang !== 'en' || context.entryStateSha256) blockers.push('unsupported-native-context');
  if (s && (s.frame !== context.frame || s.frameDomain !== (context.frameDomain ?? 'sprite-126') || s.language !== context.lang || s.seed !== context.seed)) blockers.push('source-context-mismatch');
  if (context.frame === 139 && !interaction) blockers.push('interaction-state-required');
  const intro = source.frames[Math.max(0, Math.min(138, context.frame - 1))]!;
  const question = context.frame === 139;
  const values: Record<string, string> = {
    'question-number': intro.number, 'instruction-first': intro.instruction,
    'instruction-ending': intro.ending, 'help-button': source.texts['4'],
    'help-body': source.texts['92'], 'help-negative': source.texts['116'],
    'help-positive': source.texts['117'], close: source.texts['69'],
    'wrong-feedback': source.wrongFeedback, 'complete-feedback': source.texts['81'],
  };
  return {schemaVersion: 1, animationId: TI003_BINDING.animationId, bindingVersion: TI003_BINDING.version,
    sourceSwfSha256: source.sourceSha256, status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: context.frame, frameDomain: context.frameDomain ?? 'sprite-126', rootFrame: context.rootFrame ?? 6, scenario: context.scenario, language: context.lang, seed: context.seed, replay: context.replay ?? 0}, suppressedInstances: [],
    blocks: blockers.length ? [] : TI003_BINDING.blocks.map(block => {
      let text = values[block.id] ?? '', visible = Boolean(text);
      if (block.id.startsWith('tick-')) {const n=Number(block.id.slice(5));text=n<0?`−${-n}`:String(n);visible=intro.axis;}
      if (block.id.startsWith('help-tick-')) {const n=Number(block.id.slice(10));text=n<0?`−${-n}`:String(n);visible=question && helpOpen;}
      if (block.id.startsWith('card-')) {text=cards.find(c=>c.id===block.id.slice(5))!.valueText.replace('-','−');visible=intro.cards;}
      if (block.id === 'question-number' && question) visible=false;
      if (block.id === 'help-button') visible=question;
      if (['help-body','help-negative','help-positive'].includes(block.id)) visible=question && helpOpen;
      if (block.id === 'close') visible=question && (helpOpen || interaction?.outcome==='wrong');
      if (block.id === 'wrong-feedback') visible=question && interaction?.outcome==='wrong';
      if (block.id === 'complete-feedback') visible=question && interaction?.outcome==='complete';
      return {id:block.id,text,role:block.role,language:block.language,readingOrder:block.readingOrder,visible};
    })};
}
