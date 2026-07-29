'use client';

import { FormEvent, useState } from 'react';
import { FiCheckCircle, FiSend } from 'react-icons/fi';

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center text-emerald-900" role="status">
        <FiCheckCircle className="mx-auto mb-3 text-4xl" aria-hidden />
        <h3 className="text-xl font-black">Mensagem preparada!</h3>
        <p className="mt-2 text-sm">Na publicação definitiva, este formulário poderá ser conectado ao e-mail oficial ou ao WhatsApp do projeto.</p>
        <button type="button" onClick={() => setSent(false)} className="focus-ring mt-5 rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white">
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:p-8">
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
        <FiSend aria-hidden /> Enviar mensagem
      </button>
    </form>
  );
}
