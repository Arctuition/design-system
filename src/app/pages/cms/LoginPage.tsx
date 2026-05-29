import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { LogIn } from "lucide-react";
import { ALLOWED_DOMAINS_LABEL } from "/utils/supabase/allowlist";

export function LoginPage() {
  const { isAuthenticated, loginWithGoogle } = useAppData();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. returning to /cms/login with a live session)? Go in.
  useEffect(() => {
    if (isAuthenticated) navigate("/cms", { replace: true });
  }, [isAuthenticated, navigate]);

  // The auth effect in data-store sets this flag when a signed-in Google
  // account is outside the allowlist and gets bounced back out.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cms-auth-error") === "domain") {
        setError(`That Google account isn't allowed. Sign in with your @${ALLOWED_DOMAINS_LABEL} account.`);
        sessionStorage.removeItem("cms-auth-error");
      }
    } catch {
      /* sessionStorage unavailable — no-op */
    }
  }, []);

  const handleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      // Redirects to Google, then back to /cms — this promise usually doesn't
      // resolve in-page. The catch handles the rare synchronous failure.
      await loginWithGoogle();
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Couldn't start Google sign-in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full px-4">
      <div className="w-full max-w-[400px] p-8 border border-border rounded-[var(--radius-card)] bg-card">
        <div className="flex items-center gap-2 mb-2">
          <LogIn className="size-5 text-primary" />
          <h2 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-medium)" }}>
            CMS Login
          </h2>
        </div>

        <p className="text-muted-foreground mb-6" style={{ fontSize: "var(--text-label)" }}>
          Sign in with your <strong>@{ALLOWED_DOMAINS_LABEL}</strong> Google Workspace account.
        </p>

        {error && (
          <p className="text-destructive mb-4" style={{ fontSize: "var(--text-label)" }}>
            {error}
          </p>
        )}

        <Button type="button" className="w-full" onClick={handleSignIn} disabled={submitting}>
          {submitting ? "Redirecting…" : "Sign in with Google"}
        </Button>
      </div>
    </div>
  );
}
