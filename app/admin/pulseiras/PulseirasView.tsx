"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

const ENDPOINT = process.env.NEXT_PUBLIC_STAFF_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/staff-api";
const TOKEN_KEY = "mcm-admin-token"; // mesmo login do painel de cadastros (so mestres)

type Row = { id: string; label: string; status: string; url: string; uses: number; created_at: string };

// Etiquetas com o QR Code de cada pulseira liberada, para imprimir e enviar junto com a pulseira.
export default function PulseirasView() {
  const [rows, setRows] = useState<(Row & { qr: string })[]>([]);
  const [message, setMessage] = useState("Carregando...");

  useEffect(() => {
    (async () => {
      let token = "";
      try { token = sessionStorage.getItem(TOKEN_KEY) || ""; } catch { /* sem armazenamento */ }
      if (!token) return setMessage("Entre no painel de administração para ver as pulseiras.");
      const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "bracelet_list" }) });
      if (response.status === 401) return setMessage("Sessão expirada. Entre novamente no painel de administração.");
      if (response.status === 403) return setMessage("Só os mestres veem as pulseiras.");
      if (!response.ok) return setMessage("Não foi possível carregar as pulseiras.");
      const data = await response.json();
      const active: Row[] = (data.bracelets || []).filter((b: Row) => b.status === "active").reverse();
      const withQr = await Promise.all(active.map(async (b) => ({ ...b, qr: await QRCode.toDataURL(b.url, { errorCorrectionLevel: "M", margin: 1, width: 360 }) })));
      setRows(withQr);
      setMessage(withQr.length ? "" : "Nenhuma pulseira liberada ainda. Use \"Liberação da pulseira\" no app.");
    })().catch(() => setMessage("Não foi possível carregar as pulseiras."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .screen-only { display: none !important; }
          .labels { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
          .label { break-inside: avoid; border: 0.3mm solid #000 !important; color: #000 !important; background: #fff !important; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <div className="screen-only flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-amber-400">QR Codes das pulseiras</h1>
          <div className="flex gap-2">
            <a href="/admin/cadastros/" className="rounded-xl border border-slate-700 px-5 py-3 font-bold">Voltar ao painel</a>
            <button onClick={() => window.print()} disabled={!rows.length} className="rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">Imprimir</button>
          </div>
        </div>
        <p className="screen-only mt-2 text-sm text-slate-400">Cada QR Code é único e abre a Biblioteca. Imprima e envie junto com a pulseira correspondente (confira o número). Mantenha estes códigos privados.</p>
        {message && <p className="mt-8 text-center text-slate-300">{message}</p>}
        <div className="labels mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => (
            <div key={row.id} className="label rounded-xl border border-slate-700 bg-white p-3 text-center text-slate-900">
              <img src={row.qr} alt={`QR Code da ${row.label}`} className="mx-auto aspect-square w-full" />
              <p className="mt-1 text-sm font-black">{row.label}</p>
              <p className="text-[10px] leading-tight">Mão Com Mão · Biblioteca<br />Escaneie ou encoste o celular na pulseira</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
