import type {LessonTextCompletionCapability, LessonTextCompletionRequest} from './lesson-text-contract';

export function validateLessonTextCompletion(capability: LessonTextCompletionCapability, frameCount: number) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(capability.id) || !/^(?:root|sprite-\d+)$/.test(capability.frameDomain)
    || !capability.frames.length || new Set(capability.frames).size !== capability.frames.length
    || capability.frames.some(frame => !Number.isSafeInteger(frame) || frame < 1 || frame > frameCount)) {
    throw new Error('Modern lesson interaction completion lacks an exact source stop');
  }
}

export function lessonTextCompletionAllowed(capability: LessonTextCompletionCapability | undefined,
  request: LessonTextCompletionRequest, current: Readonly<{frame: number; frameDomain: string; seed: number; replay: number; capture: boolean}>) {
  return Boolean(capability && !current.capture && request.id === capability.id
    && current.frameDomain === capability.frameDomain && request.frameDomain === current.frameDomain
    && request.frame === current.frame && capability.frames.includes(current.frame)
    && request.seed === current.seed && request.replay === current.replay);
}
