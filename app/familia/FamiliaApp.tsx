"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ContactView, Frame, Hall, InfoView, NewsList } from "../_hall/WebHall";

const ENDPOINT = process.env.NEXT_PUBLIC_FAMILY_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/family-api";
const ACCESS = "mcm-family-access";
const REFRESH = "mcm-family-refresh";

type Student = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  membership_number: string | null; card_valid_until: string | null; photo_url: string | null;
  attendance_total: number; attendance_month: number; last_attendance: string | null;
};

const BELT: Record<string, { main: string; stripe?: string; label: string }> = {
  white: { main: "#f4f4f5", label: "Branca" }, grey_white: { main: "#9ca3af", stripe: "#f4f4f5", label: "Cinza e branca" }, grey: { main: "#9ca3af", label: "Cinza" }, grey_black: { main: "#9ca3af", stripe: "#111", label: "Cinza e preta" },
  yellow_white: { main: "#facc15", stripe: "#f4f4f5", label: "Amarela e branca" }, yellow: { main: "#facc15", label: "Amarela" }, yellow_black: { main: "#facc15", stripe: "#111", label: "Amarela e preta" },
  orange_white: { main: "#f97316", stripe: "#f4f4f5", label: "Laranja e branca" }, orange: { main: "#f97316", label: "Laranja" }, orange_black: { main: "#f97316", stripe: "#111", label: "Laranja e preta" },
  green_white: { main: "#16a34a", stripe: "#f4f4f5", label: "Verde e branca" }, green: { main: "#16a34a", label: "Verde" }, green_black: { main: "#16a34a", stripe: "#111", label: "Verde e preta" },
  blue: { main: "#2563eb", label: "Azul" }, purple: { main: "#7e22ce", label: "Roxa" }, brown: { main: "#78350f", label: "Marrom" }, black: { main: "#111", label: "Preta" },
};

const ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  unauthorized: "Sessão expirada. Entre novamente.",
  forbidden: "Esta conta não é de pais ou alunos. Se você é da equipe, use a página de chamada.",
  invalid_code: "Código do grupo incorreto.",
  email_in_use: "Já existe uma conta com este e-mail. Use Entrar.",
  weak_password: "A senha precisa ter pelo menos 8 caracteres.",
  missing_field: "Preencha todos os campos.",
  no_match: "Não encontramos um aluno com essa matrícula e data de nascimento. Confira a carteirinha.",
  too_many_attempts: "Muitas tentativas. Aguarde um pouco e tente de novo.",
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
const btn = "w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60";
const btn2 = "w-full rounded-xl border border-slate-700 px-5 py-3 font-bold";
const fmt = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const errorText = (data: any) => ERRORS[data?.error] || "Algo deu errado. Tente novamente.";

function Belt({ belt, stripes, wide }: { belt: string | null; stripes: number; wide?: boolean }) {
  const info = belt ? BELT[belt] : null;
  if (!info) return null;
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2.5 rounded-sm border ${wide ? "w-24" : "w-14"}`} style={{ background: info.main, borderColor: info.stripe || "#1e293b" }} />
      {stripes > 0 && <span className="text-xs text-slate-400">{stripes}º grau</span>}
    </span>
  );
}

export default function FamiliaApp() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<"hall" | "home" | "link" | "news" | "info" | "contact" | "student">("hall");
  const [current, setCurrent] = useState<Student | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const signOut = useCallback((text = "") => {
    store.set(ACCESS, ""); store.set(REFRESH, "");
    setSignedIn(false); setStudents([]); setView("hall"); setMessage(text);
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    const [me, list] = await Promise.all([api({ action: "me" }), api({ action: "students" })]);
    setBusy(false);
    if (list.status === 401) return signOut("Sessão expirada. Entre novamente.");
    if (list.status === 403) return signOut(ERRORS.forbidden);
    if (!list.ok) return setMessage("Não foi possível carregar. Verifique a internet.");
    setMessage(""); setSignedIn(true); setName(me.data?.name || ""); setStudents(list.data.students);
  }, [signOut]);

  useEffect(() => {
    setReady(true);
    try { if (new URLSearchParams(window.location.search).has("cadastro")) setMode("register"); } catch { /* sem URL */ }
    if (store.get(ACCESS)) load();
  }, [load]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    const payload = mode === "login"
      ? { action: "login", email: form.get("email"), password: form.get("password") }
      : { action: "register", code: form.get("code"), name: form.get("name"), email: form.get("email"), password: form.get("password") };
    const result = await post(payload);
    if (!result.ok) { setBusy(false); return setMessage(errorText(result.data)); }
    store.set(ACCESS, result.data.access_token);
    store.set(REFRESH, result.data.refresh_token);
    await load();
  }

  if (!ready) return null;

  if (!signedIn) {
    return (
      <form onSubmit={submitAuth} className="mx-auto mt-8 max-w-sm space-y-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Mão Com Mão" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="text-center text-2xl font-black text-amber-400">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="text-center text-sm text-slate-400">Pais, responsáveis e alunos</p>
        {mode === "register" && (
          <>
            <input className={input} name="code" placeholder="Código do grupo" autoCapitalize="characters" required />
            <input className={input} name="name" placeholder="Seu nome completo" required />
          </>
        )}
        <input className={input} type="email" name="email" placeholder="E-mail" autoComplete="username" required />
        <input className={input} type="password" name="password" placeholder={mode === "register" ? "Senha (mínimo 8 caracteres)" : "Senha"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} required />
        {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
        <button disabled={busy} className={btn}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <button type="button" className="w-full p-2 text-sm text-slate-400" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {mode === "login" ? "Primeiro acesso? Criar conta" : "Já tenho conta · Entrar"}
        </button>
        <p className="text-center text-xs text-slate-500">No iPhone: Compartilhar → "Adicionar à Tela de Início".</p>
      </form>
    );
  }

  if (view === "hall") {
    return <Hall name={name} roleLabel="Família" group="Acompanhamento" onLogout={() => signOut()} onPick={(key) => setView(key === "students" ? "home" : (key as typeof view))}
      tiles={[{ key: "students", icon: "🥋", label: "Meus alunos", hint: "Presenças e faixa" }, { key: "news", icon: "📢", label: "Avisos" }]} />;
  }
  if (view === "news") return <Frame onBack={() => setView("hall")}><NewsList call={api} action="announcements" /></Frame>;
  if (view === "info") return <Frame onBack={() => setView("hall")}><InfoView call={api} canEdit={false} /></Frame>;
  if (view === "contact") return <Frame onBack={() => setView("hall")}><ContactView /></Frame>;
  if (view === "link") return <LinkView onBack={(done) => { setView("home"); if (done) load(); }} />;
  if (view === "student" && current) return <StudentView student={current} onBack={(removed) => { setView("home"); if (removed) load(); }} />;

  return (
    <div className="space-y-4">
      <button onClick={() => setView("hall")} className="font-extrabold text-amber-400">‹ Início</button>
      <header>
        <h1 className="text-3xl font-black text-amber-400">Meus alunos</h1>
        <p className="text-sm text-slate-400">Pais, responsáveis e alunos</p>
      </header>
      <button className={btn} onClick={() => setView("link")}>Vincular aluno</button>
      {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
      {!students.length && !busy && <p className="p-6 text-center text-slate-400">Nenhum aluno vinculado ainda. Toque em "Vincular aluno" e informe a matrícula da carteirinha e a data de nascimento.</p>}
      <ul className="space-y-2">
        {students.map((s) => (
          <li key={s.id}>
            <button onClick={() => { setCurrent(s); setView("student"); }} className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-left">
              {s.photo_url ? <img src={s.photo_url} alt="" className="h-[60px] w-12 rounded-lg object-cover" /> : <span className="h-[60px] w-12 rounded-lg bg-slate-800" />}
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block truncate font-extrabold">{s.name}</span>
                <Belt belt={s.belt} stripes={s.belt_stripes} />
                <span className="block text-sm text-slate-400">{s.training_time ? `Treino ${s.training_time.slice(0, 2)}h · ` : ""}{s.attendance_month} presença(s) no mês</span>
              </span>
              <span className="text-2xl text-slate-500">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinkView({ onBack }: { onBack: (done: boolean) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const result = await api({ action: "link_student", membership_number: form.get("membership"), birth_date: form.get("birth"), relationship: form.get("self") ? "proprio" : "responsavel" });
    setBusy(false);
    if (!result.ok) return setError(errorText(result.data));
    alert("Aluno vinculado! Agora você acompanha as presenças e a faixa.");
    onBack(true);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-amber-400">Vincular aluno</h1>
        <button type="button" onClick={() => onBack(false)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold">Voltar</button>
      </header>
      <p className="text-sm text-slate-400">A matrícula está na carteirinha (exemplo: MCM-2026-0001). A data é a de nascimento do aluno. Os dois precisam bater com o cadastro.</p>
      <input className={input} name="membership" placeholder="Matrícula (MCM-2026-0001)" autoCapitalize="characters" required />
      <label className="block text-sm text-slate-400">Data de nascimento do aluno
        <input className={`${input} mt-1`} type="date" name="birth" required />
      </label>
      <label className="flex items-center gap-3"><input type="checkbox" name="self" className="h-5 w-5" /> Eu mesmo(a) sou o aluno(a)</label>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      <button disabled={busy} className={btn}>{busy ? "Verificando..." : "Vincular"}</button>
    </form>
  );
}

function StudentView({ student, onBack }: { student: Student; onBack: (removed: boolean) => void }) {
  const [detail, setDetail] = useState<{ attendance: string[]; belt_history: { at: string; belt: string | null; stripes: number }[] } | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api({ action: "student_detail", enrollment_id: student.id }).then((r) => (r.ok ? setDetail(r.data) : setError(errorText(r.data)))); }, [student.id]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    const result = await api({ action: "send_message", enrollment_id: student.id, body: text });
    setBusy(false);
    if (!result.ok) return setError(errorText(result.data));
    setText(""); setError(""); alert("Enviado! Sua mensagem chegou aos mestres.");
  }
  async function unlink() {
    if (!confirm(`Desvincular ${student.name}? Você pode vincular de novo depois.`)) return;
    const result = await api({ action: "unlink_student", enrollment_id: student.id });
    if (result.ok) onBack(true); else setError(errorText(result.data));
  }

  return (
    <div className="space-y-3 pb-10">
      <header className="flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-black text-amber-400">{student.name}</h1>
        <button onClick={() => onBack(false)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold">Voltar</button>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
        {student.photo_url && <img src={student.photo_url} alt="" className="h-[120px] w-24 rounded-xl object-cover" />}
        <div className="space-y-1.5">
          <Belt belt={student.belt} stripes={student.belt_stripes} wide />
          <p>{student.belt ? BELT[student.belt]?.label : "Faixa não definida"}</p>
          <p className="text-sm text-slate-400">Matrícula: {student.membership_number || "—"}</p>
          <p className="text-sm text-slate-400">Carteirinha válida até {fmt(student.card_valid_until)}</p>
          <p className="text-sm text-slate-400">Treino: {student.training_time ? `${student.training_time.slice(0, 2)}h` : "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3"><p className="text-3xl font-black text-emerald-400">{student.attendance_month}</p><p className="text-xs text-slate-400">no mês</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3"><p className="text-3xl font-black text-amber-400">{student.attendance_total}</p><p className="text-xs text-slate-400">no total</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3"><p className="mt-2 font-black">{fmt(student.last_attendance)}</p><p className="text-xs text-slate-400">última</p></div>
      </div>
      <h2 className="font-extrabold">Presenças (últimos 6 meses)</h2>
      <p className="rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">{detail ? (detail.attendance.length ? detail.attendance.map(fmt).join("  ·  ") : "Nenhuma presença registrada ainda.") : "Carregando..."}</p>
      <h2 className="font-extrabold">Histórico de faixa</h2>
      {detail && !detail.belt_history.length && <p className="text-sm text-slate-400">Sem registros.</p>}
      {detail?.belt_history.map((h, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <Belt belt={h.belt} stripes={h.stripes} /><span className="text-sm text-slate-400">{fmt(h.at)}</span>
        </div>
      ))}
      <h2 className="font-extrabold">Mensagem para os mestres</h2>
      <textarea className={`${input} min-h-24`} placeholder="Sugestão, observação ou recado" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
      <button className={btn} disabled={busy || !text.trim()} onClick={send}>Enviar mensagem</button>
      <button className={btn2} onClick={unlink}>Desvincular este aluno</button>
    </div>
  );
}
