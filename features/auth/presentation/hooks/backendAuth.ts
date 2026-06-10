type BackendAuthResponse = {
  message?: string;
  error?: string;
};

export async function signInWithBackend(idToken: string): Promise<BackendAuthResponse> {
  const res = await fetch("/api/v1/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id_token: idToken }),
  });

  const body = (await res.json().catch(() => ({}))) as BackendAuthResponse;

  if (!res.ok) {
    throw new Error(body.error ?? "Authentication failed");
  }

  return body;
}
