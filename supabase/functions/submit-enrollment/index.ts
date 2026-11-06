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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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

    if (inviteError || !invite || !invite.active) return json({ error: "invalid_invite" }, 403);
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return json({ error: "expired_invite" }, 403);
    if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) return json({ error: "invite_limit" }, 403);

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
    if (photoUpload.error) throw photoUpload.error;
    const signatureUpload = await supabase.storage.from("guardian-signatures").upload(signaturePath, signature, { contentType: signature.type, upsert: false });
    if (signatureUpload.error) {
      await supabase.storage.from("student-photos").remove([photoPath]);
      throw signatureUpload.error;
    }

    const payload = {
      id: enrollmentId,
      student_full_name: text(data, "student_full_name"),
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
      throw error;
    }

    await supabase.from("enrollment_events").insert({ enrollment_id: enrollmentId, event_type: "submitted" });
    await supabase.from("enrollment_invites").update({ uses_count: invite.uses_count + 1 }).eq("id", invite.id);
    return json({ ok: true, protocol: enrollment.protocol }, 201);
  } catch (error) {
    console.error(error);
    return json({ error: "submission_failed" }, 400);
  }
});
