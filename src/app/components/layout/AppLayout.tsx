import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { LibraryIcon } from "../shared/LibraryIcon";
import { ThemeToggle } from "./ThemeToggle";

// Arctuition lockup — official brand asset from /public/logos. The dark
// variant swaps in via the .dark class so the mark stays legible on dark
// surfaces. See tokens-color.md → Brand assets.
const LOGO_LIGHT = `${import.meta.env.BASE_URL}logos/glyph-and-text.svg`;
const LOGO_DARK = `${import.meta.env.BASE_URL}logos/glyph-and-text-on-dark.svg`;

function BrandLockup() {
  return (
    <Link
      to="/"
      aria-label="Go to home"
      className="flex items-center shrink-0 rounded-[var(--radius)] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={LOGO_LIGHT}
        alt="ArcSite"
        className="block dark:hidden"
        style={{ height: 20, width: "auto" }}
      />
      <img
        src={LOGO_DARK}
        alt="ArcSite"
        className="hidden dark:block"
        style={{ height: 20, width: "auto" }}
      />
    </Link>
  );
}

// ── Section config ────────────────────────────────────────────────────────

interface NavSection {
  path: string;
  label: string;
  // Library-icon name. We resolve loosely (case-insensitive prefix) via
  // LibraryIcon → useAppData(), so seed-default names like "Home" and
  // prod names like "home 24x24" both match. Color and Size & Space have
  // no clean library equivalent today, so the entries pass an empty
  // string and the icon slot stays blank — better than a wrong icon.
  libraryIcon: string;
  children?: { path: string; label: string }[];
}

// Use the explicit `... 24x24` library names so LibraryIcon's exact-match
// path lands on the design-system icon and bypasses the legacy lucide-style
// "Home"/"Settings" entries still living in `defaultIcons`.
const NAV_SECTIONS: NavSection[] = [
  { path: "/", label: "Home", libraryIcon: "home 24x24" },
  { path: "/typography", label: "Typography", libraryIcon: "text 24x24" },
  { path: "/color", label: "Color", libraryIcon: "color pallette 24x24" },
  { path: "/size", label: "Size & Space", libraryIcon: "annotation 24x24" },
  { path: "/iconology", label: "Iconology", libraryIcon: "shapes 24x24" },
];

function NavIcon({ section, size = 24 }: { section: NavSection; size?: number }) {
  // Library icons named "X 24x24" are designed to render at 24px — using
  // a smaller size compresses internal padding and stroke weight.
  return <LibraryIcon name={section.libraryIcon} size={size} />;
}

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
            <NavIcon section={section} />
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
        <NavIcon section={section} />
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
          <NavIcon section={section} />
          <span className="truncate">{section.label}</span>
        </Link>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center px-2 py-2.5 shrink-0"
          title={expanded ? "Collapse" : "Expand"}
        >
          <span
            className={`transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
            style={{ opacity: 0.5, lineHeight: 0 }}
          >
            <LibraryIcon name="chevron down 16x16" size={16} />
          </span>
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
                <span style={{ opacity: 0.6, lineHeight: 0 }}>
                  <LibraryIcon name="layers" size={24} />
                </span>
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
        className="flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0"
        style={{ width: sidebarOpen ? 240 : 56, minWidth: sidebarOpen ? 240 : 56 }}
      >
        {/* Header */}
        {sidebarOpen ? (
          <div className="flex items-center justify-between h-[48px] px-4 bg-secondary border-b border-muted shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLockup />
              <div className="w-px h-6 bg-foreground/10 shrink-0" />
              <span className="text-foreground opacity-90 truncate" style={{ fontSize: "var(--text-label)" }}>
                Design Hub
              </span>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center size-[28px] rounded-[var(--radius)] text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <LibraryIcon name="menu hamburger" size={24} ariaLabel="Collapse sidebar" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[48px] bg-secondary border-b border-muted shrink-0">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center justify-center size-[28px] rounded-[var(--radius)] text-secondary-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <LibraryIcon name="menu hamburger" size={24} ariaLabel="Expand sidebar" />
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
                    <LibraryIcon name="grid 24x24" size={24} />
                    <span className="flex-1 text-left">Patterns</span>
                    <span
                      className={`transition-transform duration-200 ${patternsExpanded ? "" : "-rotate-90"}`}
                      style={{ opacity: 0.5, lineHeight: 0 }}
                    >
                      <LibraryIcon name="chevron down 16x16" size={16} />
                    </span>
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
                            <span style={{ opacity: 0.6, lineHeight: 0 }}>
                              <LibraryIcon name="file" size={24} />
                            </span>
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
                      <LibraryIcon name="grid 24x24" size={24} />
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
          className={`shrink-0 border-t border-border bg-secondary ${sidebarOpen ? "px-3 pt-[13px] pb-3" : "p-1.5"}`}
        >
          {isAuthenticated ? (
            sidebarOpen ? (
              <div className="space-y-1">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  <LibraryIcon name="user circle 16x16" size={16} />
                  <span className="truncate">{currentUser?.username}</span>
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded-[var(--radius)] bg-muted text-muted-foreground"
                    style={{ fontSize: "11px" }}
                  >
                    {currentUser?.role}
                  </span>
                </div>
                <Link
                  to="/cms"
                  className="flex items-center gap-3 h-[41.5px] px-3 rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                  style={{ fontSize: "var(--text-p)" }}
                >
                  <LibraryIcon name="setting" size={24} />
                  <span>CMS Dashboard</span>
                </Link>
                <button
                  className="flex items-center gap-3 h-[41.5px] px-3 w-full rounded-[var(--radius-card)] text-foreground transition-colors hover:bg-sidebar-accent/50"
                  onClick={() => { logout(); navigate("/"); }}
                >
                  <LibraryIcon name="logout" size={24} />
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
                        <LibraryIcon name="setting" size={24} />
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
                        <LibraryIcon name="logout" size={24} />
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
                <LibraryIcon name="lock" size={24} />
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
                      <LibraryIcon name="lock" size={24} />
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
        <div className="flex items-center justify-between h-[48px] px-6 border-b border-border bg-secondary shrink-0">
          <div className="flex items-center gap-3 text-foreground min-w-0" style={{ fontSize: "var(--text-p)" }}>
            {!sidebarOpen && (
              <>
                <div className="flex items-center gap-3">
                  <BrandLockup />
                  <span className="text-foreground opacity-90" style={{ fontSize: "var(--text-label)" }}>
                    Design Hub
                  </span>
                </div>
                <div className="w-px h-5 bg-border shrink-0" />
              </>
            )}
            <span style={{ fontWeight: "var(--font-weight-medium)" }} className="truncate">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
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
