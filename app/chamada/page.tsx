import type { Metadata, Viewport } from "next";
import ChamadaApp from "./ChamadaApp";
import { WebFooter } from "../_hall/WebFooter";

export const metadata: Metadata = {
  title: "Chamada | Mão Com Mão",
  description: "Lista de chamada da equipe do Projeto Mão Com Mão.",
  robots: { index: false, follow: false },
  manifest: "/chamada/manifest.webmanifest",
  icons: { apple: "/images/logo-mao-com-mao-circular-carteirinha.png" },
  appleWebApp: { capable: true, title: "Chamada", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#020617", width: "device-width", initialScale: 1 };

export default function ChamadaPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-8 text-slate-100">
      <div className="mx-auto max-w-xl">
        <ChamadaApp />
      </div>
      <WebFooter />
    </main>
  );
}
