// Supabase browser client — used ONLY for CMS auth (Google sign-in).
//
// All data reads/writes still go through src/app/store/api.ts (raw fetch with
// the public anon key). This client exists purely so the CMS gate can
// authenticate an @arcsite.com Google identity. Auth always targets the
// configured cloud project (the OAuth provider is configured there), even in
// dev where the data API points at local Supabase. See .claude/decisions.md #9.
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
