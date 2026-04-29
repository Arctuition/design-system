import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAppData } from "../../store/data-store";
import {
  Home, Type, Palette, Image as ImageIcon, LayoutGrid,
  Settings, LogIn, LogOut, User,
  PanelLeftClose, PanelLeft,
  ChevronDown, FileText, Layers, Ruler,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import svgPaths from "../../../imports/svg-573fdnk0rv";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// ── Section config ────────────────────────────────────────────────────────

interface NavSection {
  path: string;
  label: string;
  icon: React.ElementType;
  children?: { path: string; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/typography", label: "Typography", icon: Type },
  { path: "/color", label: "Color", icon: Palette },
  { path: "/size", label: "Size & Space", icon: Ruler },
  { path: "/iconology", label: "Iconology", icon: ImageIcon },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function isPathActive(path: string, location: string): boolean {
  if (path === "/") return location === "/";
  return location === path || location.startsWith(path + "/");
}

function isSectionActive(section: NavSection, location: string): boolean {
  if (isPathActive(section.path, location)) return true;
  return section.children?.some((c) => isPathActive(c.path, location)) ?? false;
}

// ── Collapsible section ───────────────────────────────────────────────────

function NavSectionItem({
  section,
  sidebarOpen,
  location,
}: {
  section: NavSection;
  sidebarOpen: boolean;
  location: string;
}) {
  const active = isSectionActive(section, location);
  const [expanded, setExpanded] = useState(active);

  const hasChildren = section.children && section.children.length > 0;

  if (!sidebarOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={section.path}
            className={`flex items-center justify-center p-2 rounded-[var(--radius-card)] transition-colors ${
              active
                ? "bg-sidebar-accent text-primary"
                : "text-card-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <section.icon className="size-[18px]" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{section.label}</TooltipContent>
      </Tooltip>
    );
  }

  if (!hasChildren) {
    return (
      <Link
        to={section.path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] transition-colors ${
          active
            ? "bg-sidebar-accent text-primary"
            : "text-card-foreground hover:bg-sidebar-accent/50"
        }`}
        style={{ fontSize: "var(--text-p)" }}
      >
        <section.icon className="size-[18px] shrink-0" />
        <span>{section.label}</span>
      </Link>
    );
  }

  return (
    <div>
      {/* Parent row: Link navigates, chevron button toggles expand */}
      <div
        className={`flex items-center rounded-[var(--radius-card)] transition-colors ${
          active
            ? "bg-sidebar-accent text-primary"
            : "text-card-foreground hover:bg-sidebar-accent/50"
        }`}
      >
        <Link
          to={section.path}
          className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0"
          style={{ fontSize: "var(--text-p)" }}
        >
          <section.icon className="size-[18px] shrink-0" />
          <span className="truncate">{section.label}</span>
        </Link>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center px-2 py-2.5 shrink-0"
          title={expanded ? "Collapse" : "Expand"}
        >
          <ChevronDown
            className={`size-4 shrink-0 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
            style={{ opacity: 0.5 }}
          />
        </button>
      </div>

      {expanded && (
        <div
          className="flex flex-col gap-0.5 mt-0.5 ml-[15px] pl-[15px]"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          {section.children!.map((child) => {
            const childActive = location === child.path || location.startsWith(child.path + "/");
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-card)] transition-colors truncate ${
                  childActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-card-foreground hover:bg-sidebar-accent/50"
                }`}
                style={{ fontSize: "var(--text-label)" }}
              >
                <Layers className="size-[14px] shrink-0" style={{ opacity: 0.6 }} />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page title resolver ───────────────────────────────────────────────────

function resolveTitle(
  pathname: string,
  patterns: { id: string; title: string }[]
): string {
  if (pathname === "/") return "Home";
  if (pathname === "/typography") return "Typography";
  if (pathname === "/typography/tokens") return "Typography — Design Tokens";
  if (pathname === "/color") return "Color";
  if (pathname === "/color/tokens") return "Color — Design Tokens";
  if (pathname === "/color/swatches") return "Color — Swatches";
  if (pathname === "/size") return "Size & Space";
  if (pathname === "/size/tokens") return "Size & Space — Design Tokens";
  if (pathname === "/iconology") return "Iconology";
  if (pathname === "/patterns") return "Patterns";
  if (pathname === "/llms.txt") return "AI Reference";
  if (pathname.startsWith("/patterns/")) {
    const id = pathname.replace("/patterns/", "");
    const p = patterns.find((p) => p.id === id);
    return p ? p.title : "Patterns";
  }
  if (pathname.startsWith("/cms")) return "CMS";
  return "";
}

// ── Layout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patternsExpanded, setPatternsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout, patterns } = useAppData();

  const activePatterns = patterns.filter((p) => !p.deleted);
  const isPatternsActive =
    location.pathname === "/patterns" || location.pathname.startsWith("/patterns/");

  const pageTitle = resolveTitle(location.pathname, activePatterns);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-border bg-white transition-all duration-300 shrink-0"
        style={{ width: sidebarOpen ? 240 : 56, minWidth: sidebarOpen ? 240 : 56 }}
      >
        {/* Header */}
        {sidebarOpen ? (
          <div className="flex items-center justify-between h-[48px] px-4 bg-[#fafafa] border-b border-muted shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-[14px] relative shrink-0 w-[57px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 57 14">
                  <g clipPath="url(#clip0_sidebar_logo)">
                    <path d={svgPaths.p1789e900} fill="var(--foreground)" />
                    <path d={svgPaths.p1f3a2ef0} fill="var(--foreground)" />
                    <path d={svgPaths.p3dbda200} fill="var(--foreground)" />
                    <path d={svgPaths.p3fd86700} fill="var(--foreground)" />
                    <path d={svgPaths.p9e11f00} fill="var(--foreground)" />
                    <path d={svgPaths.p1d624600} fill="var(--foreground)" />
                    <path d={svgPaths.p12113580} fill="var(--foreground)" />
                  </g>
                  <defs>
                    <clipPath id="clip0_sidebar_logo">
                      <rect fill="white" height="14" width="57" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div className="w-px h-6 bg-foreground/10 shrink-0" />
              <span className="text-foreground opacity-90 truncate" style={{ fontSize: "var(--text-label)" }}>
                Design System
              </span>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center size-[28px] rounded-[var(--radius)] text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <PanelLeftClose className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[48px] bg-[#fafafa] border-b border-muted shrink-0">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center size-[28px] rounded-[var(--radius)] text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <PanelLeft className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className={`flex flex-col gap-1 ${sidebarOpen ? "px-3 py-3" : "p-1.5"}`}>
            <TooltipProvider delayDuration={300}>

              {/* Main sections */}
              {NAV_SECTIONS.map((section) => (
                <NavSectionItem
                  key={section.path}
                  section={section}
                  sidebarOpen={sidebarOpen}
                  location={location.pathname}
                />
              ))}

              {/* Patterns — foldable with dynamic children */}
              {sidebarOpen ? (
                <div>
                  <button
                    onClick={() => setPatternsExpanded(!patternsExpanded)}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-[var(--radius-card)] transition-colors ${
                      isPatternsActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-card-foreground hover:bg-sidebar-accent/50"
                    }`}
                    style={{ fontSize: "var(--text-p)" }}
                  >
                    <LayoutGrid className="size-[18px] shrink-0" />
                    <span className="flex-1 text-left">Patterns</span>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform duration-200 ${patternsExpanded ? "" : "-rotate-90"}`}
                      style={{ opacity: 0.5 }}
                    />
                  </button>
                  {patternsExpanded && activePatterns.length > 0 && (
                    <div
                      className="flex flex-col gap-0.5 mt-0.5 ml-[15px] pl-[15px]"
                      style={{ borderLeft: "1px solid var(--border)" }}
                    >
                      {activePatterns.map((pattern) => {
                        const isSubActive = location.pathname === `/patterns/${pattern.id}`;
                        return (
                          <Link
                            key={pattern.id}
                            to={`/patterns/${pattern.id}`}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-card)] transition-colors truncate ${
                              isSubActive
                                ? "bg-sidebar-accent text-primary"
                                : "text-card-foreground hover:bg-sidebar-accent/50"
                            }`}
                            style={{ fontSize: "var(--text-label)" }}
                          >
                            <FileText className="size-[14px] shrink-0" style={{ opacity: 0.6 }} />
                            <span className="truncate">{pattern.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/patterns"
                      className={`flex items-center justify-center p-2 rounded-[var(--radius-card)] transition-colors ${
                        isPatternsActive
                          ? "bg-sidebar-accent text-primary"
                          : "text-card-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <LayoutGrid className="size-[18px]" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Patterns</TooltipContent>
                </Tooltip>
              )}

            </TooltipProvider>
          </nav>
        </ScrollArea>

        {/* Footer — CMS entry */}
        <div
          className={`shrink-0 ${sidebarOpen ? "px-3 pt-[13px] pb-3" : "p-1.5"}`}
          style={{ backgroundColor: "var(--color-surface-container-high)", borderTop: "1px solid var(--border)" }}
        >
          {isAuthenticated ? (
            sidebarOpen ? (
              <div className="space-y-1">
                <div
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}
                >
                  <User className="size-4" />
                  <span className="truncate">{currentUser?.username}</span>
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded-[var(--radius)]"
                    style={{ fontSize: "11px", backgroundColor: "var(--color-fill-secondary)", color: "var(--color-label-secondary)" }}
                  >
                    {currentUser?.role}
                  </span>
                </div>
                <Link
                  to="/cms"
                  className="flex items-center gap-3 h-[41.5px] px-3 rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                  style={{ fontSize: "var(--text-p)" }}
                >
                  <Settings className="size-[18px]" />
                  <span>CMS Dashboard</span>
                </Link>
                <button
                  className="flex items-center gap-3 h-[41.5px] px-3 w-full rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                  onClick={() => { logout(); navigate("/"); }}
                >
                  <LogOut className="size-[18px]" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <TooltipProvider delayDuration={300}>
                <div className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/cms"
                        className="flex items-center justify-center p-2 rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                      >
                        <Settings className="size-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">CMS Dashboard</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center p-2 w-full rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                        onClick={() => { logout(); navigate("/"); }}
                      >
                        <LogOut className="size-[18px]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Sign Out</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )
          ) : (
            sidebarOpen ? (
              <Link
                to="/cms/login"
                className="flex items-center gap-3 h-[41.5px] px-3 rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                style={{ fontSize: "var(--text-p)" }}
              >
                <LogIn className="size-[18px]" />
                <span>CMS Login</span>
              </Link>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/cms/login"
                      className="flex items-center justify-center p-2 rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                    >
                      <LogIn className="size-[18px]" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">CMS Login</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Title bar */}
        <div className="flex items-center h-[48px] px-6 border-b border-border bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-3 text-foreground" style={{ fontSize: "var(--text-p)" }}>
            {!sidebarOpen && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-[14px] relative shrink-0 w-[57px]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 57 14">
                      <g clipPath="url(#clip0_logo_title)">
                        <path d={svgPaths.p1789e900} fill="var(--foreground)" />
                        <path d={svgPaths.p1f3a2ef0} fill="var(--foreground)" />
                        <path d={svgPaths.p3dbda200} fill="var(--foreground)" />
                        <path d={svgPaths.p3fd86700} fill="var(--foreground)" />
                        <path d={svgPaths.p9e11f00} fill="var(--foreground)" />
                        <path d={svgPaths.p1d624600} fill="var(--foreground)" />
                        <path d={svgPaths.p12113580} fill="var(--foreground)" />
                      </g>
                      <defs>
                        <clipPath id="clip0_logo_title">
                          <rect fill="white" height="14" width="57" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span className="text-foreground opacity-90" style={{ fontSize: "var(--text-label)" }}>
                    Design System
                  </span>
                </div>
                <div className="w-px h-5 bg-border shrink-0" />
              </>
            )}
            <span style={{ fontWeight: "var(--font-weight-medium)" }}>{pageTitle}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
