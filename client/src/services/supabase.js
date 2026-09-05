import { createClient } from '@supabase/supabase-js';

function cleanUrl(url) {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = cleanUrl(rawUrl);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback storage key when running offline/local
const LOCAL_AUTH_USERS_KEY = 'crowdpulse_local_users';
const LOCAL_SESSION_KEY = 'crowdpulse_local_session';

/**
 * Register a real new user with Email, Password, Full Name, and Role
 */
export async function authSignUp({ email, password, fullName, role = 'visitor' }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  // Fallback Local Auth (Simulated Supabase behavior)
  const existingUsers = JSON.parse(localStorage.getItem(LOCAL_AUTH_USERS_KEY) || '[]');
  if (existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    email,
    password, // Stored locally for offline testing
    user_metadata: {
      full_name: fullName,
      role,
    },
  };

  existingUsers.push(newUser);
  localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(existingUsers));

  const session = {
    access_token: role === 'organizer' ? 'dev-organizer-token' : 'dev-visitor-token',
    user: newUser,
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

  return { user: newUser, session };
}

/**
 * Sign In with real Email & Password
 */
export async function authSignIn({ email, password }) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Fallback Local Auth
  const existingUsers = JSON.parse(localStorage.getItem(LOCAL_AUTH_USERS_KEY) || '[]');
  const foundUser = existingUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!foundUser) {
    throw new Error('Invalid email or password. Please verify your credentials or register.');
  }

  const role = foundUser.user_metadata?.role || 'visitor';
  const session = {
    access_token: role === 'organizer' ? 'dev-organizer-token' : 'dev-visitor-token',
    user: foundUser,
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

  return { user: foundUser, session };
}

/**
 * Sign Out
 */
export async function authSignOut() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

/**
 * Get current session on application boot
 */
export async function getActiveSession() {
  if (isSupabaseConfigured && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  try {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
