import type {MetadataRoute} from 'next';

import {resolvePublicCourseDiscovery} from '@/lib/public-course-discovery';
import {getSiteUrl} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const {g5L4RobotDisallow} = resolvePublicCourseDiscovery({
    g4L3Available: false,
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
        ...g5L4RobotDisallow,
        '/flash-assets/'
      ]
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl.origin
  };
}
