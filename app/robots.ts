import type { MetadataRoute } from 'next';

const siteUrl = 'https://maocommao-org-com.vercel.app';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/cadastro-aluno/', '/chamada/', '/familia/']
    },
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/video-sitemap.xml`]
  };
}
