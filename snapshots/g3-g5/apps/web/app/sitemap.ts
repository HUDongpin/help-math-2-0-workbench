import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl, localizedPath} from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date('2026-08-21T00:00:00.000Z');
  const {lessonRoutes} = resolvePublicCourseDiscovery({
    availableLessonRoutes: availableLearningLessons().map(({href}) =>
      href.split('?')[0]!
    ),
  });
  const routes = ['/', ...lessonRoutes, '/privacy', '/terms'] as const;

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
