"use client";

import { FormEvent, useMemo, useState } from "react";

const field = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";

export default function EnrollmentForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const token = useMemo(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("convite") || "", []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setStatus("error"); return; }
    setStatus("sending");
    const endpoint = process.env.NEXT_PUBLIC_ENROLLMENT_ENDPOINT;
    if (!endpoint) { setStatus("error"); return; }
    const body = new FormData(event.currentTarget);
    body.set("invite_token", token);
    try {
      const response = await fetch(endpoint, { method: "POST", body });
      if (!response.ok) throw new Error("submission_failed");
      setStatus("success");
      event.currentTarget.reset();
    } catch { setStatus("error"); }
  }

  if (!token) return <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center"><h2 className="text-xl font-bold text-amber-300">Convite necessário</h2><p className="mt-2 text-slate-300">Solicite ao secretário do projeto um link válido para realizar o cadastro.</p></div>;
  if (status === "success") return <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center"><h2 className="text-2xl font-black text-emerald-300">Cadastro enviado!</h2><p className="mt-3 text-slate-300">A equipe analisará as informações. Após a aprovação e a assinatura do Sensei Joaquim Guedes, a carteirinha poderá ser emitida.</p></div>;

  return (
    <form onSubmit={submit} className="space-y-7 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-8">
      <Section title="Dados do aluno">
        <Label text="Nome completo"><input className={field} name="student_full_name" required /></Label>
        <Label text="Data de nascimento"><input className={field} type="date" name="birth_date" required /></Label>
        <Label text="Foto atual do aluno"><input className={field} type="file" name="student_photo" accept="image/jpeg,image/png,image/webp" capture="user" required /><small className="mt-2 block text-slate-400">No celular, você poderá tirar a foto na hora.</small></Label>
      </Section>
      <Section title="Responsável legal">
        <Label text="Nome completo"><input className={field} name="guardian_full_name" required /></Label>
        <Label text="Parentesco"><input className={field} name="guardian_relationship" required placeholder="Ex.: mãe, pai ou responsável legal" /></Label>
        <div className="grid gap-4 sm:grid-cols-2"><Label text="WhatsApp"><input className={field} name="guardian_phone" inputMode="tel" required /></Label><Label text="E-mail"><input className={field} name="guardian_email" type="email" /></Label></div>
      </Section>
      <Section title="Endereço">
        <div className="grid gap-4 sm:grid-cols-2"><Label text="CEP"><input className={field} name="address_postal_code" required /></Label><Label text="Estado"><input className={field} name="address_state" required maxLength={2} /></Label></div>
        <Label text="Rua / avenida"><input className={field} name="address_street" required /></Label>
        <div className="grid gap-4 sm:grid-cols-2"><Label text="Número"><input className={field} name="address_number" required /></Label><Label text="Complemento"><input className={field} name="address_complement" /></Label></div>
        <div className="grid gap-4 sm:grid-cols-2"><Label text="Bairro"><input className={field} name="address_neighborhood" required /></Label><Label text="Cidade"><input className={field} name="address_city" required /></Label></div>
      </Section>
      <Section title="Saúde e emergência">
        <div className="grid gap-4 sm:grid-cols-2"><Label text="Contato de emergência"><input className={field} name="emergency_contact_name" /></Label><Label text="Telefone"><input className={field} name="emergency_contact_phone" /></Label></div>
        <Label text="Informações importantes para a prática esportiva"><textarea className={field} name="health_notes" rows={3} placeholder="Alergias, restrições ou outra informação relevante" /></Label>
      </Section>
      <Section title="Autorizações">
        <label className="flex gap-3 rounded-xl border border-slate-700 p-4"><input type="checkbox" name="image_consent" value="true" required className="mt-1 h-5 w-5 accent-amber-400" /><span className="text-sm leading-6 text-slate-300">Como responsável legal, autorizo gratuitamente o uso da imagem e da voz do aluno em registros das atividades do Projeto Mão Com Mão, incluindo site, YouTube e redes sociais institucionais, sempre relacionados às finalidades do projeto. Estou ciente de que posso solicitar a revogação para usos futuros.</span></label>
        <Label text="Assinatura do responsável"><input className={field} type="file" name="guardian_signature" accept="image/jpeg,image/png,image/webp" capture="environment" required /><small className="mt-2 block text-slate-400">Envie uma foto nítida da assinatura em papel branco.</small></Label>
        <label className="flex gap-3"><input type="checkbox" required className="mt-1 h-5 w-5 accent-amber-400" /><span className="text-sm text-slate-300">Declaro que as informações são verdadeiras e que sou responsável legal pelo aluno.</span></label>
      </Section>
      {status === "error" && <p role="alert" className="rounded-xl bg-red-500/15 p-4 text-red-300">Não foi possível enviar. Verifique se o convite é válido e tente novamente.</p>}
      <button disabled={status === "sending"} className="w-full rounded-xl bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">{status === "sending" ? "Enviando com segurança..." : "Enviar cadastro para análise"}</button>
      <p className="text-center text-xs leading-5 text-slate-500">Os dados são privados e utilizados somente para gestão dos alunos, segurança das atividades e emissão da carteirinha.</p>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="space-y-4"><legend className="mb-4 text-xl font-black text-amber-400">{title}</legend>{children}</fieldset>; }
function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-200">{text}{children}</label>; }
