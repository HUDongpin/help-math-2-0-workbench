import 'server-only';

import {
  NovaTutorPolicyConfigurationError,
  findNovaTutorCoursePolicy,
  novaTutorCourseIsLearnerAvailable,
  resolveNovaTutorServerPolicy,
  type NovaCapabilitiesEnvironment,
} from './nova-capabilities.server';
import {
  NovaFrameNormalizationError,
  normalizeNovaTutorFrame,
  type NormalizedNovaTutorFrame,
} from './nova-frame-normalization.server';
import {NovaProviderError} from './nova-openrouter.server';
import type {NovaTutorTransportRequest} from './nova-request-schema';
import {
  tutorPageContext,
  type TutorPageContext,
} from './tutor-integration';
import {findWholeLessonCourseRegistration} from
  './whole-lesson-course-registry';

const resolvedNovaTutorRequestBrand = Symbol('ResolvedNovaTutorRequest');

export interface ResolvedNovaTutorPageContext extends TutorPageContext {
  readonly placementId: string;
  readonly courseTitle: string;
  readonly courseTitleEnglish: string;
  readonly courseTitleSpanish: string | null;
  readonly courseTitleUsesEnglishFallback: boolean;
  readonly sectionTitleEnglish: string;
  readonly sectionTitleSpanish: string | null;
  readonly sectionTitleUsesEnglishFallback: boolean;
}

export interface ResolvedNovaTutorRequest {
  readonly [resolvedNovaTutorRequestBrand]: true;
  readonly locale: 'en' | 'es';
  readonly mode: 'focus';
  readonly message: string;
  readonly history: readonly Readonly<{
    role: 'user' | 'assistant';
    text: string;
  }>[];
  readonly context: ResolvedNovaTutorPageContext;
  readonly frame?: NormalizedNovaTutorFrame;
}

export type NovaTutorRequestResolutionFailure =
  | 'not-configured'
  | 'course-not-available'
  | 'canonical-mismatch'
  | 'frame-not-available'
  | 'invalid-frame'
  | 'registry-unavailable';

/** Contains no learner text, frame bytes, provider values, or registry data. */
export class NovaTutorRequestResolutionError extends Error {
  constructor(readonly failure: NovaTutorRequestResolutionFailure) {
    super(`Nova Tutor request resolution failed: ${failure}`);
    this.name = 'NovaTutorRequestResolutionError';
  }
}

function resolutionFailure(
  failure: NovaTutorRequestResolutionFailure,
): never {
  throw new NovaTutorRequestResolutionError(failure);
}

const canonicalContextFields = [
  'releaseId',
  'grade',
  'lesson',
  'animationId',
  'sectionCode',
  'sectionTitle',
  'globalPageOrdinal',
  'activePageCount',
  'pageTitle',
  'pageTitleEnglish',
  'pageTitleSpanish',
  'locale',
  'pageTitleUsesEnglishFallback',
  'assessment',
] as const satisfies readonly (keyof TutorPageContext)[];

function transportContextMatchesCanonical(
  transport: NovaTutorTransportRequest['context'],
  canonical: TutorPageContext,
) {
  return canonicalContextFields.every(
    (field) => transport[field] === canonical[field],
  );
}

/**
 * Resolve browser transport data against the exact registered course, source
 * occurrence, localized labels, rollout policy, and learner-visible release.
 * Only this branded result may cross into the provider adapter.
 */
export async function resolveNovaTutorRequest(
  request: NovaTutorTransportRequest,
  environment: NovaCapabilitiesEnvironment = process.env,
): Promise<ResolvedNovaTutorRequest> {
  const policyEntry = findNovaTutorCoursePolicy(request.context);
  if (!policyEntry) return resolutionFailure('canonical-mismatch');

  const registration = findWholeLessonCourseRegistration(
    request.context.grade,
    request.context.lesson,
  );
  if (
    !registration ||
    registration.descriptor.releaseId !== policyEntry.releaseId ||
    registration.descriptor.descriptorId !== policyEntry.descriptorId
  ) {
    return resolutionFailure('registry-unavailable');
  }

  const descriptor = registration.descriptor;
  if (!descriptor.support.locales.includes(request.locale)) {
    return resolutionFailure('registry-unavailable');
  }

  const page = descriptor.pages[request.context.globalPageOrdinal - 1];
  if (
    !page ||
    page.globalPageOrdinal !== request.context.globalPageOrdinal ||
    page.animationId !== request.context.animationId
  ) {
    return resolutionFailure('canonical-mismatch');
  }
  const section = descriptor.sections.find(
    (candidate) => candidate.code === page.sectionCode,
  );
  if (!section) return resolutionFailure('registry-unavailable');

  const pageLabel = page.labels[request.locale];
  const sectionLabel = section.labels[request.locale];
  const canonicalContext = tutorPageContext({
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    animationId: page.animationId,
    sectionCode: page.sectionCode,
    sectionTitle: sectionLabel.text,
    globalPageOrdinal: page.globalPageOrdinal,
    activePageCount: descriptor.course.activePageCount,
    pageTitle: pageLabel.text,
    pageTitleEnglish: page.labels.en.text,
    pageTitleSpanish: page.labels.es.usesEnglishFallback
      ? null
      : page.labels.es.text,
    locale: request.locale,
    pageTitleUsesEnglishFallback: pageLabel.usesEnglishFallback,
  });
  if (!transportContextMatchesCanonical(request.context, canonicalContext)) {
    return resolutionFailure('canonical-mismatch');
  }

  let serverPolicy: ReturnType<typeof resolveNovaTutorServerPolicy>;
  try {
    serverPolicy = resolveNovaTutorServerPolicy(environment);
  } catch (error) {
    if (
      error instanceof NovaProviderError ||
      error instanceof NovaTutorPolicyConfigurationError
    ) {
      return resolutionFailure('not-configured');
    }
    throw error;
  }

  if (
    environment.MODERN_WIDE_SHELL_ENABLED !== 'true' ||
    !descriptor.visualSkin.presentations?.includes('modern-wide')
  ) {
    return resolutionFailure('course-not-available');
  }

  let learnerAvailable: boolean;
  try {
    learnerAvailable = novaTutorCourseIsLearnerAvailable({
      grade: policyEntry.grade,
      lesson: policyEntry.lesson,
      releaseId: policyEntry.releaseId,
      environment,
    });
  } catch {
    return resolutionFailure('registry-unavailable');
  }
  if (
    !policyEntry.textEligible ||
    !serverPolicy.courseReleaseIds.has(policyEntry.releaseId) ||
    !learnerAvailable
  ) {
    return resolutionFailure('course-not-available');
  }

  let normalizedFrame: NormalizedNovaTutorFrame | undefined;
  if (request.frame) {
    if (
      !policyEntry.currentLessonFrameEligible ||
      !serverPolicy.currentLessonFrame
    ) {
      return resolutionFailure('frame-not-available');
    }
    if (
      request.frame.releaseId !== descriptor.releaseId ||
      request.frame.globalPageOrdinal !== page.globalPageOrdinal ||
      request.frame.animationId !== page.animationId
    ) {
      return resolutionFailure('canonical-mismatch');
    }
    try {
      normalizedFrame = await normalizeNovaTutorFrame(request.frame);
    } catch (error) {
      if (error instanceof NovaFrameNormalizationError) {
        return resolutionFailure('invalid-frame');
      }
      throw error;
    }
  }

  const courseLabel = descriptor.course.labels[request.locale];
  const context: ResolvedNovaTutorPageContext = Object.freeze({
    ...canonicalContext,
    placementId: page.placementId ?? page.animationId,
    courseTitle: courseLabel.text,
    courseTitleEnglish: descriptor.course.labels.en.text,
    courseTitleSpanish: descriptor.course.labels.es.usesEnglishFallback
      ? null
      : descriptor.course.labels.es.text,
    courseTitleUsesEnglishFallback: courseLabel.usesEnglishFallback,
    sectionTitleEnglish: section.labels.en.text,
    sectionTitleSpanish: section.labels.es.usesEnglishFallback
      ? null
      : section.labels.es.text,
    sectionTitleUsesEnglishFallback: sectionLabel.usesEnglishFallback,
  });

  return Object.freeze({
    [resolvedNovaTutorRequestBrand]: true as const,
    locale: request.locale,
    mode: 'focus',
    message: request.message,
    history: Object.freeze(request.history.map((entry) =>
      Object.freeze({role: entry.role, text: entry.text})
    )),
    context,
    ...(normalizedFrame ? {frame: normalizedFrame} : {}),
  });
}
