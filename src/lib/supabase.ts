import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ==========================================================
// SUPABASE AUTHENTICATION SERVICE
// ==========================================================

export async function supabaseSignUp(email: string, password: string, detectiveName: string) {
  if (!supabase) {
    throw new Error('Supabase configuration missing. Please configure NEXT_PUBLIC_SUPABASE_URL.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: detectiveName,
      },
    },
  });

  if (error) throw error;
  return { user: data.user, session: data.session, error: null };
}

export async function supabaseSignIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase configuration missing. Please configure NEXT_PUBLIC_SUPABASE_URL.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return { user: data.user, session: data.session, error: null };
}

export async function supabaseSignOut() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function supabaseGetSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function supabaseGetUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
