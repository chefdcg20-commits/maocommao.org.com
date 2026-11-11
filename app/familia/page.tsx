import type { Metadata, Viewport } from "next";
import FamiliaApp from "./FamiliaApp";

export const metadata: Metadata = {
  title: "Família | Mão Com Mão",
  description: "Acompanhamento do aluno para pais e responsáveis do Projeto Mão Com Mão.",
  robots: { index: false, follow: false },
  manifest: "/familia/manifest.webmanifest",
  icons: { apple: "/images/logo-mao-com-mao-circular-carteirinha.png" },
  appleWebApp: { capable: true, title: "Mão Com Mão", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#020617", width: "device-width", initialScale: 1 };

export default function FamiliaPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-xl">
        <FamiliaApp />
      </div>
    </main>
  );
}
