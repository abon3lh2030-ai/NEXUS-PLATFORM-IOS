import { env } from './env';
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(code);
  }
}

let currentOrgId: string | null = null;
export const setApiOrg = (id: string | null) => {
  currentOrgId = id;
};

/** Calls the existing NEXUS API (all writes go through it; RLS blocks direct client writes by design). */
export async function api<T>(path: string, opts: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; org?: boolean } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  if (opts.org !== false && currentOrgId) headers['X-Organization-Id'] = currentOrgId;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, { method: opts.method ?? 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : null });
  } catch {
    throw new ApiError(0, 'network_error');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
    throw new ApiError(res.status, body.error ?? `http_${res.status}`, body.details);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
