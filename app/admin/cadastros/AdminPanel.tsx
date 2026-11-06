"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/admin-enrollments";
const TOKEN_KEY = "mcm-admin-token";

type Enrollment = {
  id: string; protocol: string; status: string; training_time: string | null; created_at: string;
  student_full_name: string; birth_date: string; guardian_full_name: string; guardian_relationship: string;
  guardian_email: string | null; guardian_phone: string; address_postal_code: string; address_street: string;
  address_number: string; address_complement: string | null; address_neighborhood: string; address_city: string;
  address_state: string; emergency_contact_name: string | null; emergency_contact_phone: string | null;
  health_notes: string | null; image_consent: boolean; photo_url: string | null; signature_url: string | null;
  membership_number: string | null; card_valid_until: string | null; sensei_signature_url: string | null;
};

const STATUS: Record<string, string> = {
  pending: "Pendente", under_review: "Em análise", changes_requested: "Ajustes solicitados", approved: "Aprovado", rejected: "Recusado",
};
const TIMES = ["18:00", "19:00", "20:00"];
const input = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";

const ERRORS: Record<string, string> = {
  no_sensei_signature: "Envie primeiro a assinatura do Sensei (caixa no topo da página).",
  file_too_large: "Imagem grande demais.",
  invalid_file_type: "Use uma imagem JPG, PNG ou WebP.",
  upload_failed: "Falha ao enviar a imagem. Tente novamente.",
};

// Reduz a imagem da assinatura (lado maior 900 px). Mantem PNG com transparencia; se ficar pesado, usa JPEG.
async function signatureDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("unreadable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const png = canvas.toDataURL("image/png");
  if (png.length < 1_800_000) return png;
  const flat = document.createElement("canvas");
  flat.width = canvas.width; flat.height = canvas.height;
  const fctx = flat.getContext("2d")!;
  fctx.fillStyle = "#ffffff"; fctx.fillRect(0, 0, flat.width, flat.height); fctx.drawImage(canvas, 0, 0);
  return flat.toDataURL("image/jpeg", 0.85);
}

const readToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
const saveToken = (value: string) => { try { value ? sessionStorage.setItem(TOKEN_KEY, value) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* sem armazenamento */ } };

async function call(body: Record<string, unknown>, token?: string) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [sensei, setSensei] = useState<{ has_signature: boolean; url: string | null }>({ has_signature: false, url: null });

  const logout = useCallback((text = "") => { saveToken(""); setToken(""); setRows([]); setMessage(text); }, []);

  const load = useCallback(async (value: string) => {
    setBusy(true);
    const result = await call({ action: "list" }, value);
    setBusy(false);
    if (result.status === 401) return logout("Sessão expirada. Entre novamente.");
    if (result.status === 403) return logout("Esta conta não tem permissão de administrador.");
    if (!result.ok) return setMessage("Não foi possível carregar os cadastros. Tente novamente.");
    setMessage("");
    setRows(result.data.enrollments || []);
    setSensei(result.data.sensei || { has_signature: false, url: null });
  }, [logout]);

  useEffect(() => {
    const saved = readToken();
    setReady(true);
    if (saved) { setToken(saved); load(saved); }
  }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    const result = await call({ action: "login", email: form.get("email"), password: form.get("password") });
    if (!result.ok) { setBusy(false); return setMessage("E-mail ou senha incorretos."); }
    saveToken(result.data.access_token);
    setToken(result.data.access_token);
    await load(result.data.access_token);
  }

  async function changeStatus(id: string, status: string) {
    const result = await call({ action: "set_status", id, status }, token);
    if (result.status === 401) return logout("Sessão expirada. Entre novamente.");
    if (!result.ok) return setMessage("Não foi possível alterar o status.");
    setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
  }

  async function uploadSensei(file: File | undefined) {
    if (!file) return;
    setMessage(""); setBusy(true);
    try {
      const result = await call({ action: "upload_sensei_signature", data_url: await signatureDataUrl(file) }, token);
      if (result.status === 401) return logout("Sessão expirada. Entre novamente.");
      if (!result.ok) { setBusy(false); return setMessage(ERRORS[result.data?.error] || "Não foi possível salvar a assinatura."); }
      await load(token);
    } catch { setBusy(false); setMessage("Não foi possível ler essa imagem."); }
  }

  async function approve(id: string) {
    if (!confirm("Aprovar este cadastro e emitir a carteirinha com a assinatura do Sensei?")) return;
    setMessage(""); setBusy(true);
    const result = await call({ action: "approve", id }, token);
    if (result.status === 401) return logout("Sessão expirada. Entre novamente.");
    if (!result.ok) { setBusy(false); return setMessage(ERRORS[result.data?.error] || "Não foi possível aprovar."); }
    await load(token);
  }

  const counts = useMemo(() => Object.fromEntries(TIMES.map((time) => [time, rows.filter((r) => r.training_time === time).length])), [rows]);
  const withoutTime = rows.filter((r) => !r.training_time).length;
  const visible = rows.filter((r) => filter === "all" || (filter === "none" ? !r.training_time : r.training_time === filter));

  if (!ready) return null;

  if (!token) {
    return (
      <form onSubmit={login} className="mx-auto max-w-md space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <h1 className="text-center text-2xl font-black text-amber-400">Administração</h1>
        <p className="text-center text-sm text-slate-400">Acesso restrito à coordenação do projeto.</p>
        <label className="block text-sm font-bold text-slate-200">E-mail<input className={input} type="email" name="email" autoComplete="username" required /></label>
        <label className="block text-sm font-bold text-slate-200">Senha<input className={input} type="password" name="password" autoComplete="current-password" required /></label>
        {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">{busy ? "Entrando..." : "Entrar"}</button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-amber-400">Cadastros de alunos</h1>
        <div className="flex gap-2">
          <button onClick={() => load(token)} disabled={busy} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold hover:border-amber-400">{busy ? "Atualizando..." : "Atualizar"}</button>
          <button onClick={() => logout()} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold hover:border-amber-400">Sair</button>
        </div>
      </header>

      {message && <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{message}</p>}

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="h-16 w-40 shrink-0 overflow-hidden rounded-lg bg-white">
          {sensei.url ? <img src={sensei.url} alt="Assinatura do Sensei" className="h-full w-full object-contain" /> : <span className="flex h-full items-center justify-center text-xs text-slate-500">sem assinatura</span>}
        </div>
        <div className="min-w-[220px] flex-1">
          <p className="font-bold">Assinatura do Sensei Joaquim Guedes</p>
          <p className="text-sm text-slate-400">{sensei.has_signature ? "Cadastrada. Será usada nas próximas aprovações." : "Envie uma foto da assinatura para poder aprovar alunos."}</p>
        </div>
        <label className="cursor-pointer rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold hover:border-amber-400">
          {sensei.has_signature ? "Trocar assinatura" : "Enviar assinatura"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadSensei(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-5">
        <Stat label="Total" value={rows.length} active={filter === "all"} onClick={() => setFilter("all")} />
        {TIMES.map((time) => <Stat key={time} label={`Treino ${time.slice(0, 2)}h`} value={counts[time]} active={filter === time} onClick={() => setFilter(time)} />)}
        <Stat label="Sem horário" value={withoutTime} active={filter === "none"} onClick={() => setFilter("none")} />
      </section>

      {!visible.length && <p className="rounded-2xl border border-slate-800 p-6 text-center text-slate-400">Nenhum cadastro nesta seleção.</p>}

      <ul className="space-y-3">
        {visible.map((row) => (
          <li key={row.id} className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <button onClick={() => setOpen(open === row.id ? null : row.id)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left">
              <span><strong className="text-lg">{row.student_full_name}</strong><span className="ml-3 text-sm text-slate-400">{row.training_time ? `Treino ${row.training_time.slice(0, 2)}h` : "Sem horário"}</span></span>
              <span className="text-sm text-slate-400">{STATUS[row.status] || row.status} · {new Date(row.created_at).toLocaleDateString("pt-BR")}</span>
            </button>
            {open === row.id && (
              <div className="grid gap-5 border-t border-slate-800 p-4 sm:grid-cols-[180px_1fr]">
                <div className="space-y-3">
                  {row.photo_url ? <img src={row.photo_url} alt="Foto do aluno" className="w-full rounded-xl border border-slate-700 object-cover" /> : <p className="text-sm text-slate-500">Sem foto</p>}
                  {row.signature_url && <img src={row.signature_url} alt="Assinatura do responsável" className="w-full rounded-xl border border-slate-700 bg-white object-contain" />}
                </div>
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Item label="Protocolo" value={row.protocol} />
                  <Item label="Nascimento" value={new Date(`${row.birth_date}T00:00:00`).toLocaleDateString("pt-BR")} />
                  <Item label="Responsável" value={`${row.guardian_full_name} (${row.guardian_relationship})`} />
                  <Item label="WhatsApp" value={row.guardian_phone} />
                  <Item label="E-mail" value={row.guardian_email} />
                  <Item label="Endereço" value={`${row.address_street}, ${row.address_number}${row.address_complement ? ` - ${row.address_complement}` : ""} · ${row.address_neighborhood} · ${row.address_city}/${row.address_state} · CEP ${row.address_postal_code}`} />
                  <Item label="Emergência" value={[row.emergency_contact_name, row.emergency_contact_phone].filter(Boolean).join(" · ")} />
                  <Item label="Saúde" value={row.health_notes} />
                  <Item label="Uso de imagem" value={row.image_consent ? "Autorizado" : "Não autorizado"} />
                  {row.membership_number && <Item label="Matrícula" value={`${row.membership_number} · válida até ${row.card_valid_until ? new Date(`${row.card_valid_until}T00:00:00`).toLocaleDateString("pt-BR") : "—"}`} />}
                  <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                    {row.status !== "approved" && <button onClick={() => approve(row.id)} disabled={busy} className="rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">Aprovar e emitir carteirinha</button>}
                    {row.status === "approved" && <a href={`/admin/carteirinha/?id=${row.id}`} className="rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 hover:bg-emerald-300">Imprimir carteirinha</a>}
                  </div>
                  <div>
                    <dt className="font-bold text-slate-400">Status</dt>
                    <dd><select value={row.status} onChange={(e) => changeStatus(row.id, e.target.value)} className={input}>{Object.entries(STATUS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></dd>
                  </div>
                </dl>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-2xl border p-4 text-left ${active ? "border-amber-400 bg-amber-400/10" : "border-slate-800 bg-slate-900/70 hover:border-slate-600"}`}><span className="block text-3xl font-black">{value}</span><span className="text-sm text-slate-400">{label}</span></button>;
}
function Item({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="font-bold text-slate-400">{label}</dt><dd className="text-slate-100">{value || "—"}</dd></div>;
}
