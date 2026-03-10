const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData ? undefined : {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, data: unknown)  => request<T>(path, { method: "POST",   body: data instanceof FormData ? data : JSON.stringify(data) }),
  put:    <T>(path: string, data: unknown)  => request<T>(path, { method: "PUT",    body: JSON.stringify(data) }),
  patch:  <T>(path: string, data: unknown)  => request<T>(path, { method: "PATCH",  body: JSON.stringify(data) }),
  delete: <T>(path: string, data?: unknown)  => request<T>(path, { method: "DELETE", ...(data ? { body: JSON.stringify(data) } : {}) }),
};

export const BASE_URL = BASE;
