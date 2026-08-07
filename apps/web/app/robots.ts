import type {MetadataRoute} from 'next';

import {getSiteUrl} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/migration-status',
        '/reference/',
        '/executive-preview',
        '/es/executive-preview',
        '/demos/conversion-1-2',
        '/demos/conversion-1-4',
        '/es/demos/conversion-1-2',
        '/es/demos/conversion-1-4',
        '/courses/4/3',
        '/courses/5/4',
        '/es/courses/4/3',
        '/es/courses/5/4',
        '/flash-assets/'
      ]
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl.origin
  };
}
