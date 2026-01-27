import { createBrowserClient } from '@supabase/ssr'

let client: any = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase environment variables are missing!');
    // Return a dummy object to prevent immediate crash
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      },
      from: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
          limit: () => ({ data: [], error: null }),
        }),
      }),
      channel: () => ({
        on: () => ({ subscribe: () => { } }),
        removeChannel: () => { }
      })
    } as any;
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
