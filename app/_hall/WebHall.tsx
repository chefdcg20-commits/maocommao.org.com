"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";

export type Call = (body: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: any }>;
export type Tile = { key: string; icon: string; label: string; hint?: string; badge?: number; href?: string };

const input = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";
const btn = "w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60";
const btn2 = "w-full rounded-xl border border-slate-700 px-5 py-3 font-bold";
const fmt = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

const LINKS: [string, string, string][] = [
  ["💬", "Entrar no grupo do WhatsApp", "https://chat.whatsapp.com/HKVWuTNfP1XImKgvemIzGs?s=cl&p=a&ilr=1&amv=0"],
  ["👤", "Falar com o Daniel", "https://wa.me/5511982984625"],
  ["📸", "Instagram", "https://www.instagram.com/mao.com.mao?igsh=YW1wcGcyd2w2MzR2"],
  ["👍", "Facebook", "https://www.facebook.com/share/1Pf1rx1mYQ/"],
  ["📍", "Como chegar (Google Maps)", "https://maps.app.goo.gl/UwXmbHq4v2GXDK336?g_st=ac"],
  ["🌐", "Site do projeto", "/"],
  ["📄", "Estatuto social (PDF)", "/documentos/estatuto-social-mao-com-mao.pdf"],
];
const PIX = "66.660.999/0001-03";
const RECEIPT = "https://wa.me/5511982984625?text=Ol%C3%A1%2C%20Daniel%21%20Fiz%20uma%20doa%C3%A7%C3%A3o%20para%20o%20Projeto%20M%C3%A3o%20Com%20M%C3%A3o.%20Vou%20enviar%20o%20comprovante%20nesta%20conversa.";

export const COMMON_TILES: Tile[] = [
  { key: "info", icon: "ℹ️", label: "O projeto", hint: "Aulas, ações e documentos" },
  { key: "contact", icon: "🤝", label: "Contato e apoio", hint: "Redes, mapa e PIX" },
];

// Hall de entrada com blocos conforme o perfil.
export function Hall({ name, roleLabel, group, tiles, onPick, onLogout }: { name: string; roleLabel: string; group: string; tiles: Tile[]; onPick: (key: string) => void; onLogout: () => void }) {
  const card = "relative flex min-h-28 flex-col justify-end rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left";
  const inner = (t: Tile) => (
    <>
      <span className="mb-2 text-3xl">{t.icon}</span>
      <span className="font-extrabold">{t.label}</span>
      {t.hint && <span className="text-xs text-slate-400">{t.hint}</span>}
      {!!t.badge && <span className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-amber-400 px-1.5 text-sm font-black text-slate-950">{t.badge}</span>}
    </>
  );
  const grid = (list: Tile[]) => (
    <div className="grid grid-cols-2 gap-3">
      {list.map((t) => t.href
        ? <a key={t.key} href={t.href} target="_blank" rel="noopener noreferrer" className={card}>{inner(t)}</a>
        : <button key={t.key} onClick={() => onPick(t.key)} className={card}>{inner(t)}</button>)}
    </div>
  );
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="" className="h-14 w-14 rounded-full" />
        <div className="flex-1">
          <h1 className="text-2xl font-black text-amber-400">Olá{name ? `, ${name.split(" ")[0]}` : ""}!</h1>
          <p className="text-sm text-slate-400">{roleLabel} · Projeto Mão Com Mão</p>
        </div>
        <button onClick={onLogout} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold">Sair</button>
      </header>
      <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{group}</p>
      {grid(tiles)}
      <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Projeto</p>
      {grid(COMMON_TILES)}
    </div>
  );
}

export function Frame({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  return (
    <div className="space-y-4 pb-10">
      <button onClick={onBack} className="font-extrabold text-amber-400">‹ Início</button>
      {children}
    </div>
  );
}

export function InfoView({ call, canEdit }: { call: Call; canEdit: boolean }) {
  const [sections, setSections] = useState<any[] | null>(null);
  const [editing, setEditing] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await call({ action: "content" });
    if (!result.ok) return setError("Não foi possível carregar.");
    setError(""); setSections(result.data.sections);
  }, [call]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    const result = await call({ action: "save_content", slug: editing, title, body });
    if (!result.ok) return setError("Não foi possível salvar.");
    setEditing(""); load();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">O projeto</h2>
      <p className="text-sm text-slate-400">Mão Com Mão · Diadema, SP</p>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      {sections === null && !error && <p className="text-slate-400">Carregando...</p>}
      {sections?.map((s) => editing === s.slug ? (
        <div key={s.slug} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <input className={input} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          <textarea className={`${input} min-h-48`} value={body} maxLength={6000} onChange={(e) => setBody(e.target.value)} />
          <button className={btn} onClick={save}>Salvar</button>
          <button className={btn2} onClick={() => setEditing("")}>Cancelar</button>
        </div>
      ) : (
        <div key={s.slug} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-lg font-black text-amber-400">{s.title}</h3>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{s.body}</p>
          {canEdit && <button className="mt-3 text-sm text-slate-400" onClick={() => { setEditing(s.slug); setTitle(s.title); setBody(s.body); }}>✎ Editar este texto</button>}
        </div>
      ))}
    </div>
  );
}

export function NewsList({ call, action }: { call: Call; action: string }) {
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { call({ action }).then((r) => setList(r.ok ? r.data.announcements : [])); }, [call, action]);
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">Avisos</h2>
      {list && !list.length && <p className="p-6 text-center text-slate-400">Nenhum aviso no momento.</p>}
      {list?.map((a) => (
        <div key={a.id} className="space-y-1 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="font-extrabold">{a.title}</p>
          <p className="text-sm text-slate-400">{fmt(a.created_at)}</p>
          <p className="whitespace-pre-line">{a.body}</p>
        </div>
      ))}
    </div>
  );
}

export function ContactView() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">Contato e apoio</h2>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <p className="font-extrabold">Ginásio Poliesportivo Rômulo Duncan Arantes</p>
        <p className="text-sm text-slate-400">Av. Casa Grande, 485 — Diadema, SP</p>
        <p className="mt-1 text-sm text-slate-400">CNPJ: {PIX}</p>
      </div>
      {LINKS.map(([icon, label, url]) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <span className="text-2xl">{icon}</span><span className="flex-1">{label}</span><span className="text-slate-500">›</span>
        </a>
      ))}
      <div className="space-y-2 rounded-2xl border border-amber-400 bg-slate-900 p-3">
        <p className="font-extrabold text-amber-400">Apoie o projeto com PIX</p>
        <p className="text-sm text-slate-400">Chave PIX (CNPJ da associação).</p>
        <p className="select-all text-2xl font-black">{PIX}</p>
        <a href={RECEIPT} target="_blank" rel="noopener noreferrer" className={`${btn} block text-center`}>Enviar comprovante no WhatsApp</a>
      </div>
    </div>
  );
}
