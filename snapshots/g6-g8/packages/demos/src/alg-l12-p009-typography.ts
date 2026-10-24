import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';
import {P009_TEXT_DATA} from './generated/alg-l12-p009-text-data';

const proseIds = new Set([4, 26, 31, 43]);
const parent = {timelineId: 'root', depth: 1, generation: 1, characterId: 62} as const;
export function p009TextInstance(depth: number, generation: number, characterId: number): LessonTextInstance {
  const path = [parent, {timelineId: 'sprite-62', depth, generation, characterId}];
  return {id: lessonTextInstanceId(path), path};
}
const titlePath = [{timelineId: 'root', depth: 85, generation: 1, characterId: 63}] as const;
const titleInstance = {id: lessonTextInstanceId(titlePath), path: titlePath};
export const P009_TITLE = 'Graphing in the Coordinate Plane: Vocabulary';
export const P009_TEXT_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: 'p009-source-native-text-v1',
  placementId: P009_TEXT_DATA.animationId, animationId: P009_TEXT_DATA.animationId,
  sourceSwfSha256: P009_TEXT_DATA.sourceSha256, template: 'complex-figure',
  blocks: [
    {id: 'title', sourceTextIds: [], sourceShapeIds: [63], role: 'title', language: 'en',
      readingOrder: 0, valueSource: 'source-static', instance: titleInstance},
    ...P009_TEXT_DATA.instances.map((instance, index) => ({
      id: instance.instanceId,
      sourceTextIds: P009_TEXT_DATA.definitions.find(definition => definition.characterId === instance.characterId)!.runs.map(run => run.id),
      role: proseIds.has(instance.characterId) ? 'body' as const : 'label' as const,
      language: 'en' as const, readingOrder: index + 1,
      valueSource: 'source-static' as const,
      instance: p009TextInstance(instance.depth, instance.generation, instance.characterId),
    })),
  ],
};

type PoseEvent = {readonly frame: number; readonly matrix?: readonly number[];
  readonly colorTransform?: {readonly multiply: readonly number[]; readonly add: readonly number[]; readonly divisor: number}};
export function p009Pose(events: readonly PoseEvent[], frame: number) {
  let matrix: readonly number[] = [1, 0, 0, 1, 0, 0];
  let alpha = 1;
  for (const event of events) {
    if (event.frame > frame) break;
    if (event.matrix) matrix = event.matrix;
    if (event.colorTransform) alpha = Math.max(0, Math.min(1,
      event.colorTransform.multiply[3] / event.colorTransform.divisor + event.colorTransform.add[3] / 255));
  }
  return {matrix, alpha};
}

export function p009TextSnapshot(context: RuntimeContext): TextPresentationSnapshot {
  const valid = Number.isSafeInteger(context.frame) && context.frame >= 1 && context.frame <= 394 &&
    context.frameDomain === 'sprite-62' && context.rootFrame === 6 &&
    context.scenario === 'source-static-frame' && context.lang === 'en' && context.seed === 0;
  const frame = context.frame;
  const values: Record<string, {text: string; visible: boolean}> = {title: {text: P009_TITLE, visible: true}};
  const activeInstances = new Set([titleInstance.id]);
  for (const instance of P009_TEXT_DATA.instances) {
    const definition = P009_TEXT_DATA.definitions.find(item => item.characterId === instance.characterId)!;
    const active = frame >= instance.firstFrame && frame < instance.lastFrameExclusive;
    const pose = p009Pose(instance.events, frame);
    const text = definition.runs.filter(run => run.revealFrame === null || frame >= run.revealFrame)
      .map(run => run.text).join('');
    values[instance.instanceId] = {text, visible: active && pose.alpha > 0 && Boolean(text.trim())};
    if (active) activeInstances.add(p009TextInstance(instance.depth, instance.generation, instance.characterId).id);
  }
  const snapshot = buildLessonTextSnapshot(P009_TEXT_BINDING, context, values);
  if (!valid) return {...snapshot, status: 'blocked', blocks: [], suppressedInstances: [],
    blockers: [...snapshot.blockers, 'unsupported-p009-source-context']};
  if (snapshot.status !== 'ready') return snapshot;
  // The three exact source underline instances are replaced by native links.
  const underlines = [{depth: 2, characterId: 2, firstFrame: 12},
    {depth: 14, characterId: 25, firstFrame: 72}, {depth: 22, characterId: 30, firstFrame: 142}]
    .filter(item => frame >= item.firstFrame).map(item => p009TextInstance(item.depth, 1, item.characterId));
  return {...snapshot, suppressedInstances: [
    ...snapshot.suppressedInstances.filter(instance => activeInstances.has(instance.id)), ...underlines,
  ]};
}

/** Native graph labels retain their source instance anchors. Prose reflows in
 * normal document order; the figure permits local two-dimensional scrolling. */
export function p009GraphLabels(frame: number) {
  return P009_TEXT_DATA.instances.filter(instance => !proseIds.has(instance.characterId) &&
    frame >= instance.firstFrame && frame < instance.lastFrameExclusive).map(instance => {
    const definition = P009_TEXT_DATA.definitions.find(item => item.characterId === instance.characterId)!;
    const {matrix: placement, alpha} = p009Pose(instance.events, frame);
    const textMatrix = definition.matrix;
    const [baseX, baseY] = definition.baselineTwips;
    const localX = textMatrix[0] * baseX + textMatrix[2] * baseY + textMatrix[4];
    const localY = textMatrix[1] * baseX + textMatrix[3] * baseY + textMatrix[5];
    const x = (placement[0] * localX + placement[2] * localY + placement[4] + 8248) / 20;
    const y = (placement[1] * localX + placement[3] * localY + placement[5] + 5666) / 20;
    return {id: instance.instanceId, characterId: instance.characterId,
      text: definition.runs.map(run => run.text).join(''), x, y, alpha,
      sourceTextIds: definition.runs.map(run => run.id)};
  });
}
