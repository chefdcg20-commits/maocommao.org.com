"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { CardPair, Student, whiteInk } from "../carteirinha/CardView";

const ENDPOINT = process.env.NEXT_PUBLIC_ADMIN_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/admin-enrollments";
const STAFF_ENDPOINT = process.env.NEXT_PUBLIC_STAFF_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/staff-api";
const TOKEN_KEY = "mcm-admin-token";

// Todas as carteirinhas aprovadas, em ordem alfabetica, para salvar num unico PDF (frente e verso de cada aluno em sequencia).
export default function AllCardsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [ink, setInk] = useState<string | null>(null);
  const [message, setMessage] = useState("Carregando...");
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLElement>(null);

  // As fontes do cartao usam clamp() com vw, que muda conforme a largura da pagina. Na folha A4 fixamos o valor minimo
  // (o mesmo da carteirinha individual de 85,6 mm) para a carteirinha sair identica.
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('[class*="clamp("]').forEach((el) => {
      el.className.split(/\s+/).forEach((name) => {
        const m = name.match(/^(text|h|w)-\[clamp\(([^,]+),/);
        if (!m) return;
        if (m[1] === "text") el.style.fontSize = m[2]; else if (m[1] === "h") el.style.height = m[2]; else el.style.width = m[2];
      });
    });
  });

  useEffect(() => {
    (async () => {
      let token = "";
      try { token = sessionStorage.getItem(TOKEN_KEY) || ""; } catch { /* sem armazenamento */ }
      if (!token) return setMessage("Entre no painel de administração e abra esta página de novo.");
      const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "list" }) });
      if (!response.ok) return setMessage("Sessão expirada. Entre novamente no painel de administração.");
      const data = await response.json();
      const approved: Student[] = (data.enrollments || []).filter((row: Student) => row.status === "approved" && row.membership_number);
      if (!approved.length) return setMessage("Nenhum cadastro aprovado para imprimir.");
      setStudents(approved);

      const signature = approved.find((row) => row.sensei_signature_url)?.sensei_signature_url;
      if (signature) whiteInk(signature).then(setInk).catch(() => setInk(null));

      // QR individual de cada aluno, poucos por vez para nao sobrecarregar o servidor.
      let next = 0;
      const worker = async () => {
        while (next < approved.length) {
          const student = approved[next++];
          try {
            const res = await fetch(STAFF_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "student_key", enrollment_id: student.id }) });
            if (!res.ok) throw new Error("key");
            const { url } = await res.json();
            const image = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 0, width: 480, color: { dark: "#020617", light: "#ffffff" } });
            setQrs((old) => ({ ...old, [student.id]: image }));
          } catch {
            setFailed((old) => ({ ...old, [student.id]: true }));
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      setReady(true);
    })().catch(() => setMessage("Não foi possível carregar as carteirinhas."));
  }, []);

  if (!students.length) return <main className="min-h-screen bg-slate-950 p-10 text-center text-slate-300">{message}<p className="mt-4"><a href="/admin/cadastros/" className="font-bold text-amber-400 underline">Ir para o painel</a></p></main>;

  const done = Object.keys(qrs).length + Object.keys(failed).length;
  const failedCount = Object.keys(failed).length;

  // 10 carteirinhas por folha A4 (2 colunas x 5 linhas). Cada folha de frentes e seguida da folha de versos,
  // com as colunas espelhadas para o verso cair exatamente atras da frente (impressao frente e verso, virando pela borda maior).
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += 10) pages.push(students.slice(i, i + 10));
  const slot = (student: Student | undefined, part: "front" | "back") => (
    <div key={student?.id || Math.random()} className="card-slot">
      {student && <CardPair student={student} part={part} qr={qrs[student.id] || null} qrState={qrs[student.id] ? "ok" : failed[student.id] ? "fallback" : "loading"} ink={ink} />}
    </div>
  );
  const sheet = (list: (Student | undefined)[], part: "front" | "back", label: string, key: string) => (
    <div key={key} className="sheet-wrap">
      <p className="screen-only mb-2 mt-6 text-sm font-bold text-amber-400">{label}</p>
      <section className="sheet">{list.map((student) => slot(student, part))}</section>
    </div>
  );

  return (
    <main ref={root} className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .sheet { width: 210mm; height: 297mm; box-sizing: border-box; padding: 7.5mm 16.4mm; display: grid; grid-template-columns: 85.6mm 85.6mm; grid-auto-rows: 53.98mm; column-gap: 6mm; row-gap: 3mm; background: #fff; color: #fff; }
        .card-slot { width: 85.6mm; height: 53.98mm; outline: 0.15mm solid #8a8a8a; outline-offset: 0.7mm; }
        .card-slot:empty { outline: none; }
        .sheet .member-card { width: 85.6mm !important; height: 53.98mm !important; border-radius: 3mm !important; box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sheets { overflow-x: auto; }
        @media print {
          body { background: #fff !important; }
          main { padding: 0 !important; background: #fff !important; }
          .screen-only { display: none !important; }
          .sheets { overflow: visible; }
          .sheet-wrap { break-after: page; page-break-after: always; }
          .sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="screen-only flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-amber-400">Todas as carteirinhas ({students.length} alunos)</h1>
          <div className="flex gap-2">
            <a href="/admin/cadastros/" className="rounded-xl border border-slate-700 px-5 py-3 font-bold hover:border-amber-400">Voltar ao painel</a>
            <button onClick={() => window.print()} disabled={!ready} className="rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{ready ? "Salvar em PDF / Imprimir" : `Gerando QR ${done}/${students.length}...`}</button>
          </div>
        </div>
        {ready && failedCount > 0 && <p className="screen-only mt-2 rounded-xl bg-amber-400/15 p-3 text-sm text-amber-200">{failedCount} carteirinha(s) ficaram com o QR geral do site porque o QR individual não pôde ser gerado.</p>}
        <p className="screen-only mt-2 text-sm text-slate-400">Formato para gráfica: folhas A4 com 10 carteirinhas (85,6 × 54 mm) e linha de corte. Cada folha de frentes é seguida da folha de versos, já espelhada para imprimir frente e verso virando pela borda maior. Na janela de impressão: destino &quot;Salvar como PDF&quot;, papel A4, escala 100%, margens &quot;Nenhuma&quot; e &quot;Gráficos de segundo plano&quot; ligado. Total: {pages.length * 2} páginas.</p>

        <div className="sheets">
          {pages.flatMap((list, index) => {
            const padded: (Student | undefined)[] = Array.from({ length: 10 }, (_, i) => list[i]);
            const mirrored = padded.map((_, i) => padded[i % 2 === 0 ? i + 1 : i - 1]);
            return [
              sheet(padded, "front", `Folha ${index * 2 + 1}: frentes`, `f${index}`),
              sheet(mirrored, "back", `Folha ${index * 2 + 2}: versos (espelhados)`, `b${index}`),
            ];
          })}
        </div>
      </div>
    </main>
  );
}
