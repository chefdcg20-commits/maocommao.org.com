import type { Metadata, Viewport } from "next";
import BibliotecaApp from "./BibliotecaApp";
import { WebFooter } from "../_hall/WebFooter";

export const metadata: Metadata = {
  title: "Biblioteca | Mão Com Mão",
  description: "Videoaulas, técnicas, defesa pessoal e documentos do Projeto Mão Com Mão.",
  robots: { index: false, follow: false },
  icons: { apple: "/images/logo-mao-com-mao-circular-carteirinha.png" },
  appleWebApp: { capable: true, title: "Biblioteca", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#020617", width: "device-width", initialScale: 1 };

export default function BibliotecaPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-8 text-slate-100">
      <div className="mx-auto max-w-xl">
        <BibliotecaApp />
      </div>
      <WebFooter />
    </main>
  );
}
