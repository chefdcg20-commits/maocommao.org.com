"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnnounceView, InboxView, ReportView } from "./StaffExtras";
import { ContactView, Frame, Hall, InfoView, NewsList, Tile } from "../_hall/WebHall";

const ENDPOINT = process.env.NEXT_PUBLIC_STAFF_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/staff-api";
const ACCESS = "mcm-staff-access";
const REFRESH = "mcm-staff-refresh";

type Student = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  membership_number: string | null; photo_url: string | null; has_card: boolean; present_today: boolean;
};

const BELT_COLORS: Record<string, { main: string; stripe?: string }> = {
  white: { main: "#f4f4f5" }, grey_white: { main: "#9ca3af", stripe: "#f4f4f5" }, grey: { main: "#9ca3af" }, grey_black: { main: "#9ca3af", stripe: "#111" },
  yellow_white: { main: "#facc15", stripe: "#f4f4f5" }, yellow: { main: "#facc15" }, yellow_black: { main: "#facc15", stripe: "#111" },
  orange_white: { main: "#f97316", stripe: "#f4f4f5" }, orange: { main: "#f97316" }, orange_black: { main: "#f97316", stripe: "#111" },
  green_white: { main: "#16a34a", stripe: "#f4f4f5" }, green: { main: "#16a34a" }, green_black: { main: "#16a34a", stripe: "#111" },
  blue: { main: "#2563eb" }, purple: { main: "#7e22ce" }, brown: { main: "#78350f" }, black: { main: "#111" },
};

const ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  unauthorized: "Sessão expirada. Entre novamente.",
  forbidden: "Sua conta não tem permissão de equipe.",
  not_found: "Aluno não encontrado.",
};

const store = {
  get: (key: string) => { try { return localStorage.getItem(key) || ""; } catch { return ""; } },
  set: (key: string, value: string) => { try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch { /* sem armazenamento */ } },
};

async function post(body: Record<string, unknown>, token?: string) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// Chamada autenticada; renova o token uma vez se vencer.
async function api(body: Record<string, unknown>) {
  let result = await post(body, store.get(ACCESS));
  if (result.status === 401 && store.get(REFRESH)) {
    const fresh = await post({ action: "refresh", refresh_token: store.get(REFRESH) });
    if (fresh.ok) {
      store.set(ACCESS, fresh.data.access_token);
      store.set(REFRESH, fresh.data.refresh_token);
      result = await post(body, fresh.data.access_token);
    }
  }
  return result;
}

const input = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";
const FILTERS = [["all", "Todos"], ["18:00", "18h"], ["19:00", "19h"], ["20:00", "20h"]];

export default function ChamadaApp() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState("");
  const [nameState, setNameState] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("hall");
  const [counts, setCounts] = useState({ pending: 0, unread: 0 });
  useEffect(() => {
    if (signedIn && tab === "hall" && role === "mestre") api({ action: "summary" }).then((r) => r.ok && setCounts(r.data));
  }, [signedIn, tab, role]);

  const signOut = useCallback((text = "") => {
    store.set(ACCESS, ""); store.set(REFRESH, "");
    setTab("hall");
    setSignedIn(false); setStudents([]); setMessage(text);
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    const [me, roster] = await Promise.all([api({ action: "me" }), api({ action: "roster" })]);
    setBusy(false);
    if (roster.status === 401) return signOut("Sessão expirada. Entre novamente.");
    if (roster.status === 403) return signOut(ERRORS.forbidden);
    if (!roster.ok) return setMessage("Não foi possível carregar a lista. Verifique a internet.");
    setMessage("");
    setSignedIn(true);
    setRole(me.data?.role || "");
    if (me.data?.role === "mestre") { try { sessionStorage.setItem("mcm-admin-token", store.get(ACCESS)); } catch { /* sem armazenamento */ } }
    setNameState(me.data?.name || "");
    setStudents(roster.data.students);
    setDate(roster.data.date);
  }, [signOut]);

  useEffect(() => {
    setReady(true);
    if (store.get(ACCESS)) load();
  }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    const result = await post({ action: "login", email: form.get("email"), password: form.get("password") });
    if (!result.ok) { setBusy(false); return setMessage(ERRORS[result.data?.error] || "Não foi possível entrar."); }
    store.set(ACCESS, result.data.access_token);
    store.set(REFRESH, result.data.refresh_token);
    await load();
  }

  async function toggle(student: Student) {
    if (student.present_today && !confirm(`Desfazer a presença de ${student.name}?`)) return;
    const result = await api({ action: student.present_today ? "undo_attendance" : "mark_attendance", enrollment_id: student.id });
    if (result.status === 401) return signOut("Sessão expirada. Entre novamente.");
    if (!result.ok) return setMessage("Não foi possível salvar a presença.");
    setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, present_today: !s.present_today } : s)));
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => (filter === "all" || s.training_time === filter) && (!q || s.name.toLowerCase().includes(q)));
  }, [students, filter, query]);

  if (!ready) return null;

  if (!signedIn) {
    return (
      <form onSubmit={login} className="mx-auto mt-10 max-w-sm space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Mão Com Mão" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="text-center text-2xl font-black text-amber-400">Chamada</h1>
        <p className="text-center text-sm text-slate-400">Acesso da equipe</p>
        <input className={input} type="email" name="email" placeholder="E-mail" autoComplete="username" required />
        <input className={input} type="password" name="password" placeholder="Senha" autoComplete="current-password" required />
        {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">{busy ? "Entrando..." : "Entrar"}</button>
        <p className="text-center text-xs text-slate-500">No iPhone: toque em Compartilhar e em "Adicionar à Tela de Início".</p>
      </form>
    );
  }

  const present = visible.filter((s) => s.present_today).length;
  const isMestre = role === "mestre";
  if (tab !== "roster") {
    const tiles: Tile[] = isMestre
      ? [
          { key: "roster", icon: "✅", label: "Chamada dos alunos", hint: "Lista por toque" },
          { key: "cad", icon: "📝", label: "Cadastros e carteirinhas", hint: "Aprovar alunos", badge: counts.pending, href: "/admin/cadastros/" },
          { key: "report", icon: "📊", label: "Relatório de presença" },
          { key: "inbox", icon: "✉️", label: "Mensagens", hint: "Dos pais e alunos", badge: counts.unread },
          { key: "announce", icon: "📢", label: "Avisos", hint: "Publicar e código" },
        ]
      : [
          { key: "roster", icon: "✅", label: "Chamada dos alunos", hint: "Lista por toque" },
          { key: "news", icon: "📢", label: "Avisos" },
        ];
    if (tab === "hall") return <Hall name={nameState} roleLabel={isMestre ? "Mestre" : "Professor"} group="Equipe" tiles={tiles} onPick={setTab} onLogout={() => signOut()} featured={isMestre ? { title: "LIBERAÇÃO DA PULSEIRA", text: "Ativa a pulseira antes do envio e imprime o QR Code dela. A leitura do chip é feita no app Android; aqui você vê as pulseiras e imprime os QR Codes.", href: "/admin/pulseiras/" } : undefined} />;
    return (
      <Frame onBack={() => setTab("hall")}>
        {tab === "report" && <ReportView call={api} />}
        {tab === "inbox" && <InboxView call={api} />}
        {tab === "announce" && <AnnounceView call={api} />}
        {tab === "news" && <NewsList call={api} action="announcements_list" />}
        {tab === "info" && <InfoView call={api} canEdit={isMestre} />}
        {tab === "contact" && <ContactView />}
      </Frame>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setTab("hall")} className="font-extrabold text-amber-400">‹ Início</button>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-amber-400">Chamada</h1>
          <p className="text-sm text-slate-400">{date.split("-").reverse().join("/")} · {role === "mestre" ? "Mestre" : "Professor"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={busy} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold">{busy ? "..." : "Atualizar"}</button>
        </div>
      </header>

      <input className={input} placeholder="Buscar aluno" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="flex items-center gap-2">
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-full border px-4 py-2 text-sm font-bold ${filter === key ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-700"}`}>{label}</button>
        ))}
        <span className="ml-auto text-sm font-bold text-slate-400">{present}/{visible.length}</span>
      </div>

      {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
      {!visible.length && <p className="p-6 text-center text-slate-400">Nenhum aluno encontrado.</p>}

      <ul className="space-y-2">
        {visible.map((s) => {
          const belt = s.belt ? BELT_COLORS[s.belt] : null;
          return (
            <li key={s.id}>
              <button onClick={() => toggle(s)} className={`flex w-full items-center gap-3 rounded-2xl border bg-slate-900 p-2.5 text-left ${s.present_today ? "border-emerald-400" : "border-slate-800"}`}>
                {s.photo_url ? <img src={s.photo_url} alt="" className="h-[60px] w-12 rounded-lg object-cover" /> : <span className="h-[60px] w-12 rounded-lg bg-slate-800" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{s.name}</span>
                  <span className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    {s.training_time ? `${s.training_time.slice(0, 2)}h` : "sem horário"}
                    {belt && <span className="inline-block h-2 w-7 rounded-sm border" style={{ background: belt.main, borderColor: belt.stripe || "#1e293b" }} />}
                    {s.has_card ? "💳" : ""}
                  </span>
                </span>
                <span className={`px-2 text-2xl ${s.present_today ? "text-emerald-400" : "text-slate-500"}`}>{s.present_today ? "✓" : "○"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
