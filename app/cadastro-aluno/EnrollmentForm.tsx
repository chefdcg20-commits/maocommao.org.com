"use client";

import { FormEvent, useMemo, useState } from "react";

const ERRORS: Record<string, string> = {
  default: "Não foi possível enviar. Tente novamente em instantes.",
  invalid_invite: "Convite inválido. Solicite um novo link ao secretário do projeto.",
  expired_invite: "Este convite expirou. Solicite um novo link ao secretário do projeto.",
  invite_limit: "Este convite atingiu o limite de cadastros. Solicite um novo link.",
  file_too_large: "Uma das imagens é grande demais (foto até 5 MB, assinatura até 2 MB).",
  invalid_file_type: "Envie as imagens em formato JPG, PNG ou WebP.",
  missing_files: "Envie a foto do aluno e a foto da assinatura.",
  invalid_training_time: "Escolha um horário de treino válido (18h, 19h ou 20h).",
  missing_field: "Preencha todos os campos obrigatórios.",
  upload_failed: "Falha ao enviar as imagens. Tente novamente em instantes.",
  invite_lookup_failed: "Erro temporário no servidor. Tente novamente em alguns minutos.",
  database_error: "Erro temporário ao salvar o cadastro. Tente novamente em alguns minutos.",
  server_misconfigured: "Erro temporário no servidor. Avise a equipe do projeto.",
};

const field = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400";

export default function EnrollmentForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState(ERRORS.default);
  const token = useMemo(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("convite") || "", []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setErrorMessage(ERRORS.invalid_invite); setStatus("error"); return; }
    setStatus("sending");
    const endpoint = process.env.NEXT_PUBLIC_ENROLLMENT_ENDPOINT || "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/submit-enrollment";
    const form = event.currentTarget;
    const body = new FormData(form);
    body.set("invite_token", token);
    try {
      const response = await fetch(endpoint, { method: "POST", body });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setErrorMessage(ERRORS[result?.error as string] || ERRORS.default);
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch { setErrorMessage("Sem conexão com o servidor. Verifique a internet e tente novamente."); setStatus("error"); }
  }

  if (!token) return <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center"><h2 className="text-xl font-bold text-amber-300">Convite necessário</h2><p className="mt-2 text-slate-300">Solicite ao secretário do projeto um link válido para realizar o cadastro.</p></div>;
  if (status === "success") return <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center"><h2 className="text-2xl font-black text-emerald-300">Cadastro enviado!</h2><p className="mt-3 text-slate-300">A equipe analisará as informações. Após a aprovação e a assinatura do Sensei Joaquim Guedes, a carteirinha poderá ser emitida.</p></div>;

  return (
    <form onSubmit={submit} className="space-y-7 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-8">
      <Section title="Dados do aluno">
        <Label text="Nome completo"><input className={field} name="student_full_name" required /></Label>
        <Label text="Data de nascimento"><input className={field} type="date" name="birth_date" required /></Label>
        <Label text="Horário de treino"><select className={field} name="training_time" required defaultValue=""><option value="" disabled>Selecione o horário</option><option value="18:00">18h</option><option value="19:00">19h</option><option value="20:00">20h</option></select></Label>
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
      {status === "error" && <p role="alert" className="rounded-xl bg-red-500/15 p-4 text-red-300">{errorMessage}</p>}
      <button disabled={status === "sending"} className="w-full rounded-xl bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">{status === "sending" ? "Enviando com segurança..." : "Enviar cadastro para análise"}</button>
      <p className="text-center text-xs leading-5 text-slate-500">Os dados são privados e utilizados somente para gestão dos alunos, segurança das atividades e emissão da carteirinha.</p>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="space-y-4"><legend className="mb-4 text-xl font-black text-amber-400">{title}</legend>{children}</fieldset>; }
function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-200">{text}{children}</label>; }
