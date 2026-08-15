import type {MetadataRoute} from 'next';

import {isG4L3LearningEntryAvailable} from '@/lib/g4-l3-learning-entry.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl, localizedPath} from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date('2026-08-16T00:00:00.000Z');
  const {lessonRoutes} = resolvePublicCourseDiscovery({
    g4L3Available: isG4L3LearningEntryAvailable(),
  });
  const routes = ['/', ...lessonRoutes, '/privacy', '/terms'] as const;

  return routes.flatMap((route) =>
    (['en', 'es'] as const).map((locale) => ({
      url: new URL(localizedPath(locale, route), siteUrl).toString(),
      lastModified,
      changeFrequency: route === '/' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '/'
        ? 1
        : route === '/courses/4/3' || route === '/courses/5/4'
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
