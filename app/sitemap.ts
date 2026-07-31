import type { MetadataRoute } from 'next';
import { diarioPosts } from '@/lib/diario';

const siteUrl = 'https://maocommao-org-com.vercel.app';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date('2026-07-31'),
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${siteUrl}/diario/`,
      lastModified: new Date('2026-07-31'),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    ...diarioPosts.map((post) => ({
      url: `${siteUrl}/diario/${post.slug}/`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }))
  ];
}
