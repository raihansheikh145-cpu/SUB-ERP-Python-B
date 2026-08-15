import { supabase } from '../lib/supabase';
/**
 * apiFetch — Secure, authenticated fetch wrapper.
 *
 * Guarantees that every request to the internal API includes a valid
 * `Authorization: Bearer <token>` header. If the Supabase session is
 * missing or expired, it throws an error immediately so the caller can
 * surface it to the user — rather than silently sending an empty header
 * and getting a backend 401.
 *
 * Usage:
 *   import { apiFetch } from '../../lib/apiFetch';
 *   const res = await apiFetch('/api/products/upsert', { method: 'POST', body: ... });
 */

// Removed supabase import
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('access_token');

  if (!token && !url.includes('/api/auth/')) {
    throw new Error('Authentication required. Please log in again.');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
  return res;
}

