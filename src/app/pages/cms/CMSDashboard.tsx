import React from "react";
import { Link, Navigate } from "react-router";
import { useAppData } from "../../store/data-store";
import {
  FileText, Palette, Image, LayoutGrid, Clock, RefreshCw, Ruler, Type, BookText
} from "lucide-react";

interface Section {
  path: string;
  label: string;
  description: string;
  icon: any;
  adminOnly?: boolean;
}

// Ordered to mirror the public navigation (Home → Typography → Color →
// Size & Space → Iconology → Patterns). Editors are grouped by the nav section
// they belong to, and within a section the reference Doc comes first (it's the
// page the nav item lands on) followed by that section's token/asset editor.
// Keep this in step with NAV_SECTIONS in AppLayout.tsx.
const sections: Section[] = [
  // Home
  { path: "/cms/home-editor", label: "Home Page", description: "Edit the home page article content", icon: FileText },
  { path: "/cms/changelog-editor", label: "Change Log", description: "Manage version changelog entries", icon: Clock },
  // Typography
  { path: "/cms/typography-editor", label: "Typography Doc", description: "Edit the /typography reference Markdown", icon: BookText },
  { path: "/cms/font-editor", label: "Font Tokens", description: "Upload and manage font tokens", icon: Type },
  // Color
  { path: "/cms/color-editor/doc", label: "Color Doc", description: "Edit the /color reference Markdown", icon: BookText },
  { path: "/cms/color-editor", label: "Color Tokens", description: "Upload and manage color tokens", icon: Palette },
  // Size & Space
  { path: "/cms/size-editor/doc", label: "Size & Space Doc", description: "Edit the /size reference Markdown", icon: BookText },
  { path: "/cms/size-editor", label: "Size & Space Tokens", description: "Upload and manage size tokens", icon: Ruler },
  // Iconology
  { path: "/cms/icon-editor/doc", label: "Iconology Doc", description: "Edit the /iconology reference Markdown", icon: BookText },
  { path: "/cms/icon-editor", label: "Icon Library", description: "Upload, tag, and manage icons", icon: Image },
  // Patterns
  { path: "/cms/patterns-editor", label: "Patterns", description: "Create, edit, and manage pattern articles", icon: LayoutGrid },
  // Admin
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