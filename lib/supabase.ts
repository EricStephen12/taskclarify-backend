import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use placeholders during build time if environment variables are missing
// to avoid "supabaseUrl is required" error during "next build"
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'pbkdf2_placeholder' // service role key usually has a certain format but any string avoids the direct init error
);
