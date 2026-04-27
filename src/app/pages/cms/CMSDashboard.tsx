import React from "react";
import { Link, Navigate } from "react-router";
import { useAppData } from "../../store/data-store";
import {
  FileText, Palette, Image, LayoutGrid, Clock, Users, RefreshCw, Ruler
} from "lucide-react";

interface Section {
  path: string;
  label: string;
  description: string;
  icon: any;
  adminOnly?: boolean;
}

const sections: Section[] = [
  { path: "/cms/home-editor", label: "Home Page", description: "Edit the home page article content", icon: FileText },
  { path: "/cms/changelog-editor", label: "Change Log", description: "Manage version changelog entries", icon: Clock },
  { path: "/cms/typography-editor", label: "Typography", description: "Edit the typography article section", icon: FileText },
  { path: "/cms/color-editor", label: "Color Tokens", description: "Upload and manage color tokens", icon: Palette },
  { path: "/cms/size-editor", label: "Size & Space Tokens", description: "Upload and manage size tokens", icon: Ruler },
  { path: "/cms/icon-editor", label: "Iconology", description: "Upload, tag, and manage icons", icon: Image },
  { path: "/cms/patterns-editor", label: "Patterns", description: "Create, edit, and manage pattern articles", icon: LayoutGrid },
  { path: "/cms/accounts", label: "Accounts", description: "Manage editor accounts (admin only)", icon: Users },
  { path: "/admin/data-cleanup", label: "Data Cleanup", description: "Reset all content formatting to design system defaults", icon: RefreshCw, adminOnly: true },
];

export function CMSDashboard() {
  const { isAuthenticated, currentUser } = useAppData();

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--font-weight-normal)" }}>
        Content Management
      </h1>
      <p className="mt-2 text-card-foreground" style={{ fontSize: "var(--text-p)" }}>
        Welcome, {currentUser?.username}. Manage your design system content below.
      </p>
      <div className="h-px bg-border mt-6 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections
          .filter((s) => !s.adminOnly || currentUser?.role === "admin")
          .map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="flex items-start gap-4 p-5 border border-border rounded-[var(--radius-card)] hover:border-primary/50 hover:bg-secondary/20 transition-all"
            >
              <div className="size-10 rounded-[var(--radius-card)] bg-primary/10 flex items-center justify-center shrink-0">
                <section.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                  {section.label}
                </p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                  {section.description}
                </p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}