import {NMS_L02_P002_IR as IR} from './generated/nms-l02-p002-source-ir-v1';
import type {P002FrameState, P002Node} from './nms-l02-p002-timeline-v1';
import type {LessonTextBinding, LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';

const textCharacters = new Set(IR.texts.map(text => text.characterId));
/** These exact source roles are replaced by native teaching text/math or modern
 * framing. All other extracted artwork remains part of the source display list. */
const replacedShapes = new Set([214, 216, 232, 265, 305, 306, 307, 312, 314]);
export function p002ReplacesNode(node: P002Node): boolean {
  return textCharacters.has(node.characterId) || replacedShapes.has(node.characterId);
}
const sourceIds = (ids: readonly number[]) => ids.map(id => `character-${id}`);
export const P002_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1, version: 'nms-l02-p002-native-source-v1',
  animationId: IR.animationId, placementId: IR.animationId,
  sourceSwfSha256: IR.sourceSha256, template: 'complex-figure',
  blocks: Object.freeze([
    {id: 'course-title', sourceTextIds: ['character-311/run-0'], sourceShapeIds: [312], role: 'heading', language: 'en', readingOrder: 0, valueSource: 'source-static'},
    {id: 'activity-title', sourceTextIds: ['character-311/run-1'], sourceShapeIds: [312], role: 'title', language: 'en', readingOrder: 1, valueSource: 'source-static'},
    {id: 'distance', sourceTextIds: sourceIds([222,223,224,225,226,227,228,229,230,231,259,260,261,262,263,264]), sourceShapeIds: [265], role: 'label', language: 'en', readingOrder: 3, valueSource: 'maintained-page-state'},
    {id: 'definition', sourceTextIds: ['character-233'], role: 'body', language: 'en', readingOrder: 4, valueSource: 'maintained-page-state'},
    {id: 'part-whole', sourceTextIds: sourceIds([231,259,260,303,304,308,309]), sourceShapeIds: [305,306,307], role: 'label', language: 'en', readingOrder: 5, valueSource: 'maintained-page-state'},
  ] as const),
});

/** Source visibility includes filled-clip intersection and per-instance alpha.
 * A duplicate character at another depth cannot reveal a later equation. */
export function p002TeachingState(state: P002FrameState) {
  const at = (depth: number) => state.visibleTexts.find(text => text.depth === depth && text.instancePath.startsWith('root:6/d1g1c310/sprite-310/'));
  const textAt = (depth: number) => at(depth)?.runs.map(run => run.visiblePrefix).join('') ?? '';
  const joined = (depths: readonly number[]) => depths.map(textAt).join('');
  const shapeVisible = (id: number, depth: number) => state.nodes.some(node => node.domain === '310' && node.characterId === id && node.depth === depth && node.color[3] + node.color[7] > 0);
  const headingVisible = state.nodes.some(node => node.characterId === 312 && node.domain === '313' && node.color[3] + node.color[7] > 0);
  const distanceNumber = textAt(77), distanceUnit = joined([76,75,74,73,72,71,70,69,68,67]);
  const outOf = joined([114,113,112]) + (textAt(111) || textAt(110) ? ' ' + joined([111,110]) : '');
  const wholeNumber = textAt(109), wholeUnit = joined([108,107,106,105,104,103,102,101,100,99]);
  const distance = distanceNumber + (distanceUnit ? ' ' + distanceUnit : '');
  const distanceRemainder = outOf + (wholeNumber ? ' ' + wholeNumber : '') + (wholeUnit ? ' ' + wholeUnit : '');
  const lowerFraction = shapeVisible(265,117) && textAt(115) === '1' && textAt(116) === '2' && textAt(98) === '=';
  const definitionRuns = at(79)?.runs ?? [];
  const definition = definitionRuns.map(run => run.visiblePrefix).join('');
  const whole = textAt(87), part = textAt(88);
  const partOverWhole = shapeVisible(305,89) && Boolean(whole.trim() && part.trim());
  const fourEighths = shapeVisible(306,91) && textAt(92) === '4' && textAt(93) === '8' && textAt(90) === '=';
  const finalHalf = shapeVisible(307,95) && textAt(96) === '1' && textAt(97) === '2' && textAt(94) === '=';
  return Object.freeze({headingVisible, distance, distanceRemainder, lowerFraction,
    definition, definitionRuns, whole, part, partOverWhole, fourEighths, finalHalf});
}

function instance(node: P002Node) {
  const path: LessonTextInstanceSegment[] = [];
  const matches = node.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu);
  for (const match of matches) path.push(Object.freeze({timelineId: match[1]!.startsWith('root:') ? 'root' : match[1]!, depth: Number(match[2]), generation: Number(match[3]), characterId: Number(match[4])}));
  return Object.freeze({id: lessonTextInstanceId(path), path: Object.freeze(path)});
}

export function p002TextSnapshot(state: P002FrameState) {
  const t = p002TeachingState(state);
  const distance = t.distance + (t.distanceRemainder ? ' ' + t.distanceRemainder : '') + (t.lowerFraction ? ' = 1/2' : '');
  const partWhole = t.partOverWhole ? `${t.part.trim()} / ${t.whole.trim()}` : [t.whole, t.part].filter(Boolean).join('; ');
  const equation = partWhole + (t.fourEighths ? ' = 4/8' : '') + (t.finalHalf ? ' = 1/2' : '');
  const snapshot = buildLessonTextSnapshot(P002_TEXT_BINDING, {
    frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
    scenario: 'source-real-world', lang: state.language, seed: state.seed, replay: state.replay,
  }, {
    'course-title': {text: 'Fractions, Decimals and Percents Concepts:', visible: t.headingVisible},
    'activity-title': {text: 'Real World Activity', visible: t.headingVisible},
    distance: {text: distance, visible: Boolean(distance.trim())},
    definition: {text: t.definition, visible: Boolean(t.definition.trim())},
    'part-whole': {text: equation, visible: Boolean(equation.trim())},
  });
  return Object.freeze({...snapshot, suppressedInstances: Object.freeze(snapshot.status === 'ready' ? state.nodes.filter(p002ReplacesNode).map(instance) : [])});
}
