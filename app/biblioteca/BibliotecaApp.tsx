"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const ROOT = process.env.NEXT_PUBLIC_FUNCTIONS_URL || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/";
const ACCESS = "mcm-lib-access";
const REFRESH = "mcm-lib-refresh";
const KEY = "mcm-lib-key";

type Item = { id: string; category: string; title: string; description: string | null; url: string | null; audience: string };
type Post = { id: string; category: string; title: string; summary: string | null; source_name: string | null; source_url: string | null; event_date: string | null; pinned: boolean; created_at: string };
type Who = { kind: "mestre" | "professor" | "family"; name: string };

const CATEGORIES: [string, string, string][] = [
  ["videoaulas", "🎬", "Videoaulas"],
  ["tecnicas", "🥋", "Técnicas e variações"],
  ["defesa-pessoal", "🛡️", "Defesa pessoal"],
  ["documentos", "📄", "Documentos"],
  ["professores", "👨‍🏫", "Material para professores"],
];

const NEWS_CATS: [string, string, string][] = [
  ["resultados", "🏆", "Resultados"],
  ["calendario", "📅", "Calendário"],
  ["alertas", "🚨", "Alertas"],
  ["noticias", "📰", "Notícias"],
];
const br = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");

const store = {
  get: (key: string) => { try { return localStorage.getItem(key) || ""; } catch { return ""; } },
  set: (key: string, value: string) => { try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch { /* sem armazenamento */ } },
};

async function post(fn: string, body: Record<string, unknown>, token?: string) {
  const response = await fetch(`${ROOT}${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// Chamada autenticada; renova o token uma vez se vencer.
async function api(fn: string, body: Record<string, unknown>) {
  let result = await post(fn, body, store.get(ACCESS));
  if (result.status === 401 && store.get(REFRESH)) {
    const fresh = await post("staff-api", { action: "refresh", refresh_token: store.get(REFRESH) });
    if (fresh.ok) {
      store.set(ACCESS, fresh.data.access_token);
      store.set(REFRESH, fresh.data.refresh_token);
      result = await post(fn, body, fresh.data.access_token);
    }
  }
  return result;
}

// Video do YouTube (link normal, curto ou shorts) vira player dentro da propria biblioteca.
function embedUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.endsWith("youtu.be")) id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com")) id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).slice(-1)[0] || "";
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

const input = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";
const btn = "w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60";
const btn2 = "w-full rounded-xl border border-slate-700 px-5 py-3 font-bold";

export default function BibliotecaApp() {
  const [ready, setReady] = useState(false);
  const [who, setWho] = useState<Who | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [keyed, setKeyed] = useState<Item[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newsFilter, setNewsFilter] = useState("todos");
  const [postForm, setPostForm] = useState(false);

  const signOut = useCallback((text = "") => {
    store.set(ACCESS, ""); store.set(REFRESH, "");
    setWho(null); setItems([]); setMessage(text);
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    // Descobre se a conta e da equipe ou da familia; cada uma tem a sua API.
    let kind: Who["kind"] | null = null;
    let name = "";
    const staff = await api("staff-api", { action: "me" });
    if (staff.ok) { kind = staff.data.role; name = staff.data.name || ""; }
    else if (staff.status === 401) { setBusy(false); return signOut("Sessão expirada. Entre novamente."); }
    else {
      const family = await api("family-api", { action: "me" });
      if (family.ok) { kind = "family"; name = family.data.name || ""; }
    }
    if (!kind) { setBusy(false); return signOut("Esta conta não tem acesso à biblioteca. Fale com os mestres."); }
    const library = await api(kind === "family" ? "family-api" : "staff-api", { action: "library" });
    setBusy(false);
    if (!library.ok) return setMessage("Não foi possível carregar a biblioteca. Verifique a internet.");
    const news = await api(kind === "family" ? "family-api" : "staff-api", { action: "news" });
    setPosts(news.ok ? news.data.posts : []);
    setMessage(""); setItems(library.data.items); setWho({ kind, name });
  }, [signOut]);

  // Acesso por codigo (pulseira ou QR): valida no servidor e guarda o codigo neste aparelho.
  const openWithKey = useCallback(async (key: string) => {
    setBusy(true);
    const result = await post("library-access", { action: "open", token: key });
    setBusy(false);
    if (result.ok) { store.set(KEY, key); setMessage(""); setKeyed(result.data.items); setPosts(result.data.posts || []); return true; }
    store.set(KEY, "");
    setMessage(result.status === 429 ? "Muitas tentativas. Aguarde um pouco." : "Código inválido ou desativado. Use o QR Code ou a pulseira original.");
    return false;
  }, []);

  useEffect(() => {
    setReady(true);
    let fromLink = "";
    try {
      const params = new URLSearchParams(window.location.search);
      fromLink = params.get("k") || "";
      if (fromLink) window.history.replaceState(null, "", window.location.pathname); // tira o codigo da barra de endereco
    } catch { /* sem URL */ }
    const key = fromLink || store.get(KEY);
    if (key) openWithKey(key);
    else if (store.get(ACCESS)) load();
  }, [load, openWithKey]);

  function leaveKey() {
    store.set(KEY, "");
    setKeyed(null);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    const result = await post("staff-api", { action: "login", email: form.get("email"), password: form.get("password") });
    if (!result.ok) { setBusy(false); return setMessage("E-mail ou senha incorretos."); }
    store.set(ACCESS, result.data.access_token);
    store.set(REFRESH, result.data.refresh_token);
    await load();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await api("staff-api", { action: "library_save", category: data.get("category"), title: data.get("title"), description: data.get("description"), url: data.get("url"), audience: data.get("audience") });
    if (!result.ok) return setMessage(result.data?.error === "invalid_url" ? "O link precisa começar com https://" : "Não foi possível salvar. Confira os campos.");
    form.reset(); setEditing(false); setMessage(""); load();
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await api("staff-api", { action: "news_save", category: data.get("category"), title: data.get("title"), summary: data.get("summary"), source_name: data.get("source_name"), source_url: data.get("source_url"), event_date: data.get("event_date"), pinned: data.get("pinned") === "on" });
    if (!result.ok) return setMessage(result.data?.error === "invalid_url" ? "O link precisa começar com https://" : "Não foi possível publicar. Confira os campos.");
    form.reset(); setPostForm(false); setMessage(""); load();
  }

  async function removePost(post: Post) {
    if (!confirm(`Remover "${post.title}" do jornal?`)) return;
    const result = await api("staff-api", { action: "news_remove", id: post.id });
    if (result.ok) load(); else setMessage("Não foi possível remover.");
  }

  async function remove(item: Item) {
    if (!confirm(`Remover "${item.title}" da biblioteca?`)) return;
    const result = await api("staff-api", { action: "library_remove", id: item.id });
    if (result.ok) load(); else setMessage("Não foi possível remover.");
  }

  if (!ready) return null;

  const Banner = (
    <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
      Tudo o que for arrecadado com as pulseiras é destinado ao <strong>Projeto Social Mão com Mão</strong>, para sustentar e fazer crescer o projeto.
    </p>
  );

  if (!who && !keyed) {
    return (
      <div className="mx-auto mt-6 max-w-sm space-y-4">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Mão Com Mão" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="text-center text-2xl font-black text-amber-400">Biblioteca Mão com Mão</h1>
        <p className="text-center text-sm text-slate-400">Videoaulas, técnicas, defesa pessoal e documentos. Para entrar, encoste o celular na pulseira ou escaneie o QR Code que veio com ela.</p>
        {Banner}
        <form onSubmit={login} className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <input className={input} type="email" name="email" placeholder="E-mail" autoComplete="username" required />
          <input className={input} type="password" name="password" placeholder="Senha" autoComplete="current-password" required />
          {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
          <button disabled={busy} className={btn}>{busy ? "Entrando..." : "Entrar"}</button>
          <p className="text-center text-xs text-slate-500">Acesso da equipe e das famílias (com login). Quem tem a pulseira não precisa de login.</p>
        </form>
      </div>
    );
  }

  const isMestre = who?.kind === "mestre";
  const shown = who ? items : keyed || [];

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="" className="h-14 w-14 rounded-full" />
        <div className="flex-1">
          <h1 className="text-2xl font-black text-amber-400">Biblioteca</h1>
          <p className="text-sm text-slate-400">{who ? `Olá${who.name ? `, ${who.name.split(" ")[0]}` : ""} · ` : ""}Projeto Mão Com Mão</p>
        </div>
        <button onClick={() => (who ? signOut() : leaveKey())} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold">Sair</button>
      </header>
      {Banner}
      {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-black">📰 Jornal do Jiu-Jitsu</h2>
        <div className="flex flex-wrap gap-2">
          {([["todos", "", "Todas"], ...NEWS_CATS] as [string, string, string][]).map(([key, icon, label]) => (
            <button key={key} onClick={() => setNewsFilter(key)} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${newsFilter === key ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-700"}`}>{icon} {label}</button>
          ))}
        </div>
        {isMestre && (postForm ? (
          <form onSubmit={savePost} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-extrabold">Nova notícia</p>
            <p className="text-xs text-slate-400">Escreva um resumo com as suas palavras e cite a fonte. Não copie o texto de outros sites.</p>
            <select name="category" className={input} defaultValue="noticias">{NEWS_CATS.map(([key, , label]) => <option key={key} value={key}>{label}</option>)}</select>
            <input className={input} name="title" placeholder="Título" maxLength={160} required />
            <textarea className={`${input} min-h-24`} name="summary" placeholder="Resumo" maxLength={1200} />
            <input className={input} name="source_name" placeholder="Fonte (ex.: CBJJ, IBJJF)" maxLength={80} />
            <input className={input} name="source_url" placeholder="Link da fonte (https://...)" />
            <label className="block text-sm text-slate-400">Data do evento (se houver)<input type="date" name="event_date" className={`${input} mt-1`} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Fixar no topo</label>
            <button className={btn}>Publicar</button>
            <button type="button" className={btn2} onClick={() => setPostForm(false)}>Cancelar</button>
          </form>
        ) : (
          <button className={btn} onClick={() => setPostForm(true)}>+ Nova notícia</button>
        ))}
        {!posts.filter((p) => newsFilter === "todos" || p.category === newsFilter).length && <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">Nenhuma notícia por aqui ainda.</p>}
        {posts.filter((p) => newsFilter === "todos" || p.category === newsFilter).map((p) => {
          const c = NEWS_CATS.find((x) => x[0] === p.category);
          return (
            <article key={p.id} className={`space-y-1 rounded-2xl border bg-slate-900 p-3 ${p.pinned ? "border-amber-400" : "border-slate-800"}`}>
              <p className="text-xs text-slate-400">{c ? `${c[1]} ${c[2]}` : p.category}{p.pinned ? " · 📌 fixada" : ""}</p>
              <h3 className="font-extrabold">{p.title}</h3>
              <p className="text-xs text-slate-500">{p.event_date ? `Evento: ${br(p.event_date)} · ` : ""}Publicado em {br(p.created_at)}</p>
              {p.summary && <p className="whitespace-pre-line text-sm text-slate-300">{p.summary}</p>}
              <div className="flex gap-2 pt-1">
                {p.source_url && <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950">Ler na fonte{p.source_name ? ` (${p.source_name})` : ""}</a>}
                {isMestre && <button onClick={() => removePost(p)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold">Remover</button>}
              </div>
            </article>
          );
        })}
      </section>

      {isMestre && (
        editing ? (
          <form onSubmit={save} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-extrabold">Novo item</p>
            <select name="category" className={input} defaultValue="videoaulas">{CATEGORIES.map(([key, , label]) => <option key={key} value={key}>{label}</option>)}</select>
            <input className={input} name="title" placeholder="Título" maxLength={160} required />
            <textarea className={`${input} min-h-20`} name="description" placeholder="Descrição (opcional)" maxLength={2000} />
            <input className={input} name="url" placeholder="Link (https://...) do vídeo ou documento" />
            <select name="audience" className={input} defaultValue="todos"><option value="todos">Todos (pais, alunos e equipe)</option><option value="equipe">Só equipe (professores e mestres)</option></select>
            <button className={btn}>Salvar item</button>
            <button type="button" className={btn2} onClick={() => setEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <button className={btn} onClick={() => setEditing(true)}>+ Adicionar item</button>
        )
      )}

      {CATEGORIES.map(([key, icon, label]) => {
        if (key === "professores" && (!who || who.kind === "family")) return null;
        const list = shown.filter((i) => i.category === key);
        return (
          <section key={key} className="space-y-2">
            <h2 className="text-lg font-black">{icon} {label}</h2>
            {!list.length && <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">Em breve.</p>}
            {list.map((item) => (
              <div key={item.id} className="space-y-1 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <p className="font-extrabold">{item.title}{item.audience === "equipe" && <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">equipe</span>}</p>
                {item.description && <p className="whitespace-pre-line text-sm text-slate-300">{item.description}</p>}
                {embedUrl(item.url) && (
                  <div className="aspect-video overflow-hidden rounded-xl bg-black">
                    <iframe src={embedUrl(item.url) as string} title={item.title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0" />
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  {item.url && !embedUrl(item.url) && <a href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950">Abrir</a>}
                  {isMestre && <button onClick={() => remove(item)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold">Remover</button>}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
