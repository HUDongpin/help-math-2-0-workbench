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
        '/es/demos/conversion-1-2',
        '/es/demos/conversion-1-4',
        '/courses/5/4',
        '/es/courses/5/4',
        '/flash-assets/'
      ]
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl.origin
  };
}
