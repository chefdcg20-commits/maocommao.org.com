import { diarioPosts } from '@/lib/diario';

const siteUrl = 'https://maocommao-org-com.vercel.app';

export const dynamic = 'force-static';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const entries = diarioPosts
    .filter((post) => post.youtubeId)
    .map((post) => {
      const youtubeId = post.youtubeId!;
      const publicationDate =
        post.videoPublishedAt ?? `${post.publishedAt}T12:00:00-03:00`;

      return `  <url>
    <loc>${siteUrl}/diario/${escapeXml(post.slug)}/</loc>
    <video:video>
      <video:thumbnail_loc>${siteUrl}${escapeXml(post.image)}</video:thumbnail_loc>
      <video:title>${escapeXml(post.title)}</video:title>
      <video:description>${escapeXml(post.excerpt)}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${youtubeId}</video:player_loc>
      <video:publication_date>${publicationDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
