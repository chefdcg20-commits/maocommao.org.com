'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FiHeart, FiMenu, FiX } from 'react-icons/fi';

const links = [
  ['Quem somos', '/#quem-somos'],
  ['Aulas', '/#aulas'],
  ['Impacto', '/#impacto'],
  ['Ações', '/#acoes'],
  ['Equipe', '/#equipe'],
  ['Diário', '/diario/'],
  ['Transparência', '/#transparencia'],
  ['Contato', '/#contato']
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-site flex min-h-24 items-center justify-between gap-4">
        <a href="/#inicio" className="focus-ring flex items-center gap-3 rounded-md" aria-label="Ir para o início">
          <Image
            src="/images/logo-mao-com-mao.jpg"
            alt="Logotipo Mão com Mão Jiu-Jitsu"
            width={72}
            height={72}
            priority
            className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <span>
            <strong className="block text-lg leading-none text-brand-900">MÃO COM MÃO</strong>
            <small className="text-[0.68rem] font-bold tracking-[0.2em] text-brand-600">PROJETO SOCIAL</small>
          </span>
        </a>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navegação principal">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="focus-ring rounded text-sm font-bold text-slate-700 transition hover:text-brand-700">
              {label}
            </a>
          ))}
          <a href="/#doacao" className="focus-ring inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-black text-brand-900 transition hover:-translate-y-0.5 hover:shadow-lg">
            <FiHeart aria-hidden /> Doe agora
          </a>
        </nav>

        <button
          type="button"
          className="focus-ring grid h-11 w-11 place-items-center rounded-lg border border-slate-300 text-xl lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-5 lg:hidden" aria-label="Navegação móvel">
          <div className="container-site flex flex-col gap-1">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="focus-ring rounded-lg px-3 py-3 font-bold text-slate-800 hover:bg-brand-50">
                {label}
              </a>
            ))}
            <a href="/#doacao" onClick={() => setOpen(false)} className="focus-ring mt-3 rounded-lg bg-gold px-4 py-3 text-center font-black text-brand-900">
              Fazer uma doação
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
