import { Outlet } from "react-router";
import { DataProvider, useAppData } from "../../store/data-store";
import { Toaster } from "sonner";

function LoadingGate() {
  const { isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span
            className="text-muted-foreground"
            style={{ fontSize: "var(--text-label)" }}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function RootLayout() {
  return (
    <DataProvider>
      <LoadingGate />
      <Toaster position="bottom-right" richColors />
    </DataProvider>
  );
}