'use client';

import { useEffect } from 'react';

// Animacoes da pagina inicial: entrada ao rolar, icones flutuando, brilho no botao de doacao,
// contagem dos numeros e efeito ao passar o mouse nos cartoes. Nao altera textos, fotos nem a estrutura.
// Com "reduzir movimento" ligado no aparelho, nada disso e aplicado.
export function MotionEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    root.classList.add('motion-ready');
    const cleanups: Array<() => void> = [];

    // 1) Icones grandes flutuam suavemente (cada um com um atraso diferente).
    document.querySelectorAll<SVGElement>('main section svg').forEach((icon, index) => {
      const cls = icon.getAttribute('class') || '';
      if (/\btext-(2xl|3xl|4xl)\b/.test(cls)) {
        icon.classList.add('icon-float');
        icon.style.setProperty('--float-delay', `${(index % 6) * 0.35}s`);
      }
    });

    // 2) Cartoes com icone ganham efeito ao passar o mouse.
    document.querySelectorAll<HTMLElement>('main section [class*="rounded-2xl"], main section [class*="rounded-3xl"], main section article').forEach((card) => {
      if (card.querySelector('svg')) card.classList.add('card-fx');
    });

    // 3) Botao principal de doacao do topo pulsa de leve.
    document.querySelector<HTMLElement>('#inicio a[href="#doacao"]')?.classList.add('cta-glow');

    // 4) Entrada ao rolar: blocos e cartoes aparecem subindo, em sequencia.
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main section:not(#inicio) .container-site > *, main section:not(#inicio) .container-site .grid > *, main > section.bg-brand-800 .grid > *'
      )
    );
    const seen = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add('reveal-in');
          observer.unobserve(el);
          countUp(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
      const position = Math.max(0, siblings.indexOf(el));
      el.style.setProperty('--reveal-delay', `${Math.min(position, 6) * 90}ms`);
      el.classList.add('reveal');
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add('reveal-in'); // ja esta na tela: nao esconde
        countUp(el);
      } else {
        observer.observe(el);
      }
    });
    cleanups.push(() => observer.disconnect());

    return () => {
      cleanups.forEach((fn) => fn());
      root.classList.remove('motion-ready');
    };
  }, []);

  return null;
}

// Numeros do impacto contam de 0 ate o valor final quando aparecem.
function countUp(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('strong').forEach((node) => {
    const text = node.textContent?.trim() || '';
    if (!/^\d{1,4}$/.test(text) || !/\btext-5xl\b/.test(node.className)) return;
    if (node.dataset.counted) return;
    node.dataset.counted = '1';
    const target = Number(text);
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
      else node.textContent = text;
    };
    node.textContent = '0';
    requestAnimationFrame(tick);
  });
}
