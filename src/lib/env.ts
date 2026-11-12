/** Public build-time settings (EXPO_PUBLIC_*). Nothing secret belongs here. */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, ''),
};

export const isConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.apiBaseUrl && !env.supabaseUrl.includes('your-project-ref'));
