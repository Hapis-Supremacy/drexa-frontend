import { api } from "@/lib/api";

type BackendAuthResponse = {
  message?: string;
  error?: string;
};

export async function signInWithBackend(idToken: string): Promise<BackendAuthResponse> {
  return api.post<BackendAuthResponse>("/auth/login", { id_token: idToken });
}
