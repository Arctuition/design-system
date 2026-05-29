// Who may use the CMS.
//
// Frontend gate ONLY (see .claude/decisions.md #9): this restricts the CMS UI,
// not the public write API. Configurable via Vite env (comma-separated);
// defaults to the arcsite.com Google Workspace.
//
//   VITE_CMS_ALLOWED_DOMAINS=arcsite.com,example.com
//   VITE_CMS_ALLOWED_EMAILS=someone@gmail.com
//
// Keep these in sync with any future server-side check if the gate is ever
// upgraded to real backend enforcement.
const parse = (v: string | undefined, fallback = ""): string[] =>
  (v ?? fallback)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const ALLOWED_DOMAINS = parse(import.meta.env.VITE_CMS_ALLOWED_DOMAINS, "arcsite.com");
const ALLOWED_EMAILS = parse(import.meta.env.VITE_CMS_ALLOWED_EMAILS);

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  const domain = e.split("@")[1] ?? "";
  return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(e);
}

/** Human-readable label for the login screen, e.g. "arcsite.com". */
export const ALLOWED_DOMAINS_LABEL = ALLOWED_DOMAINS.join(", ");

/** Primary domain, used as Google's `hd` sign-in hint. */
export const PRIMARY_ALLOWED_DOMAIN = ALLOWED_DOMAINS[0] ?? "";
