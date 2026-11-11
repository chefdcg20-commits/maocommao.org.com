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
        supabase.from("nfc_cards").select("enrollment_id, kind").eq("status", "active").in("enrollment_id", ids),
        supabase.from("attendance").select("enrollment_id").eq("session_date", date).in("enrollment_id", ids),
      ]);
      const withCard = new Set((cards || []).filter((c) => c.kind === "card").map((c) => c.enrollment_id));
      const withBelt = new Set((cards || []).filter((c) => c.kind === "belt").map((c) => c.enrollment_id));
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
          has_card: withCard.has(r.id), has_belt_tag: withBelt.has(r.id), present_today: presentSet.has(r.id),
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

    // Vincular chip (carteirinha ou faixa) a um aluno aprovado. Professor ou mestre.
    // Trocar a CARTEIRINHA ja vinculada exige mestre; o chip da FAIXA qualquer um da equipe troca (graduacao).
    if (body.action === "link_card") {
      const uid = normalizeUid(body.tag_uid);
      const id = String(body.enrollment_id || "");
      const kind = body.kind === "belt" ? "belt" : "card";
      if (!uid || !id) return json({ error: "invalid_request" }, 400);
      const { data: student } = await supabase.from("student_enrollments").select("id").eq("id", id).eq("status", "approved").maybeSingle();
      if (!student) return json({ error: "not_found" }, 404);
      const hash = await sha256(uid);
      const { data: tagInUse } = await supabase.from("nfc_cards").select("enrollment_id, kind").eq("tag_hash", hash).eq("status", "active").maybeSingle();
      if (tagInUse) return json({ error: tagInUse.enrollment_id === id ? "already_linked" : "tag_in_use" }, 409);
      const { data: current } = await supabase.from("nfc_cards").select("id").eq("enrollment_id", id).eq("kind", kind).eq("status", "active").maybeSingle();
      if (current) {
        if (!isMestre && kind === "card") return json({ error: "student_has_card" }, 403);
        await supabase.from("nfc_cards").update({ status: "revoked", revoked_by: userId, revoked_at: new Date().toISOString(), revoke_reason: "replaced" }).eq("id", current.id);
      }
      const { error } = await supabase.from("nfc_cards").insert({ enrollment_id: id, tag_hash: hash, kind, linked_by: userId });
      if (error) { console.error(`[staff] stage=link db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userId, event_type: current ? "nfc_card_replaced" : "nfc_card_linked", metadata: { kind } });
      return json({ ok: true });
    }

    // Chip perdido: so mestre revoga (so o tipo informado).
    if (body.action === "revoke_card") {
      if (!isMestre) return json({ error: "forbidden" }, 403);
      const id = String(body.enrollment_id || "");
      const kind = body.kind === "belt" ? "belt" : "card";
      const { error } = await supabase.from("nfc_cards").update({ status: "revoked", revoked_by: userId, revoked_at: new Date().toISOString(), revoke_reason: String(body.reason || "lost").slice(0, 60) }).eq("enrollment_id", id).eq("kind", kind).eq("status", "active");
      if (error) { console.error(`[staff] stage=revoke db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      await supabase.from("enrollment_events").insert({ enrollment_id: id, actor_id: userId, event_type: "nfc_card_revoked", metadata: { kind } });
      return json({ ok: true });
    }

    // Biblioteca: toda a equipe le (itens "todos" e "equipe").
    if (body.action === "library") {
      const { data } = await supabase.from("library_items").select("id, category, title, description, url, audience").eq("active", true).order("category").order("sort_order").order("created_at");
      return json({ items: data || [] });
    }

    // Leitura liberada a toda a equipe: avisos e conteudo informativo do hall.
    if (body.action === "announcements_list") {
      const { data } = await supabase.from("announcements").select("id, title, body, created_at").eq("active", true).order("created_at", { ascending: false }).limit(50);
      return json({ announcements: data || [] });
    }
    if (body.action === "content") {
      const { data } = await supabase.from("app_content").select("slug, title, body").order("sort_order").order("slug");
      return json({ sections: data || [] });
    }

    // ---- Daqui para baixo: so mestres ----
    if (!isMestre) return json({ error: "forbidden" }, 403);

    // Relatorio de presenca por periodo (padrao: mes atual). Filtro opcional por horario.
    if (body.action === "attendance_report") {
      const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
      const now = today();
      const from = isDate(body.from) ? String(body.from) : `${now.slice(0, 8)}01`;
      const to = isDate(body.to) ? String(body.to) : now;
      const time = ["18:00", "19:00", "20:00"].includes(body.training_time) ? body.training_time : null;
      let studentsQuery = supabase.from("student_enrollments").select("id, student_full_name, training_time, belt, belt_stripes").eq("status", "approved").order("student_full_name");
      if (time) studentsQuery = studentsQuery.eq("training_time", time);
      const { data: students, error } = await studentsQuery;
      if (error) { console.error(`[staff] stage=report db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      // O servidor devolve no maximo 1000 linhas por consulta: le em paginas.
      const rows: { enrollment_id: string; session_date: string }[] = [];
      for (let page = 0; page < 40; page++) {
        const { data: chunk, error: chunkError } = await supabase.from("attendance").select("enrollment_id, session_date")
          .gte("session_date", from).lte("session_date", to).order("session_date").order("enrollment_id").range(page * 1000, page * 1000 + 999);
        if (chunkError) { console.error(`[staff] stage=report_page db_code=${chunkError.code ?? "?"}`); return json({ error: "server_error" }, 500); }
        rows.push(...(chunk || []));
        if (!chunk || chunk.length < 1000) break;
      }
      const perStudent = new Map<string, string[]>();
      const days = new Set<string>();
      for (const r of rows || []) {
        days.add(r.session_date);
        if (!perStudent.has(r.enrollment_id)) perStudent.set(r.enrollment_id, []);
        perStudent.get(r.enrollment_id)!.push(r.session_date);
      }
      return json({
        from, to, training_days: days.size,
        students: students.map((s) => {
          const dates = (perStudent.get(s.id) || []).sort();
          return { id: s.id, name: s.student_full_name, training_time: s.training_time, belt: s.belt, belt_stripes: s.belt_stripes, count: dates.length, last: dates[dates.length - 1] || null, dates };
        }),
      });
    }

    // Caixa de mensagens da familia.
    if (body.action === "inbox") {
      const { data: msgs, error } = await supabase.from("family_messages").select("id, user_id, enrollment_id, body, created_at, read_at").order("created_at", { ascending: false }).limit(100);
      if (error) { console.error(`[staff] stage=inbox db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      const eIds = [...new Set(msgs.map((m) => m.enrollment_id))];
      const uIds = [...new Set(msgs.map((m) => m.user_id))];
      const [{ data: studs }, { data: fams }] = await Promise.all([
        eIds.length ? supabase.from("student_enrollments").select("id, student_full_name").in("id", eIds) : { data: [] },
        uIds.length ? supabase.from("family_accounts").select("user_id, full_name").in("user_id", uIds) : { data: [] },
      ]);
      const sName = new Map((studs || []).map((x) => [x.id, x.student_full_name]));
      const fName = new Map((fams || []).map((x) => [x.user_id, x.full_name]));
      return json({ messages: msgs.map((m) => ({ id: m.id, student: sName.get(m.enrollment_id) || "", from: fName.get(m.user_id) || "", body: m.body, created_at: m.created_at, read: Boolean(m.read_at) })) });
    }

    if (body.action === "mark_message_read") {
      const { error } = await supabase.from("family_messages").update({ read_at: new Date().toISOString(), read_by: userId }).eq("id", String(body.id || ""));
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true });
    }

    // Avisos para a familia.
    if (body.action === "announce") {
      const title = String(body.title || "").trim().slice(0, 120);
      const text = String(body.body || "").trim().slice(0, 2000);
      if (!title || !text) return json({ error: "missing_field" }, 400);
      const { error } = await supabase.from("announcements").insert({ title, body: text, created_by: userId });
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true });
    }
    if (body.action === "remove_announcement") {
      const { error } = await supabase.from("announcements").update({ active: false }).eq("id", String(body.id || ""));
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true });
    }

    // Contadores do hall: cadastros aguardando aprovacao e mensagens nao lidas.
    if (body.action === "summary") {
      const [pending, unread] = await Promise.all([
        supabase.from("student_enrollments").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review", "changes_requested"]),
        supabase.from("family_messages").select("id", { count: "exact", head: true }).is("read_at", null),
      ]);
      return json({ pending: pending.count || 0, unread: unread.count || 0 });
    }

    // Biblioteca: so mestres criam, editam e removem itens.
    if (body.action === "library_save") {
      const categories = ["videoaulas", "tecnicas", "defesa-pessoal", "documentos", "professores"];
      const category = String(body.category || "");
      const title = String(body.title || "").trim().slice(0, 160);
      const description = String(body.description || "").trim().slice(0, 2000) || null;
      const url = String(body.url || "").trim() || null;
      const audience = body.audience === "equipe" ? "equipe" : "todos";
      if (!categories.includes(category) || !title) return json({ error: "missing_field" }, 400);
      if (url && !/^https:\/\//i.test(url)) return json({ error: "invalid_url" }, 400);
      const row = { category, title, description, url, audience, updated_at: new Date().toISOString() };
      const id = String(body.id || "");
      const { error } = id
        ? await supabase.from("library_items").update(row).eq("id", id)
        : await supabase.from("library_items").insert({ ...row, created_by: userId });
      if (error) { console.error(`[staff] stage=library_save db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      return json({ ok: true });
    }
    if (body.action === "library_remove") {
      const { error } = await supabase.from("library_items").update({ active: false, updated_at: new Date().toISOString() }).eq("id", String(body.id || ""));
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true });
    }

    // Editar o conteudo informativo do hall.
    if (body.action === "save_content") {
      const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
      const title = String(body.title || "").trim().slice(0, 120);
      const text = String(body.body || "").slice(0, 6000);
      if (!slug || !title) return json({ error: "missing_field" }, 400);
      const { error } = await supabase.from("app_content").upsert({ slug, title, body: text, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "slug" });
      if (error) { console.error(`[staff] stage=save_content db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
      return json({ ok: true });
    }

    // Codigo de cadastro da familia (compartilhado so no grupo).
    if (body.action === "get_signup_code") {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "family_signup_code").maybeSingle();
      return json({ code: data?.value || "" });
    }
    if (body.action === "set_signup_code") {
      const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
      if (code.length < 6 || code.length > 24) return json({ error: "invalid_code" }, 400);
      const { error } = await supabase.from("app_settings").upsert({ key: "family_signup_code", value: code, updated_at: new Date().toISOString() });
      if (error) return json({ error: "server_error" }, 500);
      return json({ ok: true, code });
    }

    return json({ error: "invalid_request" }, 400);
  } catch (error) {
    console.error(`[staff] stage=unexpected message=${error instanceof Error ? error.message : "unknown"}`);
    return json({ error: "server_error" }, 500);
  }
});
