'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiCopy, FiHeart, FiPackage, FiShield } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const PIX_KEY = '66.660.999/0001-03';
const WHATSAPP_URL =
  'https://wa.me/5511982984625?text=Ol%C3%A1%2C%20Daniel%21%20Fiz%20uma%20doa%C3%A7%C3%A3o%20para%20o%20Projeto%20M%C3%A3o%20Com%20M%C3%A3o.%20Vou%20enviar%20o%20comprovante%20nesta%20conversa.';

export function PixDonation() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
    } catch {
      const field = document.createElement('textarea');
      field.value = PIX_KEY;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }

    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 3000);
  }

  return (
    <section id="doacao" className="section-space scroll-mt-28 bg-slate-950 text-white">
      <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <FiHeart className="text-4xl text-gold" aria-hidden />
          <p className="mt-4 font-black uppercase tracking-[0.2em] text-gold">Agora podemos receber doações</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-5xl">Ajude o Projeto Mão Com Mão a transformar mais vidas.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Sua contribuição ajuda nas aulas, materiais esportivos, competições, alimentação e no crescimento do projeto. Doe por PIX e envie o comprovante pelo WhatsApp.
          </p>
          <a href="#contato" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-4 font-black text-white transition hover:bg-white hover:text-brand-900">
            <FiPackage aria-hidden /> Quero doar materiais
          </a>
        </div>

        <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
              <FiShield className="text-2xl" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-600">PIX oficial da associação</p>
              <h3 className="mt-1 text-2xl font-black text-brand-900">Doe em poucos passos</h3>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border-2 border-brand-100 bg-brand-50 p-5">
            <span className="text-sm font-bold text-slate-600">Chave PIX — CNPJ</span>
            <strong className="mt-2 block break-all text-2xl font-black tracking-wide text-brand-900 sm:text-3xl">{PIX_KEY}</strong>
            <button
              type="button"
              onClick={copyPix}
              className={`focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black transition ${copied ? 'bg-emerald-500 text-slate-950' : 'bg-gold text-brand-900 hover:bg-yellow-300'}`}
              aria-live="polite"
            >
              {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
              {copied ? 'PIX copiado!' : 'Copiar chave PIX'}
            </button>
          </div>

          <ol className="mt-7 grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
            {[
              ['1', 'Copie a chave', 'Use o botão acima.'],
              ['2', 'Faça o PIX', 'Cole a chave no aplicativo do seu banco.'],
              ['3', 'Envie o comprovante', 'Abra o WhatsApp e anexe a imagem.']
            ].map(([step, title, description]) => (
              <li key={step} className="rounded-2xl bg-slate-50 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 font-black text-white">{step}</span>
                <strong className="mt-3 block text-brand-900">{title}</strong>
                <span className="mt-1 block leading-relaxed">{description}</span>
              </li>
            ))}
          </ol>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-7 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-500 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-400"
          >
            <FaWhatsapp className="text-2xl" aria-hidden /> Enviar comprovante no WhatsApp
          </a>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            Antes de concluir a transferência, confirme no seu banco os dados da Associação Mão Com Mão.
          </p>
        </div>
      </div>
    </section>
  );
}
