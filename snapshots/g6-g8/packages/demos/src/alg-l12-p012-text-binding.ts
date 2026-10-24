import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextBlockBinding, LessonTextInstance,
  LessonTextInstanceSegment, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';
import {P012_TEXT_DATA} from './generated/alg-l12-p012-text-data';
import {p012TextSnapshot} from './alg-l12-p012-text';
import type {p012FrameState} from './timelines/shared-alg001-l12-p012';

type P012FrameState = ReturnType<typeof p012FrameState>;
type SourceInstance = (typeof P012_TEXT_DATA.instances)[number];
type SourceDefinition = Readonly<{characterId: number; sourceTextId: string;
  runs?: readonly Readonly<{sourceTextId: string; text: string}>[]}>;

const mainParent = {timelineId: 'root', depth: 2, generation: 1, characterId: 86} as const;
const titlePath = [{timelineId: 'root', depth: 1, generation: 1, characterId: 1}] as const;
const underlinePath = [mainParent, {timelineId: 'sprite-86', depth: 2,
  generation: 1, characterId: 50}] as const;
const parentByTimeline = {
  'sprite-61': {timelineId: 'sprite-86', depth: 67, generation: 2, characterId: 61},
  'sprite-74': {timelineId: 'sprite-86', depth: 94, generation: 2, characterId: 74},
  'sprite-76': {timelineId: 'sprite-86', depth: 105, generation: 1, characterId: 76},
} as const;

function instanceFor(path: readonly LessonTextInstanceSegment[]): LessonTextInstance {
  return {id: lessonTextInstanceId(path), path};
}

function sourceInstance(item: SourceInstance): LessonTextInstance {
  const leaf = {timelineId: item.timelineId, depth: item.depth,
    generation: item.generation, characterId: item.characterId};
  const parent = parentByTimeline[item.timelineId as keyof typeof parentByTimeline];
  return instanceFor(parent ? [mainParent, parent, leaf] : [mainParent, leaf]);
}

const titleInstance = instanceFor(titlePath);
const underlineInstance = instanceFor(underlinePath);
const coachSource = P012_TEXT_DATA.instances.find(item => item.characterId === 75)!;
const coachInstance = sourceInstance(coachSource);
const sourceDefinition = (characterId: number): SourceDefinition => {
  const definition = (P012_TEXT_DATA.definitions as readonly SourceDefinition[])
    .find(item => item.characterId === characterId);
  if (!definition) throw new Error(`P012 text definition ${characterId} missing`);
  return definition;
};

// The native renderer's source display-list adapter uses these same leaf
// depth/generation/character identities. The button-state record has no legal
// sprite path in the shared contract, so its text block has no instance here.
const teachingInstances = P012_TEXT_DATA.instances.filter(item => item.characterId !== 75);
const role = (item: SourceInstance): LessonTextBlockBinding['role'] =>
  item.characterId === 51 || item.characterId === 55 ? 'body' :
    item.characterId === 73 ? 'feedback' : 'label';
const readingOrder = (item: SourceInstance, index: number): number =>
  item.characterId === 51 ? 1 : item.characterId === 55 ? 2 :
    item.characterId === 34 ? 150 + index : item.characterId === 73 ? 170 :
      item.characterId >= 37 && item.characterId <= 44 ? 80 + index : 10 + index;

const sourceBlocks: LessonTextBlockBinding[] = teachingInstances.map((item, index) => {
  const definition = sourceDefinition(item.characterId);
  return {id: item.instanceId,
    sourceTextIds: definition.runs?.map(run => run.sourceTextId) ?? [definition.sourceTextId],
    role: role(item), language: 'en', readingOrder: readingOrder(item, index),
    valueSource: item.characterId === 34 ? 'maintained-page-state' : 'source-static',
    instance: sourceInstance(item)};
});

export const P012_TEXT_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: 'p012-source-native-text-v1',
  placementId: P012_TEXT_DATA.animationId, animationId: P012_TEXT_DATA.animationId,
  sourceSwfSha256: P012_TEXT_DATA.source.swfSha256, template: 'complex-figure',
  blocks: [
    {id: 'title', sourceTextIds: [], sourceShapeIds: [1], role: 'title',
      language: 'en', readingOrder: 0, valueSource: 'source-static',
      instance: titleInstance},
    ...sourceBlocks,
    {id: 'button-71/record-4', sourceTextIds: ['character-66/run-0'],
      role: 'label', language: 'en', readingOrder: 180,
      valueSource: 'source-static'},
  ],
};

/** The canonical timeline state supplies the same reducer-owned coordinate and
 * popup branches that the native typography renderer presents. */
export function p012LessonTextSnapshot(state: P012FrameState,
  context: RuntimeContext): TextPresentationSnapshot {
  const frame = context.frame;
  const lesson = state.lesson;
  const valid = state.status === 'ready' && lesson !== null &&
    frame === state.frame && frame === lesson?.frame &&
    context.frameDomain === 'sprite-86' && context.rootFrame === 6 &&
    context.scenario === 'ordered-pairs-interaction' && context.lang === 'en' &&
    context.seed === state.seed && state.sourceSha256 === P012_TEXT_BINDING.sourceSwfSha256 &&
    Number.isSafeInteger(frame) && frame >= 1 && frame <= 119;
  const source = valid ? p012TextSnapshot(frame, lesson!.interaction.coordinateText) : null;
  const visibleText = new Map<string, string>();
  if (source) {
    for (const item of [...source.labels, ...source.controlLabels, ...source.introRuns]) {
      visibleText.set(item.instanceId, (visibleText.get(item.instanceId) ?? '') + item.text);
    }
  }
  const values: Record<string, {text: string; visible: boolean}> = {
    title: {text: 'Graphing in the Coordinate Plane: Vocabulary', visible: valid},
  };
  const activeIds = new Set([titleInstance.id]);
  for (const item of teachingInstances) {
    // Nested source lifetimes use their own child frames. Comparing those
    // intervals with sprite-86 frame 119 would hide the held coordinate field
    // and feedback even while their parent clips are on stage.
    const childFrame = item.timelineId === 'sprite-61' ? 1 :
      item.timelineId === 'sprite-74' ? lesson?.interaction.popup.frame ?? 1 : frame;
    const active = valid && item.firstFrame <= childFrame && childFrame < item.lastFrameExclusive &&
      (item.timelineId === 'sprite-86' || lesson!.phase === 'interaction') &&
      (item.timelineId !== 'sprite-74' || lesson!.interaction.popup.visible);
    let text = visibleText.get(item.instanceId) ?? '';
    let visible = active && Boolean(text.trim());
    if (item.characterId === 34) {
      text = source?.coordinate.text ?? '';
      visible = active && source?.coordinate.instanceId === item.instanceId;
    } else if (item.characterId === 73) {
      text = source?.feedbackText.text ?? '';
      visible = active && Boolean(lesson?.interaction.popup.visible);
    }
    values[item.instanceId] = {text, visible};
    if (active) activeIds.add(sourceInstance(item).id);
  }
  const popupVisible = valid && lesson!.phase === 'interaction' && lesson!.interaction.popup.visible;
  values['button-71/record-4'] = {
    text: sourceDefinition(66).runs?.[0]?.text ?? '', visible: popupVisible,
  };
  const snapshot = buildLessonTextSnapshot(P012_TEXT_BINDING, context, values);
  if (!valid) return {...snapshot, status: 'blocked', blocks: [], suppressedInstances: [],
    blockers: [...snapshot.blockers, 'unsupported-p012-source-context']};
  if (snapshot.status !== 'ready') return snapshot;
  const extras = [
    ...(frame >= 32 ? [underlineInstance] : []),
    ...(lesson!.phase === 'interaction' && lesson!.interaction.coach.playing &&
      lesson!.interaction.coach.frame <= 2 ? [coachInstance] : []),
  ];
  return {...snapshot, suppressedInstances: [
    ...snapshot.suppressedInstances.filter(instance => activeIds.has(instance.id)), ...extras,
  ]};
}
