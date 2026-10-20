export interface PublicCourseDiscoveryInput {
  /** Lesson routes from availableLearningLessons(), the same gate the home page uses. */
  readonly availableLessonRoutes: readonly string[];
}

export interface PublicCourseDiscovery {
  readonly lessonRoutes: readonly string[];
  readonly robotDisallow: readonly string[];
}

const LESSON_ROUTE = /^\/courses\/[3-5]\/\d{1,2}$/u;

/**
 * Crawl discovery is derived from the exact lesson routes that passed
 * registration, descriptor/navigation cross-binding, and publication gates.
 * There is deliberately no hardcoded allowlist that can drift from home.
 */
export function resolvePublicCourseDiscovery({
  availableLessonRoutes,
}: PublicCourseDiscoveryInput): PublicCourseDiscovery {
  const lessonRoutes = [...new Set(
    availableLessonRoutes.map((route) => route.split('?')[0]!),
  )].filter((route) => LESSON_ROUTE.test(route));

  return Object.freeze({
    lessonRoutes: Object.freeze(lessonRoutes),
    robotDisallow: Object.freeze([]),
  });
}
