import type {LessonTextActivityDefinition, LessonTextActivityRequest, LessonTextActivitySnapshot, LessonTextFrameTransition, LessonTextPresentationCapability} from './lesson-text-contract';
import {isSameOriginAssetSource} from './runtime';

type FrameControl = NonNullable<LessonTextPresentationCapability<unknown>['frameControl']>;

export function validateLessonTextFrameControl(control: FrameControl, frameCount: number) {
  const inRange = (frame: number) => Number.isSafeInteger(frame) && frame >= 1 && frame <= frameCount;
  if (!/^(?:root|sprite-\d+)$/.test(control.frameDomain) || !inRange(control.completionFrame)
    ) throw new Error('Invalid modern lesson frame control');
  const keys = new Set<string>();
  for (const edge of control.transitions) {
    if (![edge.fromFrame, edge.toFrame, edge.stopFrame].every(inRange)
      || edge.toFrame > edge.stopFrame || edge.stopFrame > control.completionFrame) throw new Error('Invalid modern lesson frame edge');
    const key = `${edge.fromFrame}:${edge.toFrame}:${edge.stopFrame}`;
    if (keys.has(key)) throw new Error('Duplicate modern lesson frame edge');
    keys.add(key);
  }
}

export function lessonTextFrameRequestAllowed(control: FrameControl | undefined,
  request: LessonTextFrameTransition, current: Readonly<{frame: number; frameDomain: string; capture: boolean}>) {
  return Boolean(control && !current.capture && current.frameDomain === control.frameDomain
    && request.fromFrame === current.frame
    && control.transitions.some(edge => edge.fromFrame === request.fromFrame
      && edge.toFrame === request.toFrame && edge.stopFrame === request.stopFrame));
}

export function validateLessonTextActivities(activities: readonly LessonTextActivityDefinition[], parentFrameCount: number, sourceFps: number) {
  const ids = new Set<string>();
  const instances = new Map<string,LessonTextActivityDefinition>();
  for (const activity of activities) {
    if (!/^[a-z0-9][a-z0-9-]+$/.test(activity.id) || ids.has(activity.id)
      || !/^sprite-\d+$/.test(activity.frameDomain) || activity.fps !== sourceFps
      || !Number.isSafeInteger(activity.startFrame) || !Number.isSafeInteger(activity.endFrame)
      || activity.startFrame < 1 || activity.endFrame < activity.startFrame
      || !activity.parentFrames.length || activity.parentFrames.some(frame => !Number.isSafeInteger(frame) || frame < 1 || frame > parentFrameCount)) {
      throw new Error('Invalid modern lesson source activity');
    }
    if (activity.holdEndFrame !== undefined && (activity.holdEndFrame !== true || activity.startFrame !== activity.endFrame)) {
      throw new Error('Source frame hold requires one explicitly selected frame');
    }
    ids.add(activity.id);
    if (activity.buttonPress && (!activity.sourceInstanceId || !Number.isSafeInteger(activity.buttonPress.sourceButtonId)
      || activity.buttonPress.sourceButtonId<1 || activity.entryFromActivity)) throw new Error('Invalid source button activity');
    // Support both maintained semantic identities and exact extractor placement paths.
    // The numeric form keeps each depth/generation pair attached to its sprite.
    const semanticInstance = /^(?:root|sprite-\d+)(?:\/[A-Za-z_][A-Za-z0-9_]*|\/depth-\d+-generation-\d+|\/(?:button|record)-\d+)+$/;
    const extractedInstance = /^(?:root|sprite-\d+)\/depth-\d+\/generation-\d+(?:\/sprite-\d+\/depth-\d+\/generation-\d+)*(?:\/button-\d+\/record-\d+)?$/;
    if (activity.sourceInstanceId !== undefined && !semanticInstance.test(activity.sourceInstanceId)
      && !extractedInstance.test(activity.sourceInstanceId)) {
      throw new Error('Invalid modern lesson source activity instance');
    }
    const lifetime=activity.parentLifetime;
    if (Boolean(activity.sourceInstanceId)!==Boolean(lifetime) || (lifetime && (
      !Number.isSafeInteger(lifetime.firstFrame)||!Number.isSafeInteger(lifetime.lastFrameExclusive)
      ||lifetime.firstFrame<1||lifetime.lastFrameExclusive<=lifetime.firstFrame||lifetime.lastFrameExclusive>parentFrameCount+1
      ||activity.parentFrames.some(frame=>frame<lifetime.firstFrame||frame>=lifetime.lastFrameExclusive)))) {
      throw new Error('Invalid modern lesson source activity lifetime');
    }
    if(activity.sourceInstanceId){
      const previous=instances.get(activity.sourceInstanceId);
      if(previous&&(previous.frameDomain!==activity.frameDomain
        ||previous.parentLifetime?.firstFrame!==lifetime?.firstFrame
        ||previous.parentLifetime?.lastFrameExclusive!==lifetime?.lastFrameExclusive))throw new Error('Conflicting modern lesson source instance binding');
      instances.set(activity.sourceInstanceId,activity);
    }
    if (activity.audio && (!isSameOriginAssetSource(activity.audio.source)
      || !/^[a-f0-9]{64}$/.test(activity.audio.sha256)
      || !['en','es','shared'].includes(activity.audio.language)
      || !Number.isSafeInteger(activity.audio.firstFrame) || !Number.isSafeInteger(activity.audio.lastFrame)
      || activity.audio.firstFrame < 1 || activity.audio.lastFrame < activity.audio.firstFrame
      || (activity.audio.offsetSeconds !== undefined && (!Number.isFinite(activity.audio.offsetSeconds) || activity.audio.offsetSeconds < 0)))) {
      throw new Error('Invalid modern lesson source activity audio');
    }
  }
  for (const activity of activities) {
    const edge = activity.entryFromActivity;
    if (!edge) continue;
    const source = activities.find(item => item.id === edge.id);
    if (!source || source.id === activity.id || source.frameDomain !== activity.frameDomain
      || source.sourceInstanceId !== activity.sourceInstanceId
      || !Number.isSafeInteger(edge.firstFrame) || !Number.isSafeInteger(edge.lastFrame)
      || edge.firstFrame < source.startFrame || edge.lastFrame < edge.firstFrame || edge.lastFrame > source.endFrame
      || activity.startFrame <= source.endFrame
      || activity.parentFrames.some(frame => !source.parentFrames.includes(frame))) {
      throw new Error('Invalid modern lesson source activity entry edge');
    }
  }
}

export function lessonTextActivityRequestAllowed(activities: readonly LessonTextActivityDefinition[] | undefined,
  request: LessonTextActivityRequest, current: Readonly<{frame: number; capture: boolean; activity?: LessonTextActivitySnapshot; activities?: readonly LessonTextActivitySnapshot[]}>) {
  if (current.capture || request.parentFrame !== current.frame) return undefined;
  const definition = activities?.find(activity => activity.id === request.id && activity.parentFrames.includes(current.frame));
  if (!definition || definition.buttonPress) return undefined;
  const all = current.activities ?? (current.activity ? [current.activity] : []);
  const edge = definition.entryFromActivity;
  const active = definition.sourceInstanceId
    ? all.find(item => item.sourceInstanceId === definition.sourceInstanceId) : current.activity;
  if (edge) {
    if (!active || !request.fromActivity || request.fromActivity.id !== active.id
      || request.fromActivity.revision !== active.revision || edge.id !== active.id
      || active.frameDomain !== definition.frameDomain || active.frame < edge.firstFrame || active.frame > edge.lastFrame) return undefined;
  } else if (request.fromActivity || (!definition.sourceInstanceId && all.some(item=>item.status === 'playing'))) return undefined;
  if (definition.sourceInstanceId && all.some(item=>!item.sourceInstanceId && item.status==='playing')) return undefined;
  return definition;
}
