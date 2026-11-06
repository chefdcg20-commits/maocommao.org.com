import type { Metadata } from "next";
import AdminPanel from "./AdminPanel";

export const metadata: Metadata = {
  title: "Administração | Projeto Mão Com Mão",
  robots: { index: false, follow: false },
};

export default function AdminCadastrosPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <AdminPanel />
      </div>
    </main>
  );
}
