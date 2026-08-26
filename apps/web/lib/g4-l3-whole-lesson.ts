import {G4_L3_LESSON, type G4L3Locale} from './g4-l3-lesson-navigation';
import {
  createInitialWholeLessonSessionProgress,
  parseLegacyWholeLessonSessionProgress,
  recordWholeLessonReplay,
  reviewWholeLessonPage,
  setWholeLessonSessionLocale,
  startWholeLessonAtBeginning,
  visitWholeLessonPage,
  wholeLessonHasResumablePlacement,
  wholeLessonReviewedPercent,
  type WholeLessonSessionProgress,
} from './whole-lesson-session';

export const G4_L3_WHOLE_LESSON_STORAGE_KEY =
  'helpmath:g4-l3:whole-lesson-mvp:v1';

/**
 * Compatibility shape for existing G4 L3 local learner state.
 *
 * `completedAnimationIds` is an inherited storage field and means only that a
 * learner marked a page reviewed. It never means strict migration completion,
 * owner acceptance, or publication.
 */
export interface G4L3WholeLessonProgress {
  schemaVersion: 1;
  currentAnimationId: string;
  language: G4L3Locale;
  visitedAnimationIds: string[];
  completedAnimationIds: string[];
  replayCounts: Record<string, number>;
}

export const G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR = Object.freeze({
  releaseId: G4_L3_LESSON.releaseId,
  pages: G4_L3_LESSON.pages,
});

function toGenericProgress(
  progress: G4L3WholeLessonProgress,
): WholeLessonSessionProgress {
  return {
    schemaVersion: progress.schemaVersion,
    releaseId: G4_L3_LESSON.releaseId,
    currentAnimationId: progress.currentAnimationId,
    locale: progress.language,
    visitedAnimationIds: progress.visitedAnimationIds,
    reviewedAnimationIds: progress.completedAnimationIds,
    replayCounts: progress.replayCounts,
  };
}

function fromGenericProgress(
  progress: WholeLessonSessionProgress,
): G4L3WholeLessonProgress {
  return {
    schemaVersion: progress.schemaVersion,
    currentAnimationId: progress.currentAnimationId,
    language: progress.locale,
    visitedAnimationIds: [...progress.visitedAnimationIds],
    completedAnimationIds: [...progress.reviewedAnimationIds],
    replayCounts: {...progress.replayCounts},
  };
}

function adaptLegacyG4L3Progress(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const legacy = value as Record<string, unknown>;
  return {
    schemaVersion: legacy.schemaVersion,
    releaseId: G4_L3_LESSON.releaseId,
    currentAnimationId: legacy.currentAnimationId,
    locale: legacy.language,
    visitedAnimationIds: legacy.visitedAnimationIds,
    reviewedAnimationIds: legacy.completedAnimationIds,
    replayCounts: legacy.replayCounts,
  };
}

export function createInitialG4L3WholeLessonProgress(
  language: G4L3Locale,
): G4L3WholeLessonProgress {
  return fromGenericProgress(createInitialWholeLessonSessionProgress(
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    language,
  ));
}

export function parseG4L3WholeLessonProgress(
  serialized: string | null,
  fallbackLanguage: G4L3Locale,
): G4L3WholeLessonProgress {
  return fromGenericProgress(parseLegacyWholeLessonSessionProgress(
    serialized,
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    fallbackLanguage,
    adaptLegacyG4L3Progress,
  ));
}

export function parseG4L3WholeLessonResumeCandidate(
  serialized: string | null,
  fallbackLanguage: G4L3Locale,
): G4L3WholeLessonProgress | null {
  const progress = parseG4L3WholeLessonProgress(
    serialized,
    fallbackLanguage,
  );
  return wholeLessonHasResumablePlacement(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
  )
    ? progress
    : null;
}

export function startG4L3LessonAtBeginning(
  progress: G4L3WholeLessonProgress,
): G4L3WholeLessonProgress {
  return fromGenericProgress(startWholeLessonAtBeginning(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
  ));
}

export function visitG4L3Page(
  progress: G4L3WholeLessonProgress,
  animationId: string,
): G4L3WholeLessonProgress {
  return fromGenericProgress(visitWholeLessonPage(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    animationId,
  ));
}

export function completeG4L3Page(
  progress: G4L3WholeLessonProgress,
  animationId: string,
): G4L3WholeLessonProgress {
  return fromGenericProgress(reviewWholeLessonPage(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    animationId,
  ));
}

export function recordG4L3Replay(
  progress: G4L3WholeLessonProgress,
  animationId: string,
): G4L3WholeLessonProgress {
  return fromGenericProgress(recordWholeLessonReplay(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    animationId,
  ));
}

export function setG4L3LessonLanguage(
  progress: G4L3WholeLessonProgress,
  language: G4L3Locale,
): G4L3WholeLessonProgress {
  return fromGenericProgress(setWholeLessonSessionLocale(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
    language,
  ));
}

export function g4L3CompletionPercent(
  progress: G4L3WholeLessonProgress,
): number {
  return wholeLessonReviewedPercent(
    toGenericProgress(progress),
    G4_L3_WHOLE_LESSON_SESSION_DESCRIPTOR,
  );
}
