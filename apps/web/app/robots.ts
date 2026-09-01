import type {MetadataRoute} from 'next';

import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const {robotDisallow} = resolvePublicCourseDiscovery({
    availableLessonRoutes: availableLearningLessons()
      .filter(({moduleCode}) => moduleCode === undefined)
      .map(({href}) =>
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
        // G6-G8 shared module routes are local engineering previews only.
        '/courses/6/',
        '/courses/7/',
        '/courses/8/',
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
