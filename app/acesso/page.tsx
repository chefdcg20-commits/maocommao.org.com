import type { Metadata, Viewport } from "next";
import AcessoApp from "./AcessoApp";

export const metadata: Metadata = {
  title: "Acesso | Mão Com Mão",
  description: "Entrada de mestres, professores, pais e alunos do Projeto Mão Com Mão.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#020617", width: "device-width", initialScale: 1 };

export default function AcessoPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <AcessoApp />
    </main>
  );
}
