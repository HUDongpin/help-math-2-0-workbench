import type {MetadataRoute} from 'next';
import {headers} from 'next/headers';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl} from '@/lib/site';
import {isControlledCurrentJsPreview} from '@/lib/controlled-current-js-preview';
import {
  PRODUCTION_ROBOTS_DISALLOW,
  productionSearchIndexingEnabled,
  searchIndexingAllowedForHost,
} from '@/lib/search-indexing';

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (productionSearchIndexingEnabled()) {
    const host = (await headers()).get('host');
    if (!searchIndexingAllowedForHost(host)) return {rules: {userAgent: '*', disallow: '/'}};
    const siteUrl = getSiteUrl();
    return {
      rules: {userAgent: '*', allow: '/', disallow: [...PRODUCTION_ROBOTS_DISALLOW]},
      sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    };
  }
  if (isControlledCurrentJsPreview()) return {rules: {userAgent: '*', disallow: '/'}};
  const siteUrl = getSiteUrl();
  const {robotDisallow} = resolvePublicCourseDiscovery({
    availableLessonRoutes: availableLearningLessons().map(({href}) =>
      href.split('?')[0]!
    ),
  });

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/about',
        '/approach',
        '/curriculum',
        '/research',
        '/resources',
        '/support',
        '/library',
        '/demos',
        '/login',
        '/contact',
        '/migration-status',
        '/reference/',
        '/es/demos/conversion-1-2',
        '/es/demos/conversion-1-4',
        ...robotDisallow,
        '/flash-assets/'
      ]
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl.origin
  };
}
