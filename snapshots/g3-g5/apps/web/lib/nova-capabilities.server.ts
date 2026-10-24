import 'server-only';

import {
  EMPTY_NOVA_CLIENT_CAPABILITIES,
  type NovaClientCapabilities,
} from './nova-capabilities';
import {availableLearningLessons} from './learning-lesson-availability.server';
import {
  NovaProviderError,
  readNovaOpenRouterConfig,
} from './nova-openrouter.server';
import {findWholeLessonCourseRegistration} from './whole-lesson-course-registry';
import type {WholeLessonHostPresentation} from
  './whole-lesson-host-presentation';

export type NovaCapabilitiesEnvironment =
  Readonly<Record<string, string | undefined>>;

export const NOVA_TUTOR_COURSE_POLICY = Object.freeze([
  Object.freeze({
    grade: 4,
    lesson: 3,
    releaseId: 'lesson-g04-l03-negative-numbers',
    descriptorId: 'g4-l3-formal-page-only-course-v1',
    rolloutPriority: 1,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 5,
    lesson: 4,
    releaseId: 'lesson-g05-l04-number-lines',
    descriptorId: 'g5-l4-formal-page-only-course-v1',
    rolloutPriority: 2,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 3,
    lesson: 2,
    releaseId: 'lesson-g03-l02-addition-subtraction-page-only-current-js',
    descriptorId: 'whole-lesson-player-g03-l02-page-only-v1',
    rolloutPriority: 3,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 4,
    lesson: 5,
    releaseId: 'lesson-g04-l05-multiplication-page-only',
    descriptorId: 'g4-l5-formal-page-only-course-v1',
    rolloutPriority: 4,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 4,
    lesson: 10,
    releaseId: 'lesson-g04-l10-perimeter-area-page-only',
    descriptorId: 'g4-l10-formal-page-only-course-v1',
    rolloutPriority: 5,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 4,
    lesson: 11,
    releaseId: 'lesson-g04-l11-coordinate-grid-page-only',
    descriptorId: 'g4-l11-formal-page-only-course-v1',
    rolloutPriority: 6,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 5,
    lesson: 3,
    releaseId: 'lesson-g05-l03-exponents-prime-factorizations-page-only',
    descriptorId: 'whole-lesson-player-g05-l03-page-only-v1',
    rolloutPriority: 7,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
  Object.freeze({
    grade: 5,
    lesson: 5,
    releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
    descriptorId: 'whole-lesson-player-g05-l05-page-only-v1',
    rolloutPriority: 8,
    textEligible: true,
    currentLessonFrameEligible: true,
    speechToDraftEligible: true,
  }),
] as const);

export type NovaTutorCoursePolicy =
  (typeof NOVA_TUTOR_COURSE_POLICY)[number];
export type NovaTutorReleaseId = NovaTutorCoursePolicy['releaseId'];

const policyByReleaseId = new Map<NovaTutorReleaseId, NovaTutorCoursePolicy>(
  NOVA_TUTOR_COURSE_POLICY.map((entry) => [entry.releaseId, entry]),
);

export class NovaTutorPolicyConfigurationError extends Error {
  constructor() {
    super('Nova Tutor rollout policy is not configured');
    this.name = 'NovaTutorPolicyConfigurationError';
  }
}

/**
 * Parse the independent course rollout allowlist. An absent or blank value is
 * a valid closed rollout. Any unknown or repeated release invalidates the
 * complete value rather than partially authorizing it.
 */
export function parseNovaTutorReleaseIds(
  value: string | undefined,
): readonly NovaTutorReleaseId[] {
  if (value === undefined || value.trim() === '') return Object.freeze([]);

  const releases: NovaTutorReleaseId[] = [];
  const seen = new Set<NovaTutorReleaseId>();
  for (const rawEntry of value.split(',')) {
    const releaseId = rawEntry.trim() as NovaTutorReleaseId;
    if (
      releaseId.length === 0 ||
      !policyByReleaseId.has(releaseId) ||
      seen.has(releaseId)
    ) {
      throw new NovaTutorPolicyConfigurationError();
    }
    seen.add(releaseId);
    releases.push(releaseId);
  }
  return Object.freeze(releases);
}

export function findNovaTutorCoursePolicy(input: {
  readonly grade: number;
  readonly lesson: number;
  readonly releaseId: string;
}): NovaTutorCoursePolicy | undefined {
  const policy = policyByReleaseId.get(input.releaseId as NovaTutorReleaseId);
  return policy &&
      policy.grade === input.grade &&
      policy.lesson === input.lesson
    ? policy
    : undefined;
}

export type ResolvedNovaTutorServerPolicy = Readonly<{
  courseReleaseIds: ReadonlySet<NovaTutorReleaseId>;
  currentLessonFrame: boolean;
  speechToDraft: boolean;
}>;

/**
 * Resolve server configuration without exposing credentials or provider
 * routing. Every consumer receives the same fail-closed interpretation.
 */
export function resolveNovaTutorServerPolicy(
  environment: NovaCapabilitiesEnvironment = process.env,
): ResolvedNovaTutorServerPolicy {
  if (environment.NOVA_TUTOR_ENABLED !== 'true') {
    throw new NovaProviderError('not-configured');
  }

  const releaseIds = parseNovaTutorReleaseIds(
    environment.NOVA_TUTOR_RELEASE_IDS,
  );
  // This validates the exact model, official OpenRouter gateway, credential,
  // timeout, and output-token configuration. No value from it crosses the
  // client boundary.
  readNovaOpenRouterConfig(environment);

  return Object.freeze({
    courseReleaseIds: new Set(releaseIds),
    currentLessonFrame: environment.NOVA_ALLOW_FRAME_CONTEXT === 'true',
    speechToDraft: environment.NOVA_ALLOW_SPEECH_INPUT === 'true',
  });
}

export function novaTutorCourseIsLearnerAvailable(input: {
  readonly grade: number;
  readonly lesson: number;
  readonly releaseId: string;
  readonly environment?: NovaCapabilitiesEnvironment;
}) {
  const environment = input.environment ?? process.env;
  const registration = findWholeLessonCourseRegistration(
    input.grade,
    input.lesson,
  );
  if (
    !registration ||
    registration.descriptor.releaseId !== input.releaseId ||
    !registration.descriptor.visualSkin.presentations?.includes('modern-wide')
  ) return false;

  const policy = findNovaTutorCoursePolicy(input);
  if (!policy || registration.descriptor.descriptorId !== policy.descriptorId) {
    return false;
  }

  return availableLearningLessons(environment).some((lesson) =>
    lesson.grade === input.grade &&
    lesson.lesson === input.lesson &&
    lesson.releaseId === input.releaseId
  );
}

export function resolveNovaClientCapabilities({
  grade,
  lesson,
  releaseId,
  hostPresentation,
  environment = process.env,
}: {
  readonly grade: number;
  readonly lesson: number;
  readonly releaseId: string;
  readonly hostPresentation: WholeLessonHostPresentation;
  readonly environment?: NovaCapabilitiesEnvironment;
}): NovaClientCapabilities {
  if (
    hostPresentation !== 'modern-wide' ||
    environment.MODERN_WIDE_SHELL_ENABLED !== 'true'
  ) {
    return EMPTY_NOVA_CLIENT_CAPABILITIES;
  }

  try {
    const policy = resolveNovaTutorServerPolicy(environment);
    const course = findNovaTutorCoursePolicy({grade, lesson, releaseId});
    const text = Boolean(
      course?.textEligible &&
      policy.courseReleaseIds.has(course.releaseId) &&
      novaTutorCourseIsLearnerAvailable({
        grade,
        lesson,
        releaseId,
        environment,
      }),
    );
    if (!course || !text) return EMPTY_NOVA_CLIENT_CAPABILITIES;

    return Object.freeze({
      schemaVersion: 1,
      text: true,
      currentLessonFrame:
        course.currentLessonFrameEligible && policy.currentLessonFrame,
      speechToDraft: course.speechToDraftEligible && policy.speechToDraft,
    });
  } catch {
    return EMPTY_NOVA_CLIENT_CAPABILITIES;
  }
}
