import { createClient } from '@supabase/supabase-js';

// These are imported from your .env file via Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure .env file is set up correctly in the root of your 'mini-drama' project (e.g., C:/Users/rajes/Documents/projects/JOJO/mini-drama/.env) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  // You might want to throw an error here or handle it more gracefully
  // For now, this will allow the app to load but Supabase features will fail.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
