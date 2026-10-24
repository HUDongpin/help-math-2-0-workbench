import type {RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G3_L9_RW_COMPANION_TITLES} from './generated/g3-l9-rw-companion-titles-v1';
import {G3_L9_RW_FAMILY} from './generated/g3-l9-rw-family-v1';

export const RW_ITEM_IDS = ['trapezoid', 'rhombus', 'cylinder', 'rectangular-prism',
  'line-symmetry', 'rotational-symmetry', 'parallel-lines', 'intersecting-lines'] as const;
export type RwItemId = typeof RW_ITEM_IDS[number];
export type RwPageConfiguration = typeof G3_L9_RW_FAMILY[number];
export type RwFrameReader = (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState;
const TEXT_IDS = ['heading', 'intro', 'polygons-heading', 'solids-heading', 'cylinder', 'rectangular-prism',
  'symmetry-heading', 'line-symmetry', 'rotational-symmetry', 'lines-heading', 'parallel-lines',
  'intersecting-lines', 'trapezoid', 'rhombus'] as const;

export function buildG3L9RwBinding(config: RwPageConfiguration): LessonTextBinding {
  return Object.freeze({schemaVersion: 1, version: `${config.id}-modern-text-v1`,
    placementId: config.placementId, animationId: config.animationId,
    sourceSwfSha256: config.sourceSwfSha256, template: 'complex-figure',
    blocks: Object.freeze([
      {id: 'root-title', sourceTextIds: G3_L9_RW_COMPANION_TITLES[config.id].sourceTextIds, role: 'title' as const, language: 'en' as const, readingOrder: 0, valueSource: 'source-static' as const},
      ...config.texts.map((text, index) => ({id: TEXT_IDS[index]!, sourceTextIds: text.sourceTextIds,
        role: index === 0 ? 'title' as const : index === 1 ? 'body' as const :
          [2,3,6,9].includes(index) ? 'heading' as const : 'label' as const,
        language: 'en' as const, readingOrder: index + 1, valueSource: 'source-static' as const})),
      ...RW_ITEM_IDS.map((id, index) => ({id: `check-${id}`, sourceTextIds: [config.sourceRoles.tick.sourceTextId],
        role: 'label' as const, language: 'en' as const, readingOrder: 21 + index,
        valueSource: 'maintained-page-state' as const})),
      {id: 'symmetry-letter', sourceTextIds: [], sourceShapeIds: [config.native.illustrations],
        role: 'label' as const, language: 'en' as const, readingOrder: 41, valueSource: 'source-static' as const},
    ]),
  });
}

export function getG3L9RwTeachingState(config: RwPageConfiguration, frame: number) {
  const present = (item: {readonly firstFrame: number; readonly lastFrameExclusive: number}) =>
    frame >= item.firstFrame && frame < item.lastFrameExclusive;
  return Object.freeze({
    checked: Object.freeze([...new Set<RwItemId>(config.checks.filter(present).map(check => check.id))]),
    emphasized: Object.freeze([...new Set(config.highlights.filter(present).map(highlight => highlight.id))]),
    // Exact active source instances feed both the Canvas exclusions and native
    // presentation. Text is never removed by a shared character/function name.
    suppressedInstances: Object.freeze(config.exclusions.filter(present).map(({id,path}) => ({id,path}))) as readonly LessonTextInstance[],
  });
}

export function getG3L9RwSnapshot(config: RwPageConfiguration, readFrame: RwFrameReader,
  state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const expected = readFrame(context.frame, context);
  const valid = Boolean(state && typeof state === 'object' && state.status === 'ready' && expected.status === 'ready' &&
    state.animationId === config.animationId && state.sourceSwfSha256 === config.sourceSwfSha256 &&
    state.frame === expected.frame && state.frameDomain === config.domain && (context.frameDomain ?? config.domain) === config.domain &&
    state.rootFrame === 6 && (context.rootFrame === undefined || context.rootFrame === 6) &&
    state.scenario === 'source-static-frame' && context.scenario === state.scenario &&
    state.language === 'en' && context.lang === 'en' && state.seed === expected.seed);
  const binding = buildG3L9RwBinding(config), teaching = getG3L9RwTeachingState(config, expected.frame);
  const content: Record<string, {text: string; visible: boolean}> = {'root-title': {text: G3_L9_RW_COMPANION_TITLES[config.id].text, visible: true}};
  for (const [index, text] of config.texts.entries()) content[TEXT_IDS[index]!] = {text: text.text, visible: true};
  for (const id of RW_ITEM_IDS) content[`check-${id}`] = {text: '✓', visible: teaching.checked.includes(id)};
  content['symmetry-letter'] = {text: 'H', visible: true};
  const snapshot = buildLessonTextSnapshot(binding, {...context, frame: expected.frame, frameDomain: config.domain,
    rootFrame: 6, seed: expected.seed}, content);
  if (!valid) return Object.freeze({...snapshot, status: 'blocked', blocks: Object.freeze([]),
    suppressedInstances: Object.freeze([]), blockers: Object.freeze([state?.blocker ?? expected.blocker ?? 'source-frame-identity-mismatch'])});
  return Object.freeze({...snapshot, suppressedInstances: teaching.suppressedInstances});
}
