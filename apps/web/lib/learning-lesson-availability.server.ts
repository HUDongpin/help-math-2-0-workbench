import {getCatalog, isLessonReleasePublished} from './catalog';
import {
  currentJsShowcasePublication,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';
import {findLessonNavigationForRoute} from './lesson-navigation';
import {findPageOnlyCurrentJsNavigationForRoute} from './page-only-current-js-navigation.server';
import {
  wholeLessonCourseRegistrations,
} from './whole-lesson-course-registry';
import {wholeLessonDescriptorMatchesNavigation} from './whole-lesson-player-descriptor';
import {
  G678_SHARED_MODULES,
  isG678GradeMappingAuthorityApproved,
  isG678LocalPreviewEnabled,
  sharedMiddleSchoolCatalog,
  sharedMiddleSchoolCourseKey,
  sharedMiddleSchoolLessonCatalog,
  type G678MappingStatus,
  type SharedLessonAvailability,
  type SharedMiddleSchoolLesson,
} from './g678-shared-course-catalog.server';
import {LESSON_CATALOG_SAMPLE} from './learning-platform-sample-data';

export type LessonAvailabilityStatus =
  | SharedLessonAvailability
  | 'unavailable';

export interface LearningLessonCard {
  readonly activePageCount: number;
  readonly courseKey: string | null;
  readonly evidenceBoundary: string;
  readonly evidenceBoundarySpanish?: string;
  readonly grade: number | null;
  readonly gradeTags: readonly number[];
  readonly href: string | null;
  readonly lesson: number;
  readonly moduleCode: string | null;
  readonly moduleTitle: string | null;
  readonly registeredPageCount: number;
  readonly releaseId: string | null;
  readonly sourceXmlPath: string | null;
  readonly sourceXmlSha256: string | null;
  readonly mappingStatus: G678MappingStatus | null;
  readonly mappingVersion: string | null;
  readonly ccssStandardCodes: readonly string[];
  readonly sourceBacked: boolean;
  readonly stableLessonKey: string;
  readonly status: LessonAvailabilityStatus;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly availabilityReason: string;
}

export interface AvailableLearningLesson {
  readonly activePageCount: number;
  readonly grade: number;
  readonly gradeTags?: readonly number[];
  readonly href: string;
  readonly lesson: number;
  readonly moduleCode?: string;
  readonly moduleTitle?: string;
  readonly courseKey?: string;
  readonly releaseId: string;
  readonly registeredPageCount: number;
  readonly availability: Exclude<LessonAvailabilityStatus, 'unavailable' | 'source-mapping-pending'>;
  readonly evidenceBoundary: string;
  readonly evidenceBoundarySpanish?: string;
  readonly stableLessonKey?: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
}

/**
 * A lesson-level admission gate.  Page candidates are never learner links:
 * the descriptor must be source-order bound and every active placement must
 * have a registered renderer before the local engineering preview opens.
 */
export function wholeLessonEngineeringPreviewReady({
  activePageCount,
  descriptorBound,
  env = process.env,
  moduleCode,
  registeredPageCount,
}: {
  readonly activePageCount: number;
  readonly descriptorBound: boolean;
  readonly env?: CurrentJsShowcaseEnvironment;
  readonly moduleCode?: string;
  readonly registeredPageCount: number;
}): boolean {
  if (
    !Number.isSafeInteger(activePageCount) ||
    activePageCount < 1 ||
    !Number.isSafeInteger(registeredPageCount) ||
    registeredPageCount !== activePageCount ||
    !descriptorBound
  ) return false;
  return moduleCode === undefined || isG678LocalPreviewEnabled(env);
}

/**
 * Derives learner-visible lesson links from the same descriptor, source-order,
 * and publication gates used by the course route. All Lessons therefore has
 * no independent hardcoded allowlist that can drift from runnable My Lesson.
 */
export function availableLearningLessons(
  env: CurrentJsShowcaseEnvironment = process.env,
): readonly AvailableLearningLesson[] {
  const catalog = getCatalog();
  const developmentAudit = env.NODE_ENV !== 'production';

  return Object.freeze(wholeLessonCourseRegistrations().flatMap(
    ({descriptor}) => {
      const moduleCode = descriptor.course.moduleCode;
      if (moduleCode && !isG678GradeMappingAuthorityApproved()) return [];
      const catalogNavigation = findLessonNavigationForRoute(
        catalog,
        descriptor.course.grade,
        descriptor.course.lesson,
        moduleCode,
      );
      const pageOnlyNavigation = findPageOnlyCurrentJsNavigationForRoute(
        descriptor.course.grade,
        descriptor.course.lesson,
        moduleCode,
      );
      const navigation = [catalogNavigation, pageOnlyNavigation].find(
        (candidate) => candidate && wholeLessonDescriptorMatchesNavigation(
          descriptor,
          candidate,
        ),
      );
      const descriptorBound = Boolean(navigation);
      const releasePublished = isLessonReleasePublished(
        catalog,
        descriptor.releaseId,
      );
      const showcaseEnabled = currentJsShowcasePublication(
        descriptor.releaseId,
        env,
      ).enabled;
      const registeredPageCount = descriptor.pages.filter(
        (page) => page.rendererAvailability.kind === 'registered',
      ).length;
      if (
        !wholeLessonEngineeringPreviewReady({
          activePageCount: descriptor.course.activePageCount,
          descriptorBound,
          env,
          moduleCode,
          registeredPageCount,
        }) ||
        (!developmentAudit && !releasePublished && !showcaseEnabled)
      ) {
        return [];
      }

      return [Object.freeze({
        activePageCount: descriptor.course.activePageCount,
        grade: descriptor.course.grade,
        gradeTags: descriptor.course.gradeTags ??
          (moduleCode ? [descriptor.course.grade] : undefined),
        href: `${descriptor.course.href}?mode=focus`,
        lesson: descriptor.course.lesson,
        moduleCode,
        moduleTitle: moduleCode
          ? G678_SHARED_MODULES.find((module) => module.code === moduleCode)?.titleEnglish
          : undefined,
        courseKey: descriptor.course.courseKey,
        releaseId: descriptor.releaseId,
        registeredPageCount,
        availability: releasePublished
          ? 'released' as const
          : 'engineering-preview' as const,
        evidenceBoundary:
          'Current-JS engineering preview; original Flash behavior, fidelity, audio, human review, Owner acceptance, strict completion, and release remain pending.',
        evidenceBoundarySpanish:
          'Vista previa de ingeniería Current-JS; el comportamiento Flash original, la fidelidad, el audio, la revisión humana, la aceptación del propietario, la finalización estricta y la publicación siguen pendientes.',
        stableLessonKey: descriptor.course.courseKey,
        titleEnglish: descriptor.course.labels.en.text,
        titleSpanish: descriptor.course.labels.es.usesEnglishFallback
          ? null
          : descriptor.course.labels.es.text,
      })];
    },
  ).sort((left, right) =>
    left.grade - right.grade ||
    (left.moduleCode ?? '').localeCompare(right.moduleCode ?? '') ||
    left.lesson - right.lesson
  ));
}

function availableByIdentity(
  availableLessons: readonly AvailableLearningLesson[],
) {
  const byKey = new Map<string, AvailableLearningLesson>();
  for (const lesson of availableLessons) {
    const key = lesson.courseKey ??
      `${lesson.grade}:${lesson.moduleCode ?? ''}:${lesson.lesson}`;
    byKey.set(key, lesson);
  }
  return byKey;
}

function sharedAvailableLesson(
  lesson: SharedMiddleSchoolLesson,
  availableLessons: readonly AvailableLearningLesson[],
): AvailableLearningLesson | undefined {
  const byKey = availableByIdentity(availableLessons);
  const courseKey = lesson.primaryGrade
    ? sharedMiddleSchoolCourseKey(
        lesson.primaryGrade,
        lesson.moduleCode,
        lesson.moduleLesson,
      )
    : null;
  return (courseKey ? byKey.get(courseKey) : undefined) ??
    availableLessons.find((candidate) =>
      candidate.moduleCode?.toUpperCase() === lesson.moduleCode &&
      candidate.lesson === lesson.moduleLesson,
    );
}

function sharedLessonCard(
  lesson: SharedMiddleSchoolLesson,
  availableLessons: readonly AvailableLearningLesson[],
): LearningLessonCard {
  const available = sharedAvailableLesson(lesson, availableLessons);
  // Keep a truthful partial-registration count for the engineering dashboard.
  // It is deliberately independent from `availableLearningLessons()`: a
  // partially registered lesson must remain locked, but showing `0` would
  // hide useful migration progress and could be mistaken for missing source
  // pages.  No registration currently exists for G6–G8, so this resolves to
  // zero until a real descriptor is admitted.
  const registration = wholeLessonCourseRegistrations().find(({descriptor}) =>
    descriptor.course.moduleCode?.toUpperCase() === lesson.moduleCode &&
    descriptor.course.lesson === lesson.moduleLesson,
  );
  const registeredPageCount = registration?.descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  ).length ?? 0;
  const mapped = lesson.primaryGrade !== null &&
    lesson.mappingStatus === 'approved';
  const stableLessonKey = lesson.stableLessonKey;
  const courseKey = lesson.courseKey;
  if (available) {
    return Object.freeze({
      activePageCount: available.activePageCount,
      courseKey: available.courseKey ?? courseKey,
      evidenceBoundary: available.evidenceBoundary,
      evidenceBoundarySpanish: available.evidenceBoundarySpanish,
      grade: available.grade,
      gradeTags: Object.freeze([...(available.gradeTags ?? lesson.gradeTags)]),
      href: available.href,
      lesson: lesson.moduleLesson,
      moduleCode: lesson.moduleCode,
      moduleTitle: lesson.moduleTitle,
      registeredPageCount: available.registeredPageCount,
      releaseId: available.releaseId,
      sourceXmlPath: lesson.sourceXmlPath,
      sourceXmlSha256: lesson.sourceXmlSha256,
      mappingStatus: lesson.mappingStatus,
      mappingVersion: lesson.mappingVersion,
      ccssStandardCodes: lesson.ccssStandardCodes,
      sourceBacked: lesson.sourceBacked,
      stableLessonKey,
      status: available.availability,
      titleEnglish: lesson.titleEnglish,
      titleSpanish: lesson.titleSpanish,
      availabilityReason: 'whole-lesson-registered-and-descriptor-bound',
    });
  }
  return Object.freeze({
    activePageCount: lesson.activePageCount,
    courseKey,
    evidenceBoundary: mapped
      ? 'Source mapping is approved, but the complete Current-JS page sequence is not registered yet.'
      : 'Common Core grade mapping is pending independent review; no learner route is available.',
    evidenceBoundarySpanish: mapped
      ? 'El mapeo de la fuente está aprobado, pero la secuencia completa de páginas Current-JS aún no está registrada.'
      : 'El mapeo de grado Common Core está pendiente de revisión independiente; no hay una ruta de estudiante disponible.',
    grade: lesson.primaryGrade,
    gradeTags: lesson.gradeTags,
    href: null,
    lesson: lesson.moduleLesson,
    moduleCode: lesson.moduleCode,
    moduleTitle: lesson.moduleTitle,
    registeredPageCount,
    releaseId: null,
    sourceXmlPath: lesson.sourceXmlPath,
    sourceXmlSha256: lesson.sourceXmlSha256,
    mappingStatus: lesson.mappingStatus,
    mappingVersion: lesson.mappingVersion,
    ccssStandardCodes: lesson.ccssStandardCodes,
    sourceBacked: lesson.sourceBacked,
    stableLessonKey,
    status: mapped ? 'unavailable' : 'source-mapping-pending',
    titleEnglish: lesson.titleEnglish,
    titleSpanish: lesson.titleSpanish,
    availabilityReason: mapped
      ? 'current-js-registration-pending'
      : `mapping-${lesson.mappingStatus}`,
  });
}

function legacyLessonCard(
  lesson: (typeof LESSON_CATALOG_SAMPLE)[number],
  availableLessons: readonly AvailableLearningLesson[],
): LearningLessonCard {
  const available = availableLessons.find((candidate) =>
    candidate.grade === lesson.grade &&
    candidate.lesson === lesson.lesson &&
    candidate.moduleCode === undefined,
  );
  return Object.freeze({
    activePageCount: available?.activePageCount ?? lesson.pages,
    courseKey: available?.courseKey ?? null,
    evidenceBoundary: available?.evidenceBoundary ??
      'This lesson is not available in the current JavaScript registry.',
    grade: lesson.grade,
    gradeTags: available?.gradeTags ?? Object.freeze([lesson.grade]),
    href: available?.href ?? null,
    lesson: lesson.lesson,
    moduleCode: null,
    moduleTitle: null,
    registeredPageCount: available?.registeredPageCount ?? 0,
    releaseId: available?.releaseId ?? null,
    sourceXmlPath: null,
    sourceXmlSha256: null,
    mappingStatus: null,
    mappingVersion: null,
    ccssStandardCodes: Object.freeze([]),
    sourceBacked: true,
    stableLessonKey: available?.stableLessonKey ??
      `legacy-g${lesson.grade}-l${String(lesson.lesson).padStart(2, '0')}`,
    status: available?.availability ?? 'unavailable',
    titleEnglish: lesson.title,
    titleSpanish: available?.titleSpanish ?? null,
    availabilityReason: available
      ? 'whole-lesson-registered-and-descriptor-bound'
      : 'current-js-registration-pending',
  });
}

/**
 * Returns every lesson card shown by All Lessons.  This deliberately differs
 * from availableLearningLessons(): locked source-backed cards are useful for
 * local migration visibility but never become learner links.
 */
export function allLearningLessons(
  env: CurrentJsShowcaseEnvironment = process.env,
): readonly LearningLessonCard[] {
  const availableLessons = availableLearningLessons(env);
  const legacy = LESSON_CATALOG_SAMPLE.map((lesson) =>
    legacyLessonCard(lesson, availableLessons),
  );
  // The source-backed G6-G8 projection is an engineering surface, not public
  // course discovery.  Production keeps the historical G3-G5 card set even
  // when a deployment accidentally carries the local preview environment
  // variable.  Local development may still show locked mapping-pending cards
  // without enabling their learner routes.
  const sharedSnapshot = sharedMiddleSchoolCatalog();
  // A malformed or stale checked-in projection must not manufacture cards
  // from fallback counts.  Keep the shared surface absent until the
  // source-bound catalog validator succeeds; the migration dashboard can
  // still report the failure separately.
  const shared = env.NODE_ENV === 'production' || !sharedSnapshot.sourceProjectionValid
    ? []
    : sharedMiddleSchoolLessonCatalog().map((lesson) =>
        sharedLessonCard(lesson, availableLessons),
      );
  return Object.freeze([...legacy, ...shared]);
}
