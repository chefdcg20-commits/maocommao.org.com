"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Call = (body: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: any }>;

const input = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";
const btn = "w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60";
const btn2 = "w-full rounded-xl border border-slate-700 px-5 py-3 font-bold";
const fmt = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function range(key: string) {
  const now = new Date();
  if (key === "last") return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (key === "30") return { from: iso(new Date(now.getTime() - 29 * 86400000)), to: iso(now) };
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
}

function Pills({ items, value, onChange }: { items: string[][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} className={`rounded-full border px-4 py-2 text-sm font-bold ${value === key ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-700"}`}>{label}</button>
      ))}
    </div>
  );
}

export function ReportView({ call }: { call: Call }) {
  const [period, setPeriod] = useState("month");
  const [time, setTime] = useState("all");
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState("");

  const load = useCallback(async () => {
    const { from, to } = range(period);
    const result = await call({ action: "attendance_report", from, to, training_time: time === "all" ? null : time });
    if (!result.ok) return setError("Não foi possível carregar o relatório.");
    setError(""); setReport(result.data);
  }, [call, period, time]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => [...(report?.students || [])].sort((a: any, b: any) => b.count - a.count || a.name.localeCompare(b.name)), [report]);
  const days = report?.training_days || 0;

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">Relatório</h2>
      {report && <p className="text-sm text-slate-400">{fmt(report.from)} a {fmt(report.to)} · {days} dia(s) de treino</p>}
      <Pills value={period} onChange={setPeriod} items={[["month", "Este mês"], ["last", "Mês passado"], ["30", "30 dias"]]} />
      <Pills value={time} onChange={setTime} items={[["all", "Todos"], ["18:00", "18h"], ["19:00", "19h"], ["20:00", "20h"]]} />
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      <ul className="space-y-2">
        {rows.map((s: any) => (
          <li key={s.id}>
            <button onClick={() => setOpen(open === s.id ? "" : s.id)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-left">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate font-extrabold">{s.name}</span>
                <span className={`text-lg font-black ${s.count ? "text-emerald-400" : "text-red-400"}`}>{s.count}</span>
              </span>
              <span className="mt-1 block text-sm text-slate-400">
                {s.training_time ? `${s.training_time.slice(0, 2)}h` : "sem horário"}{days ? ` · ${Math.round((s.count / days) * 100)}%` : ""} · última: {fmt(s.last)}
              </span>
              {open === s.id && <span className="mt-2 block text-sm text-slate-400">{s.dates.length ? s.dates.map(fmt).join("  ·  ") : "Nenhuma presença no período."}</span>}
            </button>
          </li>
        ))}
      </ul>
      {report && !rows.length && <p className="p-6 text-center text-slate-400">Nenhum aluno no período.</p>}
    </div>
  );
}

export function InboxView({ call }: { call: Call }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const result = await call({ action: "inbox" });
    if (!result.ok) return setError("Não foi possível carregar as mensagens.");
    setError(""); setItems(result.data.messages);
  }, [call]);
  useEffect(() => { load(); }, [load]);

  async function read(m: any) {
    if (m.read) return;
    const result = await call({ action: "mark_message_read", id: m.id });
    if (result.ok) setItems((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">Mensagens</h2>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      {!items.length && !error && <p className="p-6 text-center text-slate-400">Nenhuma mensagem ainda.</p>}
      {items.map((m) => (
        <button key={m.id} onClick={() => read(m)} className={`w-full rounded-2xl border bg-slate-900 p-3 text-left ${m.read ? "border-slate-800" : "border-amber-400"}`}>
          <span className="block font-extrabold">{m.student}</span>
          <span className="block text-sm text-slate-400">de {m.from} · {fmt(m.created_at)}</span>
          <span className="mt-2 block">{m.body}</span>
        </button>
      ))}
    </div>
  );
}

export function AnnounceView({ call }: { call: Call }) {
  const [list, setList] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([call({ action: "announcements_list" }), call({ action: "get_signup_code" })]);
    if (!a.ok || !c.ok) return setError("Não foi possível carregar.");
    setError(""); setList(a.data.announcements); setCode(c.data.code);
  }, [call]);
  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!title.trim() || !text.trim()) return setError("Escreva o título e o texto.");
    const result = await call({ action: "announce", title, body: text });
    if (!result.ok) return setError("Não foi possível publicar.");
    setTitle(""); setText(""); load();
  }
  async function remove(id: string) {
    if (!confirm("Remover este aviso?")) return;
    await call({ action: "remove_announcement", id }); load();
  }
  async function changeCode() {
    const result = await call({ action: "set_signup_code", code: newCode });
    if (!result.ok) return setError("O código precisa ter de 6 a 24 letras, números ou hífen.");
    setNewCode(""); setCode(result.data.code); setError("");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-black text-amber-400">Avisos</h2>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
      <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <p className="font-extrabold">Código de cadastro da família</p>
        <p className="select-all text-2xl font-black text-amber-400">{code || "..."}</p>
        <p className="text-sm text-slate-400">Mande só no grupo. Sem o código não é possível criar conta.</p>
        <input className={input} placeholder="Novo código (opcional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
        <button className={btn2} disabled={newCode.trim().length < 6} onClick={changeCode}>Trocar código</button>
      </div>
      <p className="font-extrabold">Novo aviso</p>
      <input className={input} placeholder="Título" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={`${input} min-h-24`} placeholder="Texto do aviso" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
      <button className={btn} onClick={publish}>Publicar aviso</button>
      <p className="font-extrabold">Avisos publicados</p>
      {!list.length && <p className="text-center text-slate-400">Nenhum aviso.</p>}
      {list.map((a) => (
        <div key={a.id} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="font-extrabold">{a.title}</p>
          <p className="text-sm text-slate-400">{fmt(a.created_at)}</p>
          <p>{a.body}</p>
          <button className={btn2} onClick={() => remove(a.id)}>Remover</button>
        </div>
      ))}
    </div>
  );
}
