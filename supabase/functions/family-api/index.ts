// @ts-nocheck -- Supabase Edge Function executada pelo Deno, fora do compilador Next.js.
// API da familia (pais/responsaveis e alunos adultos): cadastro com codigo do grupo, vinculo ao aluno por
// matricula + data de nascimento, acompanhamento (presencas, faixa) e mensagens para os mestres.
// Cada conta so enxerga os alunos que ela mesma vinculou.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*", // o app Android nao tem origem web; toda acao exige token
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

const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
const norm = (value: unknown) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const adminKey = pickKey(Deno.env.get("SUPABASE_SECRET_KEYS"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const publicKey = pickKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"), Deno.env.get("SUPABASE_ANON_KEY"));
    if (!adminKey || !publicKey) { console.error("[family] stage=config error=missing_keys"); return json({ error: "server_misconfigured" }, 500); }

    const body = await request.json().catch(() => ({}));
    const supabase = createClient(url, adminKey, { auth: { persistSession: false } });

    const passwordLogin = async (email: string, password: string) => {
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: publicKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return null;
      const session = await response.json();
      return { access_token: session.access_token, refresh_token: session.refresh_token, expires_in: session.expires_in };
    };

    // Limite de tentativas erradas por hora.
    const failures = async (bucket: string) => {
      const since = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await supabase.from("rate_limits").select("id", { count: "exact", head: true }).eq("bucket", bucket).gte("created_at", since);
      return count || 0;
    };
    const fail = (bucket: string) => supabase.from("rate_limits").insert({ bucket });

    if (body.action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password) return json({ error: "invalid_credentials" }, 401);
      const session = await passwordLogin(email, password);
      if (!session) return json({ error: "invalid_credentials" }, 401);
      return json(session);
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

    // Cadastro da familia: exige o codigo que so os mestres divulgam no grupo.
    if (body.action === "register") {
      const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
      const bucket = `reg:${ip}`;
      if ((await failures(bucket)) >= 8) return json({ error: "too_many_attempts" }, 429);
      const { data: setting } = await supabase.from("app_settings").select("value").eq("key", "family_signup_code").maybeSingle();
      if (!setting || norm(body.code) !== norm(setting.value)) { await fail(bucket); return json({ error: "invalid_code" }, 403); }
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim().slice(0, 120);
      if (!EMAIL.test(email) || name.length < 3) return json({ error: "missing_field" }, 400);
      if (password.length < 8) return json({ error: "weak_password" }, 400);
      const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data?.user) {
        const text = String(created.error?.message || "").toLowerCase();
        if (text.includes("already") || text.includes("registered") || text.includes("exists")) return json({ error: "email_in_use" }, 409);
        console.error(`[family] stage=create_user message=${created.error?.message ?? "unknown"}`);
        return json({ error: "server_error" }, 500);
      }
      const { error } = await supabase.from("family_accounts").insert({ user_id: created.data.user.id, full_name: name });
      if (error) { console.error(`[family] stage=register db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      const session = await passwordLogin(email, password);
      return session ? json(session) : json({ error: "server_error" }, 500);
    }

    // ---- Acoes autenticadas ----
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;
    const { data: account } = await supabase.from("family_accounts").select("full_name").eq("user_id", userId).maybeSingle();
    if (!account) return json({ error: "forbidden" }, 403);

    if (body.action === "me") return json({ name: account.full_name });

    const linkedIds = async () => {
      const { data } = await supabase.from("family_links").select("enrollment_id").eq("user_id", userId);
      return (data || []).map((l) => l.enrollment_id);
    };

    // Alunos vinculados a esta conta (so aprovados).
    if (body.action === "students") {
      const ids = await linkedIds();
      if (!ids.length) return json({ students: [] });
      const { data: rows } = await supabase.from("student_enrollments")
        .select("id, student_full_name, training_time, photo_path, belt, belt_stripes, membership_number, card_valid_until")
        .in("id", ids).eq("status", "approved").order("student_full_name");
      const since = `${today().slice(0, 8)}01`;
      const { data: att } = await supabase.from("attendance").select("enrollment_id, session_date").in("enrollment_id", ids);
      const total = new Map<string, number>();
      const month = new Map<string, number>();
      const last = new Map<string, string>();
      for (const a of att || []) {
        total.set(a.enrollment_id, (total.get(a.enrollment_id) || 0) + 1);
        if (a.session_date >= since) month.set(a.enrollment_id, (month.get(a.enrollment_id) || 0) + 1);
        if (!last.get(a.enrollment_id) || a.session_date > last.get(a.enrollment_id)!) last.set(a.enrollment_id, a.session_date);
      }
      const paths = (rows || []).map((r) => r.photo_path).filter(Boolean);
      const photos: Record<string, string> = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("student-photos").createSignedUrls(paths, 3600);
        for (const item of signed || []) if (item.path && item.signedUrl) photos[item.path] = item.signedUrl;
      }
      return json({
        students: (rows || []).map((r) => ({
          id: r.id, name: r.student_full_name, training_time: r.training_time, belt: r.belt, belt_stripes: r.belt_stripes,
          membership_number: r.membership_number, card_valid_until: r.card_valid_until, photo_url: photos[r.photo_path] || null,
          attendance_total: total.get(r.id) || 0, attendance_month: month.get(r.id) || 0, last_attendance: last.get(r.id) || null,
        })),
      });
    }

    // Vincular um aluno: matricula + data de nascimento precisam bater com um cadastro APROVADO.
    if (body.action === "link_student") {
      const bucket = `link:${userId}`;
      if ((await failures(bucket)) >= 6) return json({ error: "too_many_attempts" }, 429);
      const membership = norm(body.membership_number);
      const birth = String(body.birth_date || "");
      if (!membership || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return json({ error: "missing_field" }, 400);
      const { data: candidates } = await supabase.from("student_enrollments").select("id, membership_number, birth_date")
        .eq("status", "approved").eq("birth_date", birth).not("membership_number", "is", null);
      const match = (candidates || []).find((c) => norm(c.membership_number) === membership);
      if (!match) { await fail(bucket); return json({ error: "no_match" }, 404); }
      const relationship = body.relationship === "proprio" ? "proprio" : "responsavel";
      const { error } = await supabase.from("family_links").upsert({ user_id: userId, enrollment_id: match.id, relationship }, { onConflict: "user_id,enrollment_id", ignoreDuplicates: true });
      if (error) { console.error(`[family] stage=link db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: match.id, actor_id: userId, event_type: "family_linked", metadata: { relationship } });
      return json({ ok: true });
    }

    if (body.action === "unlink_student") {
      const { error } = await supabase.from("family_links").delete().eq("user_id", userId).eq("enrollment_id", String(body.enrollment_id || ""));
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true });
    }

    // Detalhe de um aluno vinculado: presencas dos ultimos 180 dias e historico de faixa.
    if (body.action === "student_detail") {
      const id = String(body.enrollment_id || "");
      if (!(await linkedIds()).includes(id)) return json({ error: "not_found" }, 404);
      const sinceDate = new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);
      const [{ data: att }, { data: events }] = await Promise.all([
        supabase.from("attendance").select("session_date").eq("enrollment_id", id).gte("session_date", sinceDate).order("session_date", { ascending: false }),
        supabase.from("enrollment_events").select("created_at, metadata").eq("enrollment_id", id).eq("event_type", "belt_changed").order("created_at", { ascending: false }).limit(30),
      ]);
      return json({
        attendance: (att || []).map((a) => a.session_date),
        belt_history: (events || []).map((e) => ({ at: e.created_at, belt: e.metadata?.belt ?? null, stripes: e.metadata?.stripes ?? 0 })),
      });
    }

    // Mensagem/sugestao da familia para os mestres.
    if (body.action === "send_message") {
      const id = String(body.enrollment_id || "");
      const text = String(body.body || "").trim().slice(0, 1000);
      if (!text) return json({ error: "missing_field" }, 400);
      if (!(await linkedIds()).includes(id)) return json({ error: "not_found" }, 404);
      const since = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await supabase.from("family_messages").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
      if ((count || 0) >= 10) return json({ error: "too_many_attempts" }, 429);
      const { error } = await supabase.from("family_messages").insert({ user_id: userId, enrollment_id: id, body: text });
      if (error) { console.error(`[family] stage=message db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      return json({ ok: true });
    }

    if (body.action === "announcements") {
      const { data } = await supabase.from("announcements").select("id, title, body, created_at").eq("active", true).order("created_at", { ascending: false }).limit(30);
      return json({ announcements: data || [] });
    }

    return json({ error: "invalid_request" }, 400);
  } catch (error) {
    console.error(`[family] stage=unexpected message=${error instanceof Error ? error.message : "unknown"}`);
    return json({ error: "server_error" }, 500);
  }
});
