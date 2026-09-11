import type { MetadataRoute } from 'next';

import { clientEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing transactional or private belongs in an index.
      disallow: ['/admin', '/account', '/checkout', '/cart', '/order', '/api', '/search'],
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
