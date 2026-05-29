// Who may sign in to the CMS to EDIT.
//
// Frontend gate ONLY (see .claude/decisions.md #9): this restricts the CMS UI,
// not the public write API. Everyone else can still VIEW the public site — it
// needs no login; only /cms/* is gated.
//
// Allowlist is per-email by default (the two maintainers below). Optionally a
// whole Google Workspace domain can be allowed via VITE_CMS_ALLOWED_DOMAINS.
// Both are configurable via Vite env (comma-separated); defaults below are kept
// in sync with `.env` so a missing `.env` can't silently widen access.
//
//   VITE_CMS_ALLOWED_EMAILS=a@arcsite.com,b@arcsite.com
//   VITE_CMS_ALLOWED_DOMAINS=arcsite.com           # optional: allow a whole domain
const parse = (v: string | undefined, fallback = ""): string[] =>
  (v ?? fallback)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// Default: only these two maintainers, no whole-domain access.
const ALLOWED_EMAILS = parse(
  import.meta.env.VITE_CMS_ALLOWED_EMAILS,
  "hongyu@arcsite.com,haowei@arcsite.com",
);
const ALLOWED_DOMAINS = parse(import.meta.env.VITE_CMS_ALLOWED_DOMAINS, "");

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  const domain = e.split("@")[1] ?? "";
  return ALLOWED_EMAILS.includes(e) || ALLOWED_DOMAINS.includes(domain);
}

/** Human-readable list of who can sign in — shown on the login screen. */
export const ALLOWED_LABEL = [
  ...ALLOWED_DOMAINS.map((d) => `@${d}`),
  ...ALLOWED_EMAILS,
].join(", ");

/** Domain used as Google's `hd` sign-in hint (preselects the Workspace in the
 *  account chooser). Falls back to the domain of the first allowed email when
 *  no whole-domain is configured. */
export const PRIMARY_ALLOWED_DOMAIN =
  ALLOWED_DOMAINS[0] ?? (ALLOWED_EMAILS[0]?.split("@")[1] ?? "");
