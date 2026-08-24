import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
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
