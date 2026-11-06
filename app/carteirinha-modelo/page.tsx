import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiCheckCircle, FiShield, FiUser } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'Modelo da Carteirinha | Projeto Mão Com Mão',
  description: 'Modelo demonstrativo da carteirinha dos alunos do Projeto Mão Com Mão no padrão ID-1.'
};

const cardClass = 'member-card relative aspect-[85.6/53.98] w-full overflow-hidden rounded-[1.35rem] border border-amber-400/35 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white shadow-2xl';

function Logo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/images/logo-mao-com-mao-circular-carteirinha.png"
      alt="Símbolo circular do Projeto Mão Com Mão"
      width={192}
      height={192}
      className={`rounded-full object-cover ${className}`}
      priority
    />
  );
}

export default function CarteirinhaModeloPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:py-16">
      <style>{`
        @page { size: 85.6mm 53.98mm; margin: 0; }
        @media print {
          body { background: #fff !important; }
          .screen-only { display: none !important; }
          .cards-grid { display: block !important; margin: 0 !important; }
          .member-card { width: 85.6mm !important; height: 53.98mm !important; margin: 0 !important; border-radius: 3mm !important; break-after: page; page-break-after: always; box-shadow: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="screen-only">
          <Link href="/" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200">
            <FiArrowLeft aria-hidden /> Voltar ao site
          </Link>
          <div className="mt-8 max-w-3xl">
            <span className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">Modelo demonstrativo — padrão ID-1</span>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">Carteirinha do aluno</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              A visualização está ampliada para facilitar a conferência. Na impressão, cada lado terá exatamente <strong className="text-white">85,60 × 53,98 mm</strong>, o mesmo tamanho de um cartão bancário.
            </p>
          </div>
        </div>

        <div className="cards-grid mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-label="Frente da carteirinha" className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2.5%] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="flex h-full flex-col p-[5%]">
              <div className="flex items-center gap-[3%]">
                <Logo className="h-[clamp(3.2rem,8vw,4.8rem)] w-[clamp(3.2rem,8vw,4.8rem)] border-2 border-amber-400" />
                <div>
                  <p className="text-[clamp(0.42rem,1vw,0.68rem)] font-black uppercase tracking-[0.2em] text-amber-400">Associação Mão Com Mão</p>
                  <h2 className="text-[clamp(0.9rem,2.2vw,1.45rem)] font-black leading-tight">JIU-JITSU</h2>
                  <p className="text-[clamp(0.45rem,1.1vw,0.72rem)] text-slate-300">Carteirinha de aluno</p>
                </div>
              </div>

              <div className="mt-[4%] grid flex-1 grid-cols-[27%_1fr] gap-[5%]">
                <div className="flex aspect-[3/4] items-center justify-center self-center rounded-[12%] border-[3px] border-white/80 bg-gradient-to-b from-slate-200 to-slate-400 text-slate-600 shadow-lg">
                  <FiUser className="h-[45%] w-[45%]" aria-hidden />
                </div>
                <dl className="grid content-center grid-cols-2 gap-x-[4%] gap-y-[5%]">
                  <div className="col-span-2"><dt className="text-[clamp(0.4rem,0.9vw,0.62rem)] font-black uppercase tracking-widest text-amber-400">Aluno</dt><dd className="text-[clamp(0.78rem,1.8vw,1.2rem)] font-black leading-tight">ALUNO EXEMPLO</dd></div>
                  <div><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Matrícula</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">MCM-2026-001</dd></div>
                  <div><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Validade</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">31/12/2027</dd></div>
                  <div className="col-span-2"><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Nascimento</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">00/00/0000</dd></div>
                </dl>
              </div>

              <div className="flex items-center justify-between border-t border-white/15 pt-[2%] text-[clamp(0.38rem,0.8vw,0.58rem)] text-slate-300">
                <span className="inline-flex items-center gap-1"><FiShield className="text-amber-400" aria-hidden /> Documento interno da associação</span>
                <span className="font-black text-amber-400">OSS!</span>
              </div>
            </div>
          </section>

          <section aria-label="Verso da carteirinha" className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2.5%] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="flex h-full flex-col p-[5%]">
              <div className="flex items-start justify-between gap-[4%]">
                <div>
                  <p className="text-[clamp(0.42rem,1vw,0.68rem)] font-black uppercase tracking-[0.2em] text-amber-400">Projeto Social</p>
                  <h2 className="text-[clamp(0.9rem,2.2vw,1.45rem)] font-black">Mão Com Mão</h2>
                  <p className="max-w-[22rem] text-[clamp(0.42rem,1vw,0.68rem)] leading-relaxed text-slate-300">Jiu-jítsu, disciplina, respeito e transformação social em Diadema.</p>
                </div>
                <Logo className="h-[clamp(3rem,7vw,4.4rem)] w-[clamp(3rem,7vw,4.4rem)]" />
              </div>

              <div className="mt-[4%] grid grid-cols-[1fr_23%] items-center gap-[4%] rounded-xl border border-white/10 bg-white/5 p-[4%]">
                <div>
                  <p className="text-[clamp(0.4rem,0.9vw,0.62rem)] font-black uppercase tracking-widest text-amber-400">Aprovação do Sensei</p>
                  <div className="mt-[5%] border-b border-white/60 pb-[1%] text-center font-serif text-[clamp(0.75rem,1.8vw,1.15rem)] italic text-slate-300">assinatura</div>
                  <p className="mt-[1.5%] text-center text-[clamp(0.62rem,1.4vw,0.95rem)] font-black">Joaquim Guedes</p>
                  <p className="text-center text-[clamp(0.4rem,0.9vw,0.62rem)] text-slate-400">Sensei do Projeto Mão Com Mão</p>
                </div>
                <div className="rounded-lg bg-white p-[7%] text-center shadow-lg">
                  <Image src="/images/qr-site-mao-com-mao.png" alt="QR Code para acessar o site do Projeto Mão Com Mão" width={400} height={400} className="aspect-square w-full" />
                  <span className="mt-[3%] block text-[clamp(0.32rem,0.7vw,0.5rem)] font-black uppercase tracking-wider text-slate-900">Acesse o site</span>
                </div>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 text-[clamp(0.36rem,0.78vw,0.55rem)]">
                <span className="inline-flex items-center gap-1 font-bold"><FiCheckCircle className="text-emerald-400" aria-hidden /> Cadastro aprovado</span>
                <span className="text-right text-slate-400">Av. Casa Grande, 485 — Diadema/SP<br />Ginásio Rômulo Ducan Arante</span>
              </div>
            </div>
          </section>
        </div>

        <div className="screen-only mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-relaxed text-amber-100">
          A graduação não aparece nesta primeira versão. Ela poderá ser adicionada futuramente na renovação da carteirinha.
        </div>
      </div>
    </main>
  );
}
