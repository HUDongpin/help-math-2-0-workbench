import {publicLessonCatalog} from './public-launch-manifest.server';

export const PUBLIC_LESSON_ROUTE_UNIVERSE = Object.freeze(
  publicLessonCatalog().map((lesson) => lesson.routes.en),
);

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
  const lessonRoutes = PUBLIC_LESSON_ROUTE_UNIVERSE.filter((route) =>
    available.has(route)
  );
  const unavailableRoutes = PUBLIC_LESSON_ROUTE_UNIVERSE.filter((route) =>
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
