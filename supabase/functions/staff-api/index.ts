// @ts-nocheck -- Supabase Edge Function executada pelo Deno, fora do compilador Next.js.
// API da equipe (mestres e professores): login, lista de chamada, presenca e vinculo de cartoes NFC.
// Professores so recebem dados minimos (nome, foto, horario, faixa) de alunos APROVADOS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*", // o app Android nao tem origem web; toda acao exige token de equipe
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

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Identificador do chip: so hexadecimal, sem separadores, em maiusculas.
const normalizeUid = (raw: unknown) => {
  const value = String(raw || "").replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  return value.length >= 8 && value.length <= 20 ? value : null;
};

// Data do treino no fuso de Sao Paulo (AAAA-MM-DD).
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const adminKey = pickKey(Deno.env.get("SUPABASE_SECRET_KEYS"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const publicKey = pickKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"), Deno.env.get("SUPABASE_ANON_KEY"));
    if (!adminKey || !publicKey) { console.error("[staff] stage=config error=missing_keys"); return json({ error: "server_misconfigured" }, 500); }

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
      if (!response.ok) { console.error(`[staff] stage=login status=${response.status}`); return json({ error: "invalid_credentials" }, 401); }
      const session = await response.json();
      return json({ access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in });
    }

    if (body.action === "refresh") {
      const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: publicKey, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: String(body.refresh_token || "") }),
      });
      if (!response.ok) return json({ error: "unauthorized" }, 401);
      const session = await response.json();
      return json({ access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in });
    }

    const supabase = createClient(url, adminKey, { auth: { persistSession: false } });
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;
    const { data: staff, error: staffError } = await supabase.from("admin_profiles").select("role, full_name, active").eq("user_id", userId).maybeSingle();
    if (staffError) { console.error(`[staff] stage=role_lookup db_code=${staffError.code ?? "?"}`); return json({ error: "server_error" }, 500); }
    if (!staff || !staff.active) return json({ error: "forbidden" }, 403);
    const isMestre = staff.role === "mestre";

    if (body.action === "me") return json({ role: staff.role, name: staff.full_name });

    // Lista de chamada: so alunos aprovados e so o minimo necessario.
    if (body.action === "roster") {
      const date = today();
      const { data: rows, error } = await supabase.from("student_enrollments")
        .select("id, student_full_name, training_time, photo_path, belt, belt_stripes, membership_number")
        .eq("status", "approved").order("student_full_name", { ascending: true });
      if (error) { console.error(`[staff] stage=roster db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      const ids = rows.map((r) => r.id);
      const [{ data: cards }, { data: present }] = await Promise.all([
        supabase.from("nfc_cards").select("enrollment_id").eq("status", "active").in("enrollment_id", ids),
        supabase.from("attendance").select("enrollment_id").eq("session_date", date).in("enrollment_id", ids),
      ]);
      const withCard = new Set((cards || []).map((c) => c.enrollment_id));
      const presentSet = new Set((present || []).map((p) => p.enrollment_id));
      const paths = rows.map((r) => r.photo_path).filter(Boolean);
      const photos: Record<string, string> = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("student-photos").createSignedUrls(paths, 3600);
        for (const item of signed || []) if (item.path && item.signedUrl) photos[item.path] = item.signedUrl;
      }
      return json({
        date,
        students: rows.map((r) => ({
          id: r.id, name: r.student_full_name, training_time: r.training_time, belt: r.belt, belt_stripes: r.belt_stripes,
          membership_number: r.membership_number, photo_url: photos[r.photo_path] || null,
          has_card: withCard.has(r.id), present_today: presentSet.has(r.id),
        })),
      });
    }

    // Presenca manual (toque no nome) ou desfazer.
    if (body.action === "mark_attendance") {
      const id = String(body.enrollment_id || "");
      const { data: student } = await supabase.from("student_enrollments").select("id, training_time").eq("id", id).eq("status", "approved").maybeSingle();
      if (!student) return json({ error: "not_found" }, 404);
      const { error } = await supabase.from("attendance").upsert(
        { enrollment_id: id, session_date: today(), training_time: student.training_time, method: "manual", recorded_by: userId },
        { onConflict: "enrollment_id,session_date", ignoreDuplicates: true });
      if (error) { console.error(`[staff] stage=mark db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      return json({ ok: true });
    }

    if (body.action === "undo_attendance") {
      const id = String(body.enrollment_id || "");
      const { error } = await supabase.from("attendance").delete().eq("enrollment_id", id).eq("session_date", today());
      if (error) { console.error(`[staff] stage=undo db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      return json({ ok: true });
    }

    // Leitura do cartao: encontra o aluno e registra a presenca do dia.
    if (body.action === "scan") {
      const uid = normalizeUid(body.tag_uid);
      if (!uid) return json({ error: "invalid_tag" }, 400);
      const method = body.method === "qr" ? "qr" : "nfc";
      const { data: card } = await supabase.from("nfc_cards").select("enrollment_id").eq("tag_hash", await sha256(uid)).eq("status", "active").maybeSingle();
      if (!card) { console.error("[staff] stage=scan result=card_not_linked"); return json({ error: "card_not_linked" }, 404); }
      const { data: student } = await supabase.from("student_enrollments")
        .select("id, student_full_name, training_time, photo_path, belt, belt_stripes, status").eq("id", card.enrollment_id).maybeSingle();
      if (!student || student.status !== "approved") return json({ error: "student_not_active" }, 403);
      const { data: existing } = await supabase.from("attendance").select("id").eq("enrollment_id", student.id).eq("session_date", today()).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("attendance").insert({ enrollment_id: student.id, session_date: today(), training_time: student.training_time, method, recorded_by: userId });
        if (error && error.code !== "23505") { console.error(`[staff] stage=scan_insert db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      }
      let photo_url = null;
      if (student.photo_path) photo_url = (await supabase.storage.from("student-photos").createSignedUrl(student.photo_path, 600)).data?.signedUrl || null;
      return json({ ok: true, already_present: Boolean(existing), student: { id: student.id, name: student.student_full_name, training_time: student.training_time, belt: student.belt, belt_stripes: student.belt_stripes, photo_url } });
    }

    // Vincular cartao a um aluno aprovado (professor ou mestre). Trocar cartao ja vinculado exige mestre.
    if (body.action === "link_card") {
      const uid = normalizeUid(body.tag_uid);
      const id = String(body.enrollment_id || "");
      if (!uid || !id) return json({ error: "invalid_request" }, 400);
      const { data: student } = await supabase.from("student_enrollments").select("id").eq("id", id).eq("status", "approved").maybeSingle();
      if (!student) return json({ error: "not_found" }, 404);
      const hash = await sha256(uid);
      const { data: tagInUse } = await supabase.from("nfc_cards").select("enrollment_id").eq("tag_hash", hash).eq("status", "active").maybeSingle();
      if (tagInUse) return json({ error: tagInUse.enrollment_id === id ? "already_linked" : "tag_in_use" }, 409);
      const { data: current } = await supabase.from("nfc_cards").select("id").eq("enrollment_id", id).eq("status", "active").maybeSingle();
      if (current) {
        if (!isMestre) return json({ error: "student_has_card" }, 403);
        await supabase.from("nfc_cards").update({ status: "revoked", revoked_by: userId, revoked_at: new Date().toISOString(), revoke_reason: "replaced" }).eq("id", current.id);
      }
      const { error } = await supabase.from("nfc_cards").insert({ enrollment_id: id, tag_hash: hash, linked_by: userId });
      if (error) { console.error(`[staff] stage=link db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userId, event_type: current ? "nfc_card_replaced" : "nfc_card_linked" });
      return json({ ok: true });
    }

    // Cartao perdido: so mestre revoga.
    if (body.action === "revoke_card") {
      if (!isMestre) return json({ error: "forbidden" }, 403);
      const id = String(body.enrollment_id || "");
      const { error } = await supabase.from("nfc_cards").update({ status: "revoked", revoked_by: userId, revoked_at: new Date().toISOString(), revoke_reason: String(body.reason || "lost").slice(0, 60) }).eq("enrollment_id", id).eq("status", "active");
      if (error) { console.error(`[staff] stage=revoke db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userId, event_type: "nfc_card_revoked" });
      return json({ ok: true });
    }

    return json({ error: "invalid_request" }, 400);
  } catch (error) {
    console.error(`[staff] stage=unexpected message=${error instanceof Error ? error.message : "unknown"}`);
    return json({ error: "server_error" }, 500);
  }
});
