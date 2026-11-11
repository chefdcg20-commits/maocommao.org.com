"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { BeltGraphic, beltByKey } from "../belts";

const ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/admin-enrollments";
const STAFF_ENDPOINT = process.env.NEXT_PUBLIC_STAFF_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/staff-api";
const TOKEN_KEY = "mcm-admin-token";

type Student = {
  id: string; status: string; student_full_name: string; birth_date: string; training_time: string | null;
  membership_number: string | null; card_valid_until: string | null;
  photo_url: string | null; sensei_signature_url: string | null; sensei_name: string;
  belt: string | null; belt_stripes: number;
};

// Tira o fundo branco da foto da assinatura: so o traco fica, em branco, para ler bem sobre o azul escuro.
async function whiteInk(url: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("load"));
    el.src = url;
  });
  const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const frame = ctx.getImageData(0, 0, w, h);
  const px = frame.data;
  const lum = new Uint8Array(w * h);
  const hist = new Uint32Array(256);
  for (let i = 0; i < w * h; i++) {
    const l = Math.round(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]);
    lum[i] = l; hist[l]++;
  }
  // nivel do papel = percentil 90 da luminosidade (compensa sombra e luz da foto)
  let acc = 0, paper = 255;
  for (let l = 0; l < 256; l++) { acc += hist[l]; if (acc >= w * h * 0.9) { paper = l; break; } }
  paper = Math.max(paper, 120);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const alpha = Math.max(0, Math.min(1, (paper * 0.82 - lum[i]) / (paper * 0.42)));
    const a = Math.round(alpha * 255);
    px[i * 4] = 255; px[i * 4 + 1] = 255; px[i * 4 + 2] = 255; px[i * 4 + 3] = a;
    if (a > 90) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) throw new Error("empty");
  ctx.clearRect(0, 0, w, h);
  ctx.putImageData(frame, 0, 0);
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02) + 2;
  const sx = Math.max(0, minX - pad), sy = Math.max(0, minY - pad);
  const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2), sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);
  const out = document.createElement("canvas");
  out.width = sw; out.height = sh;
  out.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL("image/png");
}

const cardClass = "member-card relative aspect-[85.6/53.98] w-full overflow-hidden rounded-[1.35rem] border border-amber-400/35 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white shadow-2xl";
const date = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "—";

export default function CardView() {
  const [student, setStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState("Carregando...");
  const [ink, setInk] = useState<string | null>(null);
  // QR individual do aluno: abre a Biblioteca ja liberada. Enquanto carrega nao imprime; se falhar, usa o QR do site.
  const [qr, setQr] = useState<string | null>(null);
  const [qrState, setQrState] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    (async () => {
      let token = "";
      try { token = sessionStorage.getItem(TOKEN_KEY) || ""; } catch { /* sem armazenamento */ }
      const id = new URLSearchParams(window.location.search).get("id");
      if (!token || !id) return setMessage("Entre no painel de administração para ver a carteirinha.");
      const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "list" }) });
      if (!response.ok) return setMessage("Sessão expirada. Entre novamente no painel de administração.");
      const data = await response.json();
      const found = (data.enrollments || []).find((row: Student) => row.id === id);
      if (!found || found.status !== "approved") return setMessage("Carteirinha disponível apenas para cadastros aprovados.");
      setStudent(found);
    })().catch(() => setMessage("Não foi possível carregar a carteirinha."));
  }, []);

  useEffect(() => {
    if (!student) return;
    (async () => {
      let token = "";
      try { token = sessionStorage.getItem(TOKEN_KEY) || ""; } catch { /* sem armazenamento */ }
      const response = await fetch(STAFF_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "student_key", enrollment_id: student.id }) });
      if (!response.ok) throw new Error("key");
      const { url } = await response.json();
      setQr(await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 0, width: 480, color: { dark: "#020617", light: "#ffffff" } }));
      setQrState("ok");
    })().catch(() => setQrState("fallback"));
  }, [student]);

  useEffect(() => {
    if (!student?.sensei_signature_url) return;
    whiteInk(student.sensei_signature_url).then(setInk).catch(() => setInk(null));
  }, [student]);

  if (!student) return <main className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">{message}<p className="mt-4"><a href="/admin/cadastros/" className="font-bold text-amber-400 underline">Ir para o painel</a></p></main>;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <style>{`
        @page { size: 85.6mm 53.98mm; margin: 0; }
        @media print {
          body { background: #fff !important; }
          .screen-only { display: none !important; }
          .cards-grid { display: block !important; margin: 0 !important; }
          .member-card { width: 85.6mm !important; height: 53.98mm !important; margin: 0 !important; border-radius: 3mm !important; break-after: page; page-break-after: always; box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="screen-only flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-amber-400">Carteirinha de {student.student_full_name}</h1>
          <div className="flex gap-2">
            <a href="/admin/cadastros/" className="rounded-xl border border-slate-700 px-5 py-3 font-bold hover:border-amber-400">Voltar ao painel</a>
            <button onClick={() => window.print()} disabled={qrState === "loading"} className="rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{qrState === "loading" ? "Gerando QR..." : "Imprimir"}</button>
          </div>
        </div>
        {qrState === "fallback" && <p className="screen-only mt-2 rounded-xl bg-amber-400/15 p-3 text-sm text-amber-200">Não foi possível gerar o QR individual do aluno. A carteirinha está com o QR geral do site.</p>}
        <p className="screen-only mt-2 text-sm text-slate-400">Na impressão, escolha tamanho real (100%), sem margens. Saem duas páginas: frente e verso, no tamanho de um cartão (85,6 × 54 mm).</p>

        <div className="cards-grid mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-label="Frente da carteirinha" className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2.5%] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="flex h-full flex-col p-[5%]">
              <div className="flex items-center gap-[3%]">
                <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="" className="h-[clamp(3.2rem,8vw,4.8rem)] w-[clamp(3.2rem,8vw,4.8rem)] rounded-full border-2 border-amber-400 object-cover" />
                <div>
                  <p className="text-[clamp(0.42rem,1vw,0.68rem)] font-black uppercase tracking-[0.2em] text-amber-400">Associação Mão Com Mão</p>
                  <h2 className="text-[clamp(0.9rem,2.2vw,1.45rem)] font-black leading-tight">JIU-JITSU</h2>
                  <p className="text-[clamp(0.45rem,1.1vw,0.72rem)] text-slate-300">Carteirinha de aluno</p>
                </div>
              </div>
              <div className="mt-[4%] grid flex-1 grid-cols-[27%_1fr] gap-[5%]">
                <div className="flex flex-col justify-center gap-[5%] self-center pb-[5%]">
                  <div className="relative aspect-[3/3.05] overflow-hidden rounded-[12%] border-[3px] border-white/80 bg-slate-300 shadow-lg">
                    {student.photo_url && <img src={student.photo_url} alt="Foto do aluno" className="absolute inset-0 h-full w-full object-cover" />}
                  </div>
                  {beltByKey(student.belt) && <BeltGraphic belt={beltByKey(student.belt)!} stripes={student.belt_stripes} className="mx-auto w-[78%]" />}
                </div>
                <dl className="grid content-center grid-cols-2 gap-x-[4%] gap-y-[5%]">
                  <div className="col-span-2"><dt className="text-[clamp(0.4rem,0.9vw,0.62rem)] font-black uppercase tracking-widest text-amber-400">Aluno</dt><dd className="text-[clamp(0.78rem,1.8vw,1.2rem)] font-black uppercase leading-tight">{student.student_full_name}</dd></div>
                  <div><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Matrícula</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">{student.membership_number}</dd></div>
                  <div><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Validade</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">{date(student.card_valid_until)}</dd></div>
                  <div className="col-span-2"><dt className="text-[clamp(0.38rem,0.85vw,0.58rem)] font-black uppercase tracking-wider text-amber-400">Nascimento</dt><dd className="text-[clamp(0.5rem,1.1vw,0.75rem)] font-bold">{date(student.birth_date)}</dd></div>
                </dl>
              </div>
              <div className="flex items-center justify-between border-t border-white/15 pt-[2%] text-[clamp(0.38rem,0.8vw,0.58rem)] text-slate-300">
                <span>Documento interno da associação</span>
                <span className="font-black text-amber-400">OSS!</span>
              </div>
            </div>
          </section>

          <section aria-label="Verso da carteirinha" className={cardClass}>
            <div className="absolute inset-x-0 top-0 h-[2.5%] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
            <div className="flex h-full flex-col p-[5%]">
              <div className="flex items-start justify-between gap-[4%]">
                <div>
                  <p className="text-[clamp(0.42rem,1vw,0.68rem)] font-black uppercase tracking-[0.2em] text-amber-400">Projeto Social</p>
                  <h2 className="text-[clamp(0.9rem,2.2vw,1.45rem)] font-black">Mão Com Mão</h2>
                  <p className="max-w-[22rem] text-[clamp(0.42rem,1vw,0.68rem)] leading-relaxed text-slate-300">Jiu-jítsu, disciplina, respeito e transformação social em Diadema.</p>
                </div>
                <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="" className="h-[clamp(3rem,7vw,4.4rem)] w-[clamp(3rem,7vw,4.4rem)] rounded-full object-cover" />
              </div>
              <div className="mt-[4%] grid grid-cols-[1fr_23%] items-center gap-[4%] rounded-xl border border-white/10 bg-white/5 p-[4%]">
                <div>
                  <p className="text-[clamp(0.4rem,0.9vw,0.62rem)] font-black uppercase tracking-widest text-amber-400">Aprovação do Sensei</p>
                  <div className="mt-[3%] flex h-[clamp(2.4rem,6vw,3.9rem)] items-end justify-center border-b border-white/60 pb-[1%]">
                    {ink
                      ? <img src={ink} alt="Assinatura do Sensei" className="h-full w-full object-contain object-bottom" />
                      : student.sensei_signature_url && <img src={student.sensei_signature_url} alt="Assinatura do Sensei" className="max-h-full max-w-full rounded bg-white object-contain px-1" />}
                  </div>
                  <p className="mt-[1.5%] text-center text-[clamp(0.62rem,1.4vw,0.95rem)] font-black">{student.sensei_name || "Joaquim Guedes"}</p>
                  <p className="text-center text-[clamp(0.4rem,0.9vw,0.62rem)] text-slate-400">Sensei do Projeto Mão Com Mão</p>
                </div>
                <div className="rounded-lg bg-white p-[7%] text-center shadow-lg">
                  <img src={qrState === "ok" && qr ? qr : "/images/qr-site-mao-com-mao.png"} alt="QR Code do aluno" className="aspect-square w-full" />
                  <span className="mt-[3%] block text-[clamp(0.32rem,0.7vw,0.5rem)] font-black uppercase tracking-wider text-slate-900">Acesse o site</span>
                </div>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 text-[clamp(0.36rem,0.78vw,0.55rem)]">
                <span className="font-bold text-emerald-400">✓ Cadastro aprovado{student.training_time ? ` · Treino ${student.training_time.slice(0, 2)}h` : ""}</span>
                <span className="text-right text-slate-400">Av. Casa Grande, 485 — Diadema/SP<br />Ginásio Rômulo Ducan Arante</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
