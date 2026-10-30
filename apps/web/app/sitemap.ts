import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl, localizedPath} from '@/lib/site';
import {routeIndexable} from '@/lib/search-indexing';

// The sitemap reads the full lesson catalog, so it must be computed once at
// build time and served from the CDN, never per request (helpmath-web #78).
// A catalog error then fails the deployment instead of returning a runtime
// 5xx, and adding a Dynamic API here fails the build instead of silently
// turning the sitemap into a per-request function.
export const dynamic = 'error';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date('2026-08-21T00:00:00.000Z');
  const {lessonRoutes} = resolvePublicCourseDiscovery({
    availableLessonRoutes: availableLearningLessons().map(({href}) =>
      href.split('?')[0]!
    ),
  });
  const routes = ['/', ...lessonRoutes, '/privacy', '/terms'].filter(routeIndexable);

  return routes.flatMap((route) =>
    (['en', 'es'] as const).map((locale) => ({
      url: new URL(localizedPath(locale, route), siteUrl).toString(),
      lastModified,
      changeFrequency: route === '/' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '/'
        ? 1
        : lessonRoutes.includes(route)
          ? 0.95
          : 0.7,
      alternates: {
        languages: {
          en: new URL(localizedPath('en', route), siteUrl).toString(),
          es: new URL(localizedPath('es', route), siteUrl).toString()
        }
      }
    }))
  );
}
