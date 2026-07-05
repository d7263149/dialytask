import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, which bypasses Row Level
// Security entirely — every query here MUST filter by the caller's own
// user_id by hand (see src/lib/session.js for how the caller is
// identified). Never import this file from client components.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
