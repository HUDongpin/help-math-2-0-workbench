import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {
  isPublicRouteProductionAuthorized,
  isPublicRouteProductionIndexable,
  publicRouteCatalogRows,
} from '@/lib/public-launch-manifest.server';
import {getSiteUrl} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const productionEnvironment = {
    ...process.env,
    NODE_ENV: 'production',
    VERCEL_ENV: 'production',
  };
  const {robotDisallow} = resolvePublicCourseDiscovery({
    availableLessonRoutes: availableLearningLessons(
      productionEnvironment,
    ).map(({href}) =>
      href.split('?')[0]!
    ),
  });
  const publicRoutes = publicRouteCatalogRows();
  const homeAuthorized = isPublicRouteProductionIndexable('/');
  const sitemapAuthorized = isPublicRouteProductionAuthorized('/sitemap.xml');
  const unauthorizedPublicPaths = publicRoutes.flatMap((route) =>
    [route.paths.en, route.paths.es].flatMap((routePath) => {
      if (routePath === null || routePath === '/robots.txt') return [];
      const authorized = isPublicRouteProductionAuthorized(route.paths.en);
      const indexable = route.kind === 'machine-route'
        || isPublicRouteProductionIndexable(route.paths.en);
      return authorized && indexable ? [] : [routePath];
    })
  );
  const disallow = [...new Set([
    ...(!homeAuthorized ? ['/'] : []),
    ...unauthorizedPublicPaths,
    ...robotDisallow,
    '/api/',
    '/about',
    '/approach',
    '/curriculum',
    '/research',
    '/resources',
    '/library',
    '/demos',
    '/login',
    '/contact',
    '/migration-status',
    '/reference/',
    '/es/demos/conversion-1-2',
    '/es/demos/conversion-1-4',
    '/flash-assets/',
  ])];

  return {
    rules: {
      userAgent: '*',
      ...(homeAuthorized ? {allow: '/'} : {}),
      disallow,
    },
    ...(sitemapAuthorized
      ? {sitemap: new URL('/sitemap.xml', siteUrl).toString()}
      : {}),
    host: siteUrl.origin
  };
}
