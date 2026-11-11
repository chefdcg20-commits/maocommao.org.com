import * as SecureStore from "expo-secure-store";

const ROOT = "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/";
export type Target = "staff" | "family" | "admin";
const ENDPOINT: Record<Target, string> = { staff: `${ROOT}staff-api`, family: `${ROOT}family-api`, admin: `${ROOT}admin-enrollments` };
const ACCESS = "mcm-access";
const REFRESH = "mcm-refresh";

export type Student = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  membership_number: string | null; photo_url: string | null; has_card: boolean; has_belt_tag: boolean; present_today: boolean;
};
export type ScanResult = {
  ok: true; already_present: boolean;
  student: { id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number; photo_url: string | null };
};
export type ReportStudent = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  count: number; last: string | null; dates: string[];
};
export type Report = { from: string; to: string; training_days: number; students: ReportStudent[] };
export type InboxMessage = { id: string; student: string; from: string; body: string; created_at: string; read: boolean };
export type Announcement = { id: string; title: string; body: string; created_at: string };
export type FamilyStudent = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  membership_number: string | null; card_valid_until: string | null; photo_url: string | null;
  attendance_total: number; attendance_month: number; last_attendance: string | null;
};
export type LibraryItem = { id: string; category: string; title: string; description: string | null; url: string | null; audience: string };
export type Section = { slug: string; title: string; body: string };
export type Enrollment = {
  id: string; status: string; student_full_name: string; birth_date: string | null; training_time: string | null; belt: string | null; belt_stripes: number;
  guardian_full_name: string | null; guardian_relationship: string | null; guardian_phone: string | null; guardian_email: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null; health_notes: string | null; image_consent: boolean | null;
  membership_number: string | null; card_valid_until: string | null; created_at: string; photo_url: string | null;
};
export type FamilyDetail = { attendance: string[]; belt_history: { at: string; belt: string | null; stripes: number }[] };

export class ApiError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  unauthorized: "Sessão expirada. Entre novamente.",
  forbidden: "Sua conta não tem permissão para esta ação.",
  card_not_linked: "Este chip ainda não está vinculado a nenhum aluno.",
  student_not_active: "Este aluno não está com cadastro aprovado.",
  invalid_tag: "Não foi possível ler o chip. Encoste de novo.",
  tag_in_use: "Este chip já está vinculado a outro aluno.",
  already_linked: "Este chip já está vinculado a este aluno.",
  student_has_card: "Este aluno já tem carteirinha vinculada. Só um mestre pode trocar.",
  not_found: "Não encontrado.",
  invalid_code: "Código do grupo incorreto.",
  email_in_use: "Já existe uma conta com este e-mail. Use Entrar.",
  weak_password: "A senha precisa ter pelo menos 8 caracteres.",
  missing_field: "Preencha todos os campos.",
  no_match: "Não encontramos um aluno com essa matrícula e data de nascimento. Confira a carteirinha.",
  too_many_attempts: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  no_sensei_signature: "Falta enviar a assinatura do sensei. Envie pelo painel do site e tente de novo.",
  network: "Sem conexão com a internet. Tente novamente.",
};
export const errorText = (error: unknown) =>
  error instanceof ApiError ? MESSAGES[error.code] || "Algo deu errado. Tente novamente." : "Algo deu errado. Tente novamente.";

async function post(target: Target, body: Record<string, unknown>, token?: string) {
  let response: Response;
  try {
    response = await fetch(ENDPOINT[target], {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("network", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(String(data?.error || "server_error"), response.status);
  return data;
}

async function saveTokens(data: { access_token: string; refresh_token?: string }) {
  await SecureStore.setItemAsync(ACCESS, data.access_token);
  if (data.refresh_token) await SecureStore.setItemAsync(REFRESH, data.refresh_token);
}

// O login e do Supabase Auth e vale para equipe e familia; o papel e descoberto depois.
export async function login(email: string, password: string) {
  await saveTokens(await post("staff", { action: "login", email: email.trim().toLowerCase(), password }));
}

export async function registerFamily(input: { code: string; name: string; email: string; password: string }) {
  await saveTokens(await post("family", { action: "register", ...input, email: input.email.trim().toLowerCase() }));
}

export async function logout() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

export async function hasSession() {
  return Boolean(await SecureStore.getItemAsync(ACCESS));
}

// Chamada autenticada; se o token vencer, tenta renovar uma vez.
export async function api<T = any>(body: Record<string, unknown>, target: Target = "staff"): Promise<T> {
  const token = (await SecureStore.getItemAsync(ACCESS)) || "";
  try {
    return await post(target, body, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const refresh = await SecureStore.getItemAsync(REFRESH);
    if (!refresh) throw error;
    try {
      const fresh = await post(target === "family" ? "family" : "staff", { action: "refresh", refresh_token: refresh });
      await saveTokens(fresh);
      return await post(target, body, fresh.access_token);
    } catch {
      await logout();
      throw new ApiError("unauthorized", 401);
    }
  }
}

export type Role = { kind: "mestre" | "professor" | "family"; name: string | null };

// Descobre quem entrou: equipe (mestre/professor) ou familia.
export async function detectRole(): Promise<Role | null> {
  try {
    const me = await api<{ role: "mestre" | "professor"; name: string | null }>({ action: "me" }, "staff");
    return { kind: me.role, name: me.name };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) throw error;
  }
  try {
    const me = await api<{ name: string }>({ action: "me" }, "family");
    return { kind: "family", name: me.name };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  }
}
