import type {RuntimeContext} from '../../contract';
import type {LessonTextBinding, TextPresentationSnapshot} from '../../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {COURSE_G04_L03_IN_010_CARDS as CARDS, createCourseG04L03In010TemperatureDragState, type CourseG04L03In010TemperatureDragState} from '../../timelines/course-g04-l03-in-010-temperature-drag-interaction';
import {createIn010FigureReader, type PackedInputs} from './figure-model';
import INPUT from './source-inputs.generated.json';
import AXES from './axis-bindings.generated.json';

export const ID = 'course-g04-l03-in-010';
export const DOMAIN = 'sprite-90';
export const VERSION = 'g04-l03-placement-021-modern-text-v1';
export const SOURCE_SHA = 'fab625d5c4028a72a3d5672c65884cc2b83ab4df6a318e26057f70469e9a8011';
export const SOURCE_INPUT = INPUT as unknown as PackedInputs;
const read = createIn010FigureReader(SOURCE_INPUT);
const definition = (id: number) => {
  const found = SOURCE_INPUT.texts.find(text => text.characterId === id);
  if (!found) throw Error(`Missing source text ${id}`);
  return found;
};
const textIds = (...ids: number[]) => ids.flatMap(id => definition(id).runs.map(run => run.sourceTextId));
export const SOURCE_TITLE = definition(4).text;
/** Authored static86 fallback, not a resolution of _global.WrongFeed. */
export const FEEDBACK_COPY = {wrong: definition(86).text, close: definition(77).text, final: definition(51).text};
export const CITIES = [
  {code: 'A', name: 'Seattle', ids: [31]}, {code: 'B', name: 'Chicago', ids: [29]},
  {code: 'C', name: 'Fraser', ids: [24]}, {code: 'D', name: 'Reno', ids: [26]},
  {code: 'E', name: 'Pittsburgh', ids: [22]}, {code: 'F', name: 'Houston', ids: [28]},
  {code: 'G', name: 'New York', ids: [32, 46]},
] as const;
// Source definition/depth order is not the native instructional reading order.
const axisPositions = new Map(read(1).labels.map(label => [label.id, label.y]));
const readingAxes = [...AXES].sort((a, b) => axisPositions.get(a.instanceId)! - axisPositions.get(b.instanceId)!);
const readingCards = CARDS.map(card => SOURCE_INPUT.cards.find(source => source.sourceName === card.id)!);
const readingTargets = [...readingCards].sort((a, b) =>
  CARDS.find(card => card.id === a.sourceName)!.targetCenter.y - CARDS.find(card => card.id === b.sourceName)!.targetCenter.y);
export const BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-021',
  animationId: ID, sourceSwfSha256: SOURCE_SHA, template: 'complex-figure',
  blocks: [
    {id: 'title', sourceTextIds: textIds(4), role: 'heading', language: 'en', readingOrder: 0, valueSource: 'source-static'},
    {id: 'instruction', sourceTextIds: textIds(38, 41, 42), role: 'body', language: 'en', readingOrder: 1, valueSource: 'maintained-page-state'},
    ...readingAxes.map((axis, index) => ({id: axis.id, sourceTextIds: textIds(axis.characterId), ...(axis.text.startsWith('−') ? {sourceShapeIds: [18]} : {}), role: 'label' as const, language: 'en' as const, readingOrder: 10 + index, valueSource: 'maintained-page-state' as const})),
    ...CITIES.map((city, index) => ({id: `city-${city.code}`, sourceTextIds: textIds(...city.ids), ...(['B','C'].includes(city.code) ? {sourceShapeIds: city.code === 'C' ? [25,30] : [30]} : {}), role: 'label' as const, language: 'en' as const, readingOrder: 30 + index, valueSource: 'maintained-page-state' as const})),
    ...readingTargets.map((card, index) => ({id: `target-${card.targetName}`, sourceTextIds: textIds(card.targetTextId), role: 'answer' as const, language: 'en' as const, readingOrder: 60 + index, valueSource: 'maintained-page-state' as const})),
    ...readingCards.map((card, index) => ({id: `card-${card.sourceName}`, sourceTextIds: textIds(card.sourceTextId), ...([24,29].includes(card.sourceTextId) ? {sourceShapeIds: [30]} : {}), role: 'answer' as const, language: 'en' as const, readingOrder: 40 + index, valueSource: 'maintained-page-state' as const})),
    {id: 'wrong-feedback', sourceTextIds: textIds(86), role: 'feedback', language: 'en', readingOrder: 90, valueSource: 'maintained-page-state'},
    {id: 'close-feedback', sourceTextIds: textIds(77), role: 'answer', language: 'en', readingOrder: 91, valueSource: 'maintained-page-state'},
    {id: 'final-feedback', sourceTextIds: textIds(51), role: 'feedback', language: 'en', readingOrder: 38, valueSource: 'maintained-page-state'},
  ],
};
export function getIn010Snapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext, interaction = createCourseG04L03In010TemperatureDragState()): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (!state || state.animationId !== ID || state.sourceSwfSha256 !== SOURCE_SHA) blockers.push('source-identity-mismatch');
  if (state?.status !== 'ready' || state.blocker || !state.sourceStaticVisualReady) blockers.push('source-state-not-ready');
  if (state?.exportFrame !== context.frame - 1 || state?.rootState !== 'stopped-at-begin-while-child-static-frame-is-inspected') blockers.push('source-static-projection-mismatch');
  if (state?.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state?.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state?.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 264 || state?.frame !== context.frame || state?.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6) || !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff || state?.seed !== context.seed || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) blockers.push('source-context-mismatch');
  const identity = {frame: context.frame, frameDomain: context.frameDomain ?? DOMAIN, rootFrame: context.rootFrame ?? 6, scenario: context.scenario, language: context.lang, seed: context.seed, replay: context.replay ?? 0};
  const base = {schemaVersion: 1 as const, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: SOURCE_SHA, identity, suppressedInstances: []};
  if (blockers.length) return {...base, status: 'blocked', blockers, blocks: []};
  const model = read(context.frame, context.frame === 264 ? {placements: interaction.placements} : {});
  const values = new Map<string, {text: string; visible: boolean}>();
  values.set('title', {text: SOURCE_TITLE, visible: true});
  values.set('instruction', {text: definition(38).text, visible: model.labels.some(label => label.characterId === 38)});
  for (const axis of AXES) values.set(axis.id, {text: axis.text, visible: model.labels.some(label => label.id === axis.instanceId)});
  const targetInstances = SOURCE_INPUT.cards.map(card => card.targetInstance.instanceId);
  for (const city of CITIES) {
    const labels = model.labels.filter(label => label.text.startsWith(city.name) && !targetInstances.some(id => label.id.includes('/' + id + '/')));
    values.set(`city-${city.code}`, {text: labels[0]?.text ?? '', visible: labels.length > 0});
  }
  for (const card of SOURCE_INPUT.cards) {
    const target = model.labels.find(label => label.id.includes('/' + card.targetInstance.instanceId + '/'));
    values.set(`target-${card.targetName}`, {text: target?.text ?? '', visible: !!target});
    const text = definition(card.sourceTextId).text.replace('  18', ' −18').replace('  4', ' −4').trimEnd();
    values.set(`card-${card.sourceName}`, {text, visible: context.frame === 264});
  }
  values.set('wrong-feedback', {text: FEEDBACK_COPY.wrong, visible: context.frame === 264 && interaction.outcome === 'wrong'});
  values.set('close-feedback', {text: FEEDBACK_COPY.close, visible: context.frame === 264 && interaction.outcome === 'wrong'});
  values.set('final-feedback', {text: FEEDBACK_COPY.final, visible: context.frame === 264 && interaction.outcome === 'final-correct-feedback'});
  // During the quiz, city labels move into unplaced card buttons; only the
  // demonstration city stays in the figure list. Preserve that state-specific
  // DOM order, including visually present inert background text in a dialog.
  const order = ['title', 'instruction', ...readingAxes.map(axis => axis.id)];
  if (context.frame === 264) {
    order.push('city-G', 'final-feedback');
    for (const card of readingCards) {
      const city = CITIES.find(city => city.ids.some(id => id === card.sourceTextId))!;
      order.push(`city-${city.code}`, `card-${card.sourceName}`);
    }
    order.push(...readingTargets.map(card => `target-${card.targetName}`), 'wrong-feedback', 'close-feedback');
  } else {
    order.push(...CITIES.map(city => `city-${city.code}`));
  }
  const rank = new Map(order.map((id, index) => [id, index]));
  const blocks = BINDING.blocks.map(block => ({id: block.id, ...values.get(block.id)!, role: block.role, language: block.language, readingOrder: rank.get(block.id) ?? order.length + block.readingOrder}));
  return {...base, status: 'ready', blockers: [], blocks: blocks.sort((a, b) => a.readingOrder - b.readingOrder)};
}
