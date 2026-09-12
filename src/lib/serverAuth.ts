import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

export function getServerSupabaseClient(token?: string) {
  if (!isServerSupabaseConfigured) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/**
 * Extracts and verifies the authenticated user from the incoming request.
 * Checks 'Authorization: Bearer <token>' header and cookies.
 */
export async function getAuthenticatedUser(request: Request | NextRequest) {
  if (!isServerSupabaseConfigured) {
    return { user: null, error: 'Database configuration missing', token: null };
  }

  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check cookies if header not present
  if (!token && 'cookies' in request) {
    const nextReq = request as NextRequest;
    const authCookie = nextReq.cookies.get('sb-access-token') || nextReq.cookies.get('supabase-auth-token');
    if (authCookie) {
      token = authCookie.value;
    }
  }

  if (!token) {
    return { user: null, error: 'Missing authentication token', token: null };
  }

  try {
    const serverClient = getServerSupabaseClient(token);
    if (!serverClient) {
      return { user: null, error: 'Server client initialization failed', token: null };
    }

    const { data, error } = await serverClient.auth.getUser(token);
    if (error || !data.user) {
      return { user: null, error: error?.message || 'Invalid authentication token', token: null };
    }

    return { user: data.user, error: null, token, client: serverClient };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed';
    return { user: null, error: message, token: null };
  }
}

/**
 * Helper to calculate non-linear XP thresholds
 * Formula: round(100 * Level^1.35)
 */
export function getXpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(Math.max(1, level), 1.35));
}
