import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';

const titlePath = [
  {timelineId: 'root', depth: 135, generation: 1, characterId: 395},
  {timelineId: 'sprite-395', depth: 2, generation: 1, characterId: 394},
] as const;
export const P005_TITLE_INSTANCE: LessonTextInstance = Object.freeze({
  id: lessonTextInstanceId(titlePath), path: titlePath,
});

/** The visible outlined title is shape394. Offstage text393 is preserved in the
 * source adapter; it is not silently moved into the visible source text layer. */
export const P005_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1, version: 'p005-source-native-text-v1',
  placementId: 'shared-alg001-l12-p005', animationId: 'shared-alg001-l12-p005',
  sourceSwfSha256: 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe',
  template: 'explanation',
  blocks: Object.freeze([
    {id: 'title', sourceTextIds: [], sourceShapeIds: [394], role: 'title' as const,
      language: 'en' as const, readingOrder: 0, valueSource: 'source-static' as const,
      instance: P005_TITLE_INSTANCE},
  ]),
});
export const P005_TITLE = 'Graphing in the Coordinate Plane: Real World Activity';

/** The unchanged visual host supplies the only teaching clock. The title stays
 * visible throughout the 968-frame main sequence and never starts audio. */
export function p005TextSnapshot(context: RuntimeContext): TextPresentationSnapshot {
  const valid = Number.isSafeInteger(context.frame) && context.frame >= 1 && context.frame <= 968 &&
    context.frameDomain === 'sprite-391' && context.rootFrame === 6 &&
    context.scenario === 'source-static-frame' && context.lang === 'en' && context.seed === 0;
  const snapshot = buildLessonTextSnapshot(P005_TEXT_BINDING, context, {
    title: {text: P005_TITLE, visible: true},
  });
  if (!valid) return Object.freeze({...snapshot, status: 'blocked', blocks: [], suppressedInstances: [],
    blockers: Object.freeze([...snapshot.blockers, 'unsupported-p005-source-context'])});
  return snapshot;
}
