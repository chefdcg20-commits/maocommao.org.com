"use client";

import { FormEvent, useEffect, useState } from "react";

const ROOT = process.env.NEXT_PUBLIC_FUNCTIONS_URL || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/";
const APP_PACKAGE = "org.maocommao.chamada";
const APP_SCHEME = "maocommao";
const WHATSAPP = "https://wa.me/5511982984625?text=Ol%C3%A1%2C%20Daniel%21%20Sou%20professor%20e%20preciso%20do%20acesso%20ao%20aplicativo%20do%20Projeto%20M%C3%A3o%20Com%20M%C3%A3o.";

const input = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";
const btn = "block w-full rounded-xl bg-amber-400 px-5 py-3 text-center font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60";
const btn2 = "block w-full rounded-xl border border-slate-700 px-5 py-3 text-center font-bold hover:border-amber-400";

async function post(fn: string, body: Record<string, unknown>, token?: string) {
  const response = await fetch(`${ROOT}${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

const save = (key: string, value: string, session = false) => {
  try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* sem armazenamento */ }
};

// Entrada unica: o mesmo login serve para mestres, professores, pais e alunos.
// Depois de entrar, cada perfil e levado para a sua area (que abre ja logada).
export default function AcessoApp() {
  const [android, setAndroid] = useState(false);
  const [web, setWeb] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent));
    setWeb(new URLSearchParams(window.location.search).has("web"));
  }, []);

  // No Android, tenta abrir o app; se nao estiver instalado, volta para esta pagina em modo navegador.
  const appHref = typeof window === "undefined"
    ? "#"
    : `intent://open#Intent;scheme=${APP_SCHEME};package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(`${window.location.origin}/acesso/?web=1`)};end`;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    const session = await post("staff-api", { action: "login", email: form.get("email"), password: form.get("password") });
    if (!session.ok) { setBusy(false); return setMessage("E-mail ou senha incorretos."); }
    const { access_token: access, refresh_token: refresh } = session.data;

    const staff = await post("staff-api", { action: "me" }, access);
    if (staff.ok) {
      save("mcm-staff-access", access); save("mcm-staff-refresh", refresh);
      if (staff.data.role === "mestre") save("mcm-admin-token", access, true); // painel de cadastros abre ja logado
      window.location.href = "/chamada/";
      return;
    }
    const family = await post("family-api", { action: "me" }, access);
    if (family.ok) {
      save("mcm-family-access", access); save("mcm-family-refresh", refresh);
      window.location.href = "/familia/";
      return;
    }
    setBusy(false);
    setMessage("Esta conta ainda não tem acesso. Professores: peça a liberação aos mestres. Pais e alunos: crie a conta abaixo.");
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="space-y-2 text-center">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Mão Com Mão" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="text-3xl font-black text-amber-400">Acesso restrito</h1>
        <p className="text-sm text-slate-400">Mestres, professores, pais e alunos entram aqui, com o mesmo login. Cada um vê só a sua área.</p>
      </header>

      {android && !web && (
        <div className="space-y-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 p-4">
          <p className="font-extrabold text-amber-200">Você tem o aplicativo?</p>
          <p className="text-sm text-slate-300">Abra no aplicativo Mão Com Mão. Se ele não estiver instalado, continue por aqui, no navegador.</p>
          <a href={appHref} className={btn}>Abrir no aplicativo</a>
        </div>
      )}

      <form onSubmit={login} className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <input className={input} type="email" name="email" placeholder="E-mail" autoComplete="username" required />
        <input className={input} type="password" name="password" placeholder="Senha" autoComplete="current-password" required />
        {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
        <button disabled={busy} className={btn}>{busy ? "Entrando..." : "Entrar"}</button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Primeiro acesso</p>
        <a href="/familia/?cadastro=1" className={btn2}>Sou pai, mãe ou aluno · criar conta</a>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={btn2}>Sou professor · pedir acesso aos mestres</a>
        <p className="text-xs text-slate-500">Pais e alunos usam o código do grupo. O acesso de professor é liberado pelos mestres, por segurança.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Biblioteca</p>
        <a href="/biblioteca/" className={btn2}>Tenho uma pulseira ou QR Code</a>
      </div>

      <p className="text-center text-sm"><a href="/" className="text-slate-400 underline">← Voltar ao site</a></p>
    </div>
  );
}
