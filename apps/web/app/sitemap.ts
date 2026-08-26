import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {
  isPublicRouteProductionIndexable,
  publicLessonCatalog,
  publicRouteCatalogRows,
} from '@/lib/public-launch-manifest.server';
import {getSiteUrl} from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date('2026-08-21T00:00:00.000Z');
  const productionEnvironment = {
    ...process.env,
    NODE_ENV: 'production',
    VERCEL_ENV: 'production',
  };
  const availableLessonKeys = new Set(availableLearningLessons(
    productionEnvironment,
  ).map(({grade, lesson}) => `${grade}-${lesson}`));
  const publicDocuments = publicRouteCatalogRows().flatMap((route) =>
    route.kind === 'localized-page'
      && isPublicRouteProductionIndexable(route.paths.en)
      ? [{
          en: route.paths.en,
          es: route.paths.es,
          priority: route.routeId === 'home' ? 1 : 0.7,
        }]
      : []
  );
  const publicLessons = publicLessonCatalog().flatMap((lesson) =>
    availableLessonKeys.has(`${lesson.grade}-${lesson.lesson}`)
      ? [{en: lesson.routes.en, es: lesson.routes.es, priority: 0.95}]
      : []
  );

  return [...publicDocuments, ...publicLessons].flatMap((route) =>
    (['en', 'es'] as const).flatMap((locale) => {
      const localizedRoute = route[locale];
      if (localizedRoute === null) return [];
      return [{
        url: new URL(localizedRoute, siteUrl).toString(),
        lastModified,
        changeFrequency: route.priority === 1
          ? ('weekly' as const)
          : ('monthly' as const),
        priority: route.priority,
        alternates: {
          languages: {
            en: new URL(route.en, siteUrl).toString(),
            es: new URL(route.es ?? route.en, siteUrl).toString(),
          },
        },
      }];
    })
  );
}
