// @ts-nocheck -- Supabase Edge Function executada pelo Deno, fora do compilador Next.js.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://maocommao-org-com.vercel.app",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

const text = (data: FormData, name: string, required = true) => {
  const value = String(data.get(name) || "").trim();
  if (required && !value) throw new Error(`missing:${name}`);
  return value || null;
};

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Cadastro repetido: mesmo nome (sem acento, maiuscula ou espaco extra) com a mesma data de nascimento,
// o mesmo telefone ou o mesmo e-mail do responsavel. Cadastros recusados nao contam.
const norm = (value: unknown) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (value: unknown) => String(value || "").replace(/\D/g, "");
const findDuplicate = async (supabase, student: { name: string; birth: string; phone: string; email: string | null }) => {
  const { data } = await supabase.from("student_enrollments").select("id, student_full_name, birth_date, guardian_phone, guardian_email").neq("status", "rejected").limit(5000);
  const name = norm(student.name);
  return (data || []).find((row) => norm(row.student_full_name) === name && (
    row.birth_date === student.birth
    || (digits(student.phone) && digits(row.guardian_phone) === digits(student.phone))
    || (student.email && row.guardian_email && String(row.guardian_email).toLowerCase() === student.email.toLowerCase())
  )) || null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    let secretKeys: Record<string, string> = {};
    try { secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { /* formato inesperado */ }
    const adminKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!adminKey) { console.error("[enroll] stage=config error=missing_admin_key"); return json({ error: "server_misconfigured" }, 500); }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      adminKey,
      { auth: { persistSession: false } },
    );
    const data = await request.formData();
    const rawToken = text(data, "invite_token")!;
    const tokenHash = await sha256(rawToken);
    const { data: invite, error: inviteError } = await supabase
      .from("enrollment_invites")
      .select("id, active, expires_at, max_uses, uses_count")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (inviteError) {
      console.error(`[enroll] stage=invite_lookup db_code=${inviteError.code ?? "?"} db_message=${inviteError.message}`);
      return json({ error: "invite_lookup_failed" }, 500);
    }
    if (!invite) { console.error("[enroll] stage=invite result=not_found token_len=" + rawToken.length); return json({ error: "invalid_invite" }, 403); }
    if (!invite.active) { console.error("[enroll] stage=invite result=inactive"); return json({ error: "invalid_invite" }, 403); }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) { console.error("[enroll] stage=invite result=expired"); return json({ error: "expired_invite" }, 403); }
    if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) { console.error("[enroll] stage=invite result=limit_reached"); return json({ error: "invite_limit" }, 403); }

    const trainingTime = text(data, "training_time");
    if (!["18:00", "19:00", "20:00"].includes(trainingTime!)) return json({ error: "invalid_training_time" }, 400);

    const duplicate = await findDuplicate(supabase, {
      name: text(data, "student_full_name")!,
      birth: text(data, "birth_date")!,
      phone: text(data, "guardian_phone")!,
      email: text(data, "guardian_email", false),
    });
    if (duplicate) { console.error("[enroll] stage=duplicate result=blocked"); return json({ error: "duplicate_enrollment" }, 409); }

    const photo = data.get("student_photo");
    const signature = data.get("guardian_signature");
    if (!(photo instanceof File) || !(signature instanceof File)) return json({ error: "missing_files" }, 400);
    if (photo.size > 5_242_880 || signature.size > 2_097_152) return json({ error: "file_too_large" }, 400);
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(photo.type) || !allowed.has(signature.type)) return json({ error: "invalid_file_type" }, 400);

    const enrollmentId = crypto.randomUUID();
    const extension = (file: File) => file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const photoPath = `${enrollmentId}/aluno.${extension(photo)}`;
    const signaturePath = `${enrollmentId}/responsavel.${extension(signature)}`;

    const photoUpload = await supabase.storage.from("student-photos").upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (photoUpload.error) { console.error(`[enroll] stage=upload_photo message=${photoUpload.error.message}`); return json({ error: "upload_failed" }, 500); }
    const signatureUpload = await supabase.storage.from("guardian-signatures").upload(signaturePath, signature, { contentType: signature.type, upsert: false });
    if (signatureUpload.error) {
      await supabase.storage.from("student-photos").remove([photoPath]);
      console.error(`[enroll] stage=upload_signature message=${signatureUpload.error.message}`);
      return json({ error: "upload_failed" }, 500);
    }

    const payload = {
      id: enrollmentId,
      student_full_name: text(data, "student_full_name"),
      training_time: trainingTime,
      birth_date: text(data, "birth_date"),
      photo_path: photoPath,
      guardian_full_name: text(data, "guardian_full_name"),
      guardian_relationship: text(data, "guardian_relationship"),
      guardian_email: text(data, "guardian_email", false),
      guardian_phone: text(data, "guardian_phone"),
      address_postal_code: text(data, "address_postal_code"),
      address_street: text(data, "address_street"),
      address_number: text(data, "address_number"),
      address_complement: text(data, "address_complement", false),
      address_neighborhood: text(data, "address_neighborhood"),
      address_city: text(data, "address_city"),
      address_state: text(data, "address_state"),
      emergency_contact_name: text(data, "emergency_contact_name", false),
      emergency_contact_phone: text(data, "emergency_contact_phone", false),
      health_notes: text(data, "health_notes", false),
      image_consent: text(data, "image_consent") === "true",
      guardian_signature_path: signaturePath,
      guardian_signed_at: new Date().toISOString(),
      invite_id: invite.id,
    };

    const { data: enrollment, error } = await supabase.from("student_enrollments").insert(payload).select("protocol").single();
    if (error) {
      await Promise.all([
        supabase.storage.from("student-photos").remove([photoPath]),
        supabase.storage.from("guardian-signatures").remove([signaturePath]),
      ]);
      console.error(`[enroll] stage=insert db_code=${error.code ?? "?"} db_message=${error.message}`);
      if (error.code === "23505" && /student_unique/.test(error.message)) return json({ error: "duplicate_enrollment" }, 409);
      return json({ error: "database_error" }, 500);
    }

    await supabase.from("enrollment_events").insert({ enrollment_id: enrollmentId, event_type: "submitted" });
    await supabase.from("enrollment_invites").update({ uses_count: invite.uses_count + 1 }).eq("id", invite.id);
    return json({ ok: true, protocol: enrollment.protocol }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`[enroll] stage=unexpected message=${message}`);
    return json({ error: message.startsWith("missing:") ? "missing_field" : "submission_failed" }, 400);
  }
});
