// @ts-nocheck -- Supabase Edge Function executada pelo Deno, fora do compilador Next.js.
// Acesso publico a Biblioteca por CODIGO (pulseira ou QR da carteirinha do aluno). Sem login.
// So devolve itens da biblioteca marcados para "todos"; nenhum dado de aluno ou da equipe passa por aqui.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const adminKey = pickKey(Deno.env.get("SUPABASE_SECRET_KEYS"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    if (!adminKey) { console.error("[library] stage=config error=missing_keys"); return json({ error: "server_misconfigured" }, 500); }
    const supabase = createClient(url, adminKey, { auth: { persistSession: false } });
    const body = await request.json().catch(() => ({}));

    if (body.action !== "open") return json({ error: "invalid_request" }, 400);

    const token = String(body.token || "").trim();
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const bucket = `lib:${ip}`;
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase.from("rate_limits").select("id", { count: "exact", head: true }).eq("bucket", bucket).gte("created_at", since);
    if ((count || 0) >= 40) return json({ error: "too_many_attempts" }, 429);

    const valid = /^[A-Za-z0-9]{20,64}$/.test(token);
    const { data: key } = valid
      ? await supabase.from("access_keys").select("id, kind, label, status, uses").eq("token", token).maybeSingle()
      : { data: null };
    if (!key || key.status !== "active") {
      await supabase.from("rate_limits").insert({ bucket });
      return json({ error: "invalid_key" }, 403);
    }

    await supabase.from("access_keys").update({ last_used_at: new Date().toISOString(), uses: (key.uses || 0) + 1 }).eq("id", key.id);
    const { data: items, error } = await supabase.from("library_items").select("id, category, title, description, url, audience")
      .eq("active", true).eq("audience", "todos").order("category").order("sort_order").order("created_at");
    if (error) { console.error(`[library] stage=items db_code=${error.code ?? "?"}`); return json({ error: "server_error" }, 500); }
    return json({ kind: key.kind, items: items || [] });
  } catch (error) {
    console.error(`[library] stage=unexpected message=${error instanceof Error ? error.message : "unknown"}`);
    return json({ error: "server_error" }, 500);
  }
});
