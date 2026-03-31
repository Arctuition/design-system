import { useRouteError } from "react-router";

export function ErrorPage() {
  const error = useRouteError() as Error | null;

  const handleReset = () => {
    try {
      localStorage.removeItem("ds-app-state");
    } catch {}
    window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-6">
      <div className="max-w-[480px] text-center">
        <h1
          className="text-foreground mb-3"
          style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-medium)" }}
        >
          Something went wrong
        </h1>
        <p
          className="text-muted-foreground mb-6"
          style={{ fontSize: "var(--text-p)" }}
        >
          The application encountered an unexpected error. This may be caused by
          corrupted local data. You can reset the app data and try again.
        </p>
        {error?.message && (
          <code
            className="block mb-6 p-3 bg-secondary text-card-foreground rounded-[var(--radius-card)] text-left overflow-auto"
            style={{ fontSize: "var(--text-label)" }}
          >
            {error.message}
          </code>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-border rounded-[var(--radius-card)] text-foreground hover:bg-secondary transition-colors"
            style={{ fontSize: "var(--text-p)" }}
          >
            Reload Page
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-card)] hover:opacity-90 transition-opacity"
            style={{ fontSize: "var(--text-p)" }}
          >
            Reset App Data
          </button>
        </div>
      </div>
    </div>
  );
}
