import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from './env';

/**
 * The session is NOT persisted by supabase-js. Only the refresh token is kept, in the iOS Keychain
 * (see secure.ts), and it is unlocked with Face ID on launch (see auth/session.tsx).
 */
export const supabase = createClient(env.supabaseUrl || 'https://placeholder.supabase.co', env.supabaseAnonKey || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
