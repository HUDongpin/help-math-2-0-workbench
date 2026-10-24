import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';
import {P010_TEXT_DATA} from './generated/alg-l12-p010-text-data';

const proseIds = new Set([20, 26, 32, 36]);
const parent = {timelineId: 'root', depth: 1, generation: 1, characterId: 96} as const;
export function p010TextInstance(depth: number, generation: number, characterId: number): LessonTextInstance {
  const path = [parent, {timelineId: 'sprite-96', depth, generation, characterId}];
  return {id: lessonTextInstanceId(path), path};
}
const titlePath = [{timelineId: 'root', depth: 108, generation: 1, characterId: 97}] as const;
const titleInstance = {id: lessonTextInstanceId(titlePath), path: titlePath};
export const P010_TITLE = 'Graphing in the Coordinate Plane: Vocabulary';
export const P010_TEXT_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: 'p010-source-native-text-v1',
  placementId: P010_TEXT_DATA.animationId, animationId: P010_TEXT_DATA.animationId,
  sourceSwfSha256: P010_TEXT_DATA.sourceSha256, template: 'complex-figure',
  blocks: [
    {id: 'title', sourceTextIds: [], sourceShapeIds: [97], role: 'title', language: 'en',
      readingOrder: 0, valueSource: 'source-static', instance: titleInstance},
    ...P010_TEXT_DATA.instances.map((instance, index) => ({
      id: instance.instanceId,
      sourceTextIds: P010_TEXT_DATA.definitions.find(definition => definition.characterId === instance.characterId)!.runs.map(run => run.id),
      role: proseIds.has(instance.characterId) ? 'body' as const : 'label' as const,
      language: 'en' as const, readingOrder: index + 1,
      valueSource: 'source-static' as const,
      instance: p010TextInstance(instance.depth, instance.generation, instance.characterId),
    })),
  ],
};

type PoseEvent = {readonly frame: number; readonly matrix?: readonly number[];
  readonly colorTransform?: {readonly multiply: readonly number[]; readonly add: readonly number[]; readonly divisor: number}};
export function p010Pose(events: readonly PoseEvent[], frame: number) {
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

export function p010TextSnapshot(context: RuntimeContext): TextPresentationSnapshot {
  const valid = Number.isSafeInteger(context.frame) && context.frame >= 1 && context.frame <= 465 &&
    context.frameDomain === 'sprite-96' && context.rootFrame === 6 &&
    context.scenario === 'source-static-frame' && context.lang === 'en' && context.seed === 0;
  const frame = context.frame;
  const values: Record<string, {text: string; visible: boolean}> = {title: {text: P010_TITLE, visible: true}};
  const activeInstances = new Set([titleInstance.id]);
  for (const instance of P010_TEXT_DATA.instances) {
    const definition = P010_TEXT_DATA.definitions.find(item => item.characterId === instance.characterId)!;
    const active = frame >= instance.firstFrame && frame < instance.lastFrameExclusive;
    const pose = p010Pose(instance.events, frame);
    const text = definition.runs.filter(run => run.revealFrame === null || frame >= run.revealFrame)
      .map(run => run.text).join('');
    values[instance.instanceId] = {text, visible: active && pose.alpha > 0 && Boolean(text.trim())};
    if (active) activeInstances.add(p010TextInstance(instance.depth, instance.generation, instance.characterId).id);
  }
  const snapshot = buildLessonTextSnapshot(P010_TEXT_BINDING, context, values);
  if (!valid) return {...snapshot, status: 'blocked', blocks: [], suppressedInstances: [],
    blockers: [...snapshot.blockers, 'unsupported-p010-source-context']};
  if (snapshot.status !== 'ready') return snapshot;
  // The four exact source underline instances are replaced by native links.
  const underlines = [{depth: 2, characterId: 19, firstFrame: 10},
    {depth: 12, characterId: 25, firstFrame: 69}, {depth: 22, characterId: 31, firstFrame: 113},
    {depth: 30, characterId: 35, firstFrame: 173}]
    .filter(item => frame >= item.firstFrame).map(item => p010TextInstance(item.depth, 1, item.characterId));
  return {...snapshot, suppressedInstances: [
    ...snapshot.suppressedInstances.filter(instance => activeInstances.has(instance.id)), ...underlines,
  ]};
}

/** Native graph labels retain their source instance anchors. Prose reflows in
 * normal document order; the figure permits local two-dimensional scrolling. */
export function p010GraphLabels(frame: number) {
  return P010_TEXT_DATA.instances.filter(instance => !proseIds.has(instance.characterId) &&
    frame >= instance.firstFrame && frame < instance.lastFrameExclusive).flatMap(instance => {
    const definition = P010_TEXT_DATA.definitions.find(item => item.characterId === instance.characterId)!;
    const {matrix: placement, alpha} = p010Pose(instance.events, frame);
    const textMatrix = definition.matrix;
    return definition.runs.map(run => {
      const [baseX, baseY] = run.baselineTwips;
      const localX = textMatrix[0]*baseX + textMatrix[2]*baseY + textMatrix[4];
      const localY = textMatrix[1]*baseX + textMatrix[3]*baseY + textMatrix[5];
      const x = (placement[0]*localX + placement[2]*localY + placement[4] + 8248)/20;
      const y = (placement[1]*localX + placement[3]*localY + placement[5] + 5666)/20;
      return {id: instance.instanceId + '/' + run.id, instanceId: instance.instanceId,
        characterId: instance.characterId, text: run.text, x, y, alpha,
        sourceTextId: run.id, callout: [56,70,85,95].includes(instance.characterId)};
    });
  });
}

/** Describe only currently visible source labels, including the opening frame
 * before the axes enter. Counting dots are explained as the diagram's use. */
export function p010FigureDescription(frame: number): string {
  const labels = p010GraphLabels(frame).filter(label => label.alpha > 0);
  const axesVisible = labels.some(label => label.text === 'X-axis') &&
    labels.some(label => label.text === 'Y-axis');
  const introduction = axesVisible
    ? 'Coordinate plane with x- and y-axes. Red dots mark counting steps as the animation advances.'
    : 'Coordinate-plane lesson figure.';
  const callouts = [...new Set(labels.filter(label => label.callout).map(label => label.instanceId))]
    .map(id => labels.filter(label => label.instanceId === id).map(label => label.text).join(''));
  return [introduction, ...callouts].join(' ');
}
