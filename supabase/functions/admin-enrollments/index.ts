// @ts-nocheck -- Supabase Edge Function executada pelo Deno, fora do compilador Next.js.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://maocommao-org-com.vercel.app",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const pickKey = (list: string | undefined, fallback: string | undefined) => {
  try { const parsed = JSON.parse(list || "{}"); if (parsed.default) return parsed.default; } catch { /* formato inesperado */ }
  return fallback;
};

const STATUSES = ["pending", "under_review", "changes_requested", "approved", "rejected"];

const SENSEI_BUCKET = "sensei-signatures";

const currentSenseiPath = async (supabase) => {
  const { data } = await supabase.storage.from(SENSEI_BUCKET).list("sensei");
  const names = (data || []).map((item) => item.name).filter((name) => name.startsWith("assinatura-")).sort();
  return names.length ? `sensei/${names[names.length - 1]}` : null;
};

const approveEnrollment = async (supabase, id: string, userId: string) => {
  const signaturePath = await currentSenseiPath(supabase);
  if (!signaturePath) return "no_sensei_signature";
  const { data: row, error } = await supabase.from("student_enrollments").select("status, membership_number").eq("id", id).maybeSingle();
  if (error) { console.error(`[admin] stage=approve_lookup db_code=${error.code ?? "?"}`); return "server_error"; }
  if (!row) return "not_found";
  if (row.status === "approved") return "ok";
  let membership = row.membership_number;
  if (!membership) {
    const generated = await supabase.rpc("next_membership_number");
    if (generated.error) { console.error(`[admin] stage=membership db_code=${generated.error.code ?? "?"}`); return "server_error"; }
    membership = generated.data;
  }
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 2);
  const { error: updateError } = await supabase.from("student_enrollments").update({
    status: "approved",
    approved_at: now.toISOString(),
    approved_by: userId,
    sensei_signature_path: signaturePath,
    sensei_signed_at: now.toISOString(),
    membership_number: membership,
    card_valid_until: validUntil.toISOString().slice(0, 10),
  }).eq("id", id);
  if (updateError) { console.error(`[admin] stage=approve_update db_code=${updateError.code ?? "?"}`); return "server_error"; }
  await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userId, event_type: "approved_card_issued" });
  return "ok";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const adminKey = pickKey(Deno.env.get("SUPABASE_SECRET_KEYS"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const publicKey = pickKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"), Deno.env.get("SUPABASE_ANON_KEY"));
    if (!adminKey || !publicKey) { console.error("[admin] stage=config error=missing_keys"); return json({ error: "server_misconfigured" }, 500); }

    const body = await request.json().catch(() => ({}));

    if (body.action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password) return json({ error: "invalid_credentials" }, 401);
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: publicKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) { console.error(`[admin] stage=login status=${response.status}`); return json({ error: "invalid_credentials" }, 401); }
      const session = await response.json();
      return json({ access_token: session.access_token, expires_in: session.expires_in });
    }

    const supabase = createClient(url, adminKey, { auth: { persistSession: false } });
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const { data: admin, error: adminError } = await supabase.from("admin_profiles").select("user_id").eq("user_id", userData.user.id).eq("active", true).maybeSingle();
    if (adminError) { console.error(`[admin] stage=admin_lookup db_code=${adminError.code ?? "?"}`); return json({ error: "server_error" }, 500); }
    if (!admin) return json({ error: "forbidden" }, 403);

    if (body.action === "list") {
      const { data: rows, error } = await supabase.from("student_enrollments").select("*").order("created_at", { ascending: false });
      if (error) { console.error(`[admin] stage=list db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      const sign = async (bucket: string, paths: string[]) => {
        const map: Record<string, string> = {};
        if (!paths.length) return map;
        const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 600);
        for (const item of data || []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
        return map;
      };
      const photos = await sign("student-photos", rows.map((r) => r.photo_path));
      const signatures = await sign("guardian-signatures", rows.map((r) => r.guardian_signature_path));
      const senseiPaths = [...new Set(rows.map((r) => r.sensei_signature_path).filter(Boolean))];
      const senseiSigned = await sign(SENSEI_BUCKET, senseiPaths);
      const currentPath = await currentSenseiPath(supabase);
      const currentUrl = currentPath ? (await sign(SENSEI_BUCKET, [currentPath]))[currentPath] || null : null;
      return json({
        sensei: { has_signature: Boolean(currentPath), url: currentUrl },
        enrollments: rows.map((r) => ({
          ...r,
          photo_url: photos[r.photo_path] || null,
          signature_url: signatures[r.guardian_signature_path] || null,
          sensei_signature_url: r.sensei_signature_path ? senseiSigned[r.sensei_signature_path] || null : null,
        })),
      });
    }

    if (body.action === "set_status") {
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!id || !STATUSES.includes(status)) return json({ error: "invalid_request" }, 400);
      if (status === "approved") {
        const result = await approveEnrollment(supabase, id, userData.user.id);
        return result === "ok" ? json({ ok: true }) : json({ error: result }, result === "server_error" ? 500 : 400);
      }
      const patch: Record<string, unknown> = { status };
      patch.approved_at = null;
      patch.approved_by = null;
      const { error } = await supabase.from("student_enrollments").update(patch).eq("id", id);
      if (error) { console.error(`[admin] stage=set_status db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userData.user.id, event_type: `status_${status}` });
      return json({ ok: true });
    }

    if (body.action === "approve") {
      const id = String(body.id || "");
      if (!id) return json({ error: "invalid_request" }, 400);
      const result = await approveEnrollment(supabase, id, userData.user.id);
      return result === "ok" ? json({ ok: true }) : json({ error: result }, result === "server_error" ? 500 : 400);
    }

    if (body.action === "upload_sensei_signature") {
      const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data_url || ""));
      if (!match) return json({ error: "invalid_file_type" }, 400);
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 2_000_000) return json({ error: "file_too_large" }, 400);
      const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
      // Cada envio gera um arquivo novo; carteirinhas ja emitidas continuam apontando para a assinatura que usaram.
      const upload = await supabase.storage.from(SENSEI_BUCKET).upload(`sensei/assinatura-${Date.now()}.${extension}`, bytes, { contentType: match[1], upsert: false });
      if (upload.error) { console.error(`[admin] stage=sensei_upload message=${upload.error.message}`); return json({ error: "upload_failed" }, 500); }
      return json({ ok: true });
    }

    return json({ error: "invalid_request" }, 400);
  } catch (error) {
    console.error(`[admin] stage=unexpected message=${error instanceof Error ? error.message : "unknown"}`);
    return json({ error: "server_error" }, 500);
  }
});
