import type { Metadata } from "next";
import EnrollmentForm from "./EnrollmentForm";

export const metadata: Metadata = {
  title: "Cadastro de aluno | Projeto Mão Com Mão",
  description: "Área reservada para cadastro de alunos convidados do Projeto Mão Com Mão.",
  robots: { index: false, follow: false },
};

export default function CadastroAlunoPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <img src="/images/logo-mao-com-mao-circular-carteirinha.png" alt="Projeto Mão Com Mão" className="mx-auto mb-5 h-28 w-28 rounded-full object-contain" />
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">Área reservada</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Cadastro de aluno</h1>
          <p className="mt-3 text-slate-300">Preencha somente se você recebeu o link de convite do Projeto Mão Com Mão.</p>
        </header>
        <EnrollmentForm />
      </div>
    </main>
  );
}
