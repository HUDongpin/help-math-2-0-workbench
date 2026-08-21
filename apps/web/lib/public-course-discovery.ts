export const PUBLIC_CURRENT_JS_LESSON_ROUTES = Object.freeze([
  '/courses/3/2',
  '/courses/4/3',
  '/courses/5/3',
  '/courses/5/4',
  '/courses/5/5',
] as const);

export interface PublicCourseDiscoveryInput {
  readonly availableLessonRoutes: readonly string[];
}

export interface PublicCourseDiscovery {
  readonly lessonRoutes: readonly string[];
  readonly robotDisallow: readonly string[];
}

/**
 * Keeps crawl discovery aligned with the same exact lesson routes that passed
 * registration, descriptor/navigation cross-binding, and publication gates.
 */
export function resolvePublicCourseDiscovery({
  availableLessonRoutes,
}: PublicCourseDiscoveryInput): PublicCourseDiscovery {
  const available = new Set(availableLessonRoutes);
  const lessonRoutes = PUBLIC_CURRENT_JS_LESSON_ROUTES.filter((route) =>
    available.has(route)
  );
  const unavailableRoutes = PUBLIC_CURRENT_JS_LESSON_ROUTES.filter((route) =>
    !available.has(route)
  );

  return Object.freeze({
    lessonRoutes: Object.freeze(lessonRoutes),
    robotDisallow: Object.freeze(unavailableRoutes.flatMap((route) => [
      route,
      `/es${route}`,
    ])),
  });
}
