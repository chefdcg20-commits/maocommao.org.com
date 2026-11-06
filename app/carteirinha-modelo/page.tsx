import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiCheckCircle, FiShield, FiUser } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'Modelo da Carteirinha | Projeto Mão Com Mão',
  description: 'Modelo demonstrativo da carteirinha dos alunos do Projeto Mão Com Mão.'
};

function PhotoPlaceholder() {
  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border-4 border-white/80 bg-gradient-to-b from-slate-200 to-slate-400 text-slate-600 shadow-lg">
      <FiUser className="text-7xl" aria-hidden />
    </div>
  );
}

export default function CarteirinhaModeloPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200">
          <FiArrowLeft aria-hidden /> Voltar ao site
        </Link>

        <div className="mt-8 max-w-3xl">
          <span className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">Modelo demonstrativo</span>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">Carteirinha do aluno</h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Exemplo sem dados reais. A carteirinha definitiva será gerada somente depois da conferência do cadastro e da assinatura do Sensei Joaquim Guedes.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-label="Frente da carteirinha" className="overflow-hidden rounded-[2rem] border border-amber-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-2xl">
            <div className="h-3 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-amber-400 bg-black shadow-lg">
                  <Image src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Símbolo circular do Projeto Mão Com Mão" width={192} height={192} className="h-full w-full object-cover" priority />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-400">Associação Mão Com Mão</p>
                  <h2 className="mt-1 text-2xl font-black">JIU-JITSU</h2>
                  <p className="text-sm text-slate-300">Carteirinha de aluno</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-[8rem_1fr] gap-6 sm:grid-cols-[10rem_1fr]">
                <PhotoPlaceholder />
                <dl className="space-y-4">
                  <div><dt className="text-xs font-black uppercase tracking-widest text-amber-400">Aluno</dt><dd className="mt-1 text-xl font-black">ALUNO EXEMPLO</dd></div>
                  <div><dt className="text-xs font-black uppercase tracking-widest text-amber-400">Matrícula</dt><dd className="mt-1 font-bold">MCM-2026-001</dd></div>
                  <div><dt className="text-xs font-black uppercase tracking-widest text-amber-400">Nascimento</dt><dd className="mt-1 font-bold">00/00/0000</dd></div>
                  <div><dt className="text-xs font-black uppercase tracking-widest text-amber-400">Validade</dt><dd className="mt-1 font-bold">31/12/2027</dd></div>
                </dl>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2"><FiShield className="text-amber-400" aria-hidden /> Documento interno da associação</span>
                <span className="font-black text-amber-400">OSS!</span>
              </div>
            </div>
          </section>

          <section aria-label="Verso da carteirinha" className="overflow-hidden rounded-[2rem] border border-amber-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-2xl">
            <div className="h-3 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="flex min-h-full flex-col p-7 sm:p-9">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">Projeto Social</p>
                  <h2 className="mt-2 text-2xl font-black">Mão Com Mão</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">Jiu-jítsu, disciplina, respeito e transformação social em Diadema.</p>
                </div>
                <Image src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="" width={112} height={112} className="h-20 w-20 rounded-full object-cover" />
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-black uppercase tracking-widest text-amber-400">Aprovação do Sensei</p>
                <div className="mt-8 border-b border-white/60 pb-2 text-center font-serif text-2xl italic text-slate-300">assinatura</div>
                <p className="mt-3 text-center text-lg font-black">Joaquim Guedes</p>
                <p className="text-center text-sm text-slate-400">Sensei do Projeto Mão Com Mão</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-white/5 p-4"><span className="block text-xs font-black uppercase text-amber-400">Situação</span><span className="mt-2 inline-flex items-center gap-2 font-bold"><FiCheckCircle aria-hidden /> Cadastro aprovado</span></div>
                <div className="rounded-xl bg-white/5 p-4"><span className="block text-xs font-black uppercase text-amber-400">Emissão</span><span className="mt-2 block font-bold">05/11/2026</span></div>
              </div>

              <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-slate-500">Av. Casa Grande, 485 — Diadema/SP<br />Ginásio Rômulo Ducan Arante</p>
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-relaxed text-amber-100">
          A graduação não aparece nesta primeira versão, conforme solicitado. Ela poderá ser adicionada futuramente na renovação da carteirinha.
        </div>
      </div>
    </main>
  );
}
