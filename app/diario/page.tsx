import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { Header } from '@/components/Header';
import { diarioPosts } from '@/lib/diario';

export const metadata: Metadata = {
  title: 'Diário Mão Com Mão | Notícias da nossa comunidade',
  description:
    'Notícias, comunicados, eventos e conquistas da comunidade do Projeto Social Mão Com Mão, em Diadema.'
};

export default function DiarioPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-brand-900 py-16 text-white sm:py-20">
          <div className="container-site">
            <p className="font-black uppercase tracking-[0.2em] text-gold">Nossa comunidade em movimento</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">Diário Mão Com Mão</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-blue-100">
              Notícias, comunicados, eventos e conquistas que fazem parte da história do nosso projeto.
            </p>
          </div>
        </section>

        <section className="section-space bg-slate-50">
          <div className="container-site">
            <div className="grid gap-7 md:grid-cols-2">
              {diarioPosts.map((post) => (
                <article key={post.slug} className="overflow-hidden rounded-3xl bg-white shadow-soft">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    width={900}
                    height={600}
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                      <span className="rounded-full bg-gold px-3 py-1 text-brand-900">{post.category}</span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <FiCalendar aria-hidden />
                        <time dateTime={post.publishedAt}>{post.publishedLabel}</time>
                      </span>
                    </div>
                    <h2 className="mt-5 text-2xl font-black text-brand-900">{post.title}</h2>
                    <p className="mt-3 leading-relaxed text-slate-600">{post.excerpt}</p>
                    <Link href={`/diario/${post.slug}/`} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-black text-white transition hover:bg-brand-800">
                      Ler notícia <FiArrowRight aria-hidden />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
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
