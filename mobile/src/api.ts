import * as SecureStore from "expo-secure-store";

const BASE = "https://dfggzyonudpsiyjkkmeh.supabase.co/functions/v1/staff-api";
const ACCESS = "mcm-access";
const REFRESH = "mcm-refresh";

export type Student = {
  id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number;
  membership_number: string | null; photo_url: string | null; has_card: boolean; present_today: boolean;
};
export type ScanResult = {
  ok: true; already_present: boolean;
  student: { id: string; name: string; training_time: string | null; belt: string | null; belt_stripes: number; photo_url: string | null };
};

export class ApiError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  unauthorized: "Sessão expirada. Entre novamente.",
  forbidden: "Sua conta não tem permissão para esta ação.",
  card_not_linked: "Este cartão ainda não está vinculado a nenhum aluno.",
  student_not_active: "Este aluno não está com cadastro aprovado.",
  invalid_tag: "Não foi possível ler o cartão. Encoste de novo.",
  tag_in_use: "Este cartão já está vinculado a outro aluno.",
  already_linked: "Este cartão já está vinculado a este aluno.",
  student_has_card: "Este aluno já tem cartão. Só um mestre pode trocar.",
  not_found: "Aluno não encontrado.",
  network: "Sem conexão com a internet. Tente novamente.",
};
export const errorText = (error: unknown) =>
  error instanceof ApiError ? MESSAGES[error.code] || "Algo deu errado. Tente novamente." : "Algo deu errado. Tente novamente.";

async function post(body: Record<string, unknown>, token?: string) {
  let response: Response;
  try {
    response = await fetch(BASE, {
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

export async function login(email: string, password: string) {
  await saveTokens(await post({ action: "login", email: email.trim().toLowerCase(), password }));
}

export async function logout() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

export async function hasSession() {
  return Boolean(await SecureStore.getItemAsync(ACCESS));
}

// Chamada autenticada; se o token vencer, tenta renovar uma vez.
export async function api<T = any>(body: Record<string, unknown>): Promise<T> {
  const token = (await SecureStore.getItemAsync(ACCESS)) || "";
  try {
    return await post(body, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const refresh = await SecureStore.getItemAsync(REFRESH);
    if (!refresh) throw error;
    try {
      const fresh = await post({ action: "refresh", refresh_token: refresh });
      await saveTokens(fresh);
      return await post(body, fresh.access_token);
    } catch {
      await logout();
      throw new ApiError("unauthorized", 401);
    }
  }
}
