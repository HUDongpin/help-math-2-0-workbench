import type {LessonTextActivityCancellation, LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';

export interface SourceClockActivity extends LessonTextActivitySnapshot {
  readonly definition: LessonTextActivityDefinition;
  readonly milliseconds: number;
  readonly pressToken?: string;
}
export function sourceActivityKey(activity: {readonly sourceInstanceId?: string}) {
  return activity.sourceInstanceId ?? '$primary';
}
export function sourceActivityBlocksParent(activities: readonly LessonTextActivitySnapshot[]) {
  return activities.some(activity => !activity.sourceInstanceId && activity.status === 'playing');
}
export function sourceActivitiesAtParentFrame(activities: readonly SourceClockActivity[], frame: number) {
  return activities.filter(activity=>!activity.definition.parentLifetime || (
    frame>=activity.definition.parentLifetime.firstFrame && frame<activity.definition.parentLifetime.lastFrameExclusive));
}
export function advanceSourceActivities(activities: readonly SourceClockActivity[], milliseconds: number) {
  return activities.map(activity => {
    if (activity.status !== 'playing') return activity;
    const elapsed = activity.milliseconds + Math.max(0, milliseconds);
    const position = 1 + Math.floor(elapsed * activity.definition.fps / 1000 + 1e-8);
    const frame = Math.min(activity.definition.endFrame, position);
    const completed = activity.definition.holdEndFrame ? position > activity.definition.endFrame : position >= activity.definition.endFrame;
    return {...activity, milliseconds: elapsed, frame,
      status: completed ? 'completed' as const : 'playing' as const};
  });
}
export function beginSourceClockActivity(activities: readonly SourceClockActivity[], definition: LessonTextActivityDefinition,
  revision: number): readonly SourceClockActivity[] | undefined {
  const same = activities.find(activity => sourceActivityKey(activity) === sourceActivityKey(definition));
  const edge = definition.entryFromActivity;
  if (edge) {
    if (!same || same.id !== edge.id || same.frame < edge.firstFrame || same.frame > edge.lastFrame) return undefined;
  } else if (!definition.sourceInstanceId && activities.some(activity=>activity.status==='playing')) return undefined;
  if (definition.sourceInstanceId && sourceActivityBlocksParent(activities)) return undefined;
  const next: SourceClockActivity = {id:definition.id, sourceInstanceId:definition.sourceInstanceId,
    frameDomain:definition.frameDomain, frame:definition.startFrame, revision, status:'playing', definition,
    milliseconds:(definition.startFrame-1)*1000/definition.fps};
  return [...activities.filter(activity=>sourceActivityKey(activity)!==sourceActivityKey(definition)), next];
}

/** Prepare a complete source event without mutating the caller's state. A
 * repeated instance or inadmissible sibling rejects the whole event. */
export function beginSourceClockActivities(activities: readonly SourceClockActivity[], definitions: readonly LessonTextActivityDefinition[], revision: number) {
  if (!definitions.length || new Set(definitions.map(sourceActivityKey)).size !== definitions.length) return undefined;
  if (definitions.length > 1 && definitions.some(definition=>!definition.sourceInstanceId)) return undefined;
  let next=activities;
  for (let index=0;index<definitions.length;index++) {
    const updated=beginSourceClockActivity(next,definitions[index]!,revision+index);
    if(!updated)return undefined;
    next=updated;
  }
  return next;
}

export function releaseSourceButtonActivity(activities: readonly SourceClockActivity[], id: string, token: string) {
  const current=activities.find(activity=>activity.id===id && activity.definition.buttonPress && activity.pressToken===token);
  return current ? activities.filter(activity=>activity!==current) : undefined;
}

export function cancelSourceClockActivity(activities: readonly SourceClockActivity[], request: LessonTextActivityCancellation) {
  if (!request.cancellationToken || !Number.isSafeInteger(request.revision)) return undefined;
  const current=activities.find(activity=>activity.id===request.id
    && activity.sourceInstanceId===request.sourceInstanceId && activity.revision===request.revision
    && activity.cancellationToken===request.cancellationToken);
  return current ? activities.filter(activity=>activity!==current) : undefined;
}
