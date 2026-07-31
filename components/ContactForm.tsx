'use client';

import { FormEvent } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const DANIEL_WHATSAPP = '5511982984625';

export function ContactForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = [
      'Olá, Daniel! Vim pelo site do Projeto Mão com Mão.',
      '',
      `Nome: ${form.get('nome')}`,
      `Contato: ${form.get('contato')}`,
      `Assunto: ${form.get('assunto')}`,
      '',
      `Mensagem: ${form.get('mensagem')}`
    ].join('\n');

    window.open(
      `https://wa.me/${DANIEL_WHATSAPP}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:p-8">
      <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <strong className="block">Resposta rápida pelo WhatsApp</strong>
        Ao enviar, sua mensagem será aberta diretamente no WhatsApp do secretário Daniel Guedes.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Nome
          <input required name="nome" className="focus-ring rounded-xl border border-slate-300 px-4 py-3 font-normal" placeholder="Seu nome" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          E-mail ou telefone
          <input required name="contato" className="focus-ring rounded-xl border border-slate-300 px-4 py-3 font-normal" placeholder="Como podemos responder?" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Assunto
        <select name="assunto" className="focus-ring rounded-xl border border-slate-300 px-4 py-3 font-normal">
          <option>Quero conhecer o projeto</option>
          <option>Quero ser patrocinador</option>
          <option>Quero fazer uma doação</option>
          <option>Quero matricular um aluno</option>
          <option>Outro assunto</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Mensagem
        <textarea required name="mensagem" rows={5} className="focus-ring resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal" placeholder="Conte como podemos ajudar." />
      </label>
      <button type="submit" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-4 font-black text-white transition hover:bg-brand-800">
        <FaWhatsapp aria-hidden className="text-xl" /> Enviar pelo WhatsApp
      </button>
    </form>
  );
}
