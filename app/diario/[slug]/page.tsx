import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import { Header } from '@/components/Header';
import { diarioPosts, getDiarioPost } from '@/lib/diario';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return diarioPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getDiarioPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Diário Mão Com Mão`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [{ url: post.image }]
    }
  };
}

export default async function DiarioPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getDiarioPost(slug);

  if (!post) {
    notFound();
  }

  const articleUrl = `https://maocommao-org-com.vercel.app/diario/${post.slug}/`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: `https://maocommao-org-com.vercel.app${post.image}`,
    author: {
      '@type': 'Organization',
      name: 'Projeto Social Mão Com Mão'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Projeto Social Mão Com Mão'
    },
    mainEntityOfPage: articleUrl
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50">
        <article>
          <header className="bg-brand-900 py-14 text-white sm:py-20">
            <div className="container-site">
              <Link href="/diario/" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-bold text-blue-100 hover:text-white">
                <FiArrowLeft aria-hidden /> Voltar ao Diário
              </Link>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-bold">
                <span className="rounded-full bg-gold px-3 py-1 text-brand-900">{post.category}</span>
                <span className="flex items-center gap-2 text-blue-100">
                  <FiCalendar aria-hidden />
                  Publicado em <time dateTime={post.publishedAt}>{post.publishedLabel}</time>
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{post.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-blue-100">{post.excerpt}</p>
            </div>
          </header>

          <div className="container-site py-10 sm:py-14">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-soft">
              <Image
                src={post.image}
                alt={post.imageAlt}
                width={post.imageOrientation === 'portrait' ? 960 : 1280}
                height={post.imageOrientation === 'portrait' ? 1280 : 850}
                priority
                className={post.imageOrientation === 'portrait' ? 'max-h-[55rem] w-full bg-slate-950 object-contain' : 'aspect-[3/2] w-full object-cover'}
              />
              <div className="p-7 sm:p-12">
                <div className="rounded-2xl bg-brand-50 p-5 text-brand-900">
                  <strong className="block text-sm uppercase tracking-[0.15em] text-brand-600">Data do retorno</strong>
                  <time dateTime={post.eventDate} className="mt-2 block text-xl font-black">{post.eventDateLabel}</time>
                </div>
                <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-700">
                  {post.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <a href="https://wa.me/5511982984625" target="_blank" rel="noopener noreferrer" className="focus-ring mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-400">
                  <FiMessageCircle aria-hidden /> Tirar dúvidas com Daniel
                </a>
              </div>
            </div>
          </div>
        </article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </main>
      <footer className="bg-slate-950 py-10 text-slate-300">
        <div className="container-site flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div><strong className="text-lg text-white">Projeto Social Mão Com Mão</strong><p className="mt-1 text-sm">Jiu-jítsu, solidariedade e transformação social em Diadema.</p></div>
          <p className="text-sm">© 2026 Projeto Social Mão Com Mão.</p>
        </div>
      </footer>
    </>
  );
}
