import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAppData } from "../../store/data-store";
import {
  Home, Type, Palette, Image as ImageIcon, LayoutGrid,
  Settings, LogIn, LogOut, User,
  PanelLeftClose, PanelLeft,
  ChevronDown, FileText, Ruler, Layers
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import svgPaths from "../../../imports/svg-573fdnk0rv";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const navItemsTop = [
  { path: "/", label: "Home", icon: Home },
  { path: "/typography", label: "Typography", icon: Type },
];

const navItemsBottom = [
  { path: "/iconology", label: "Iconology", icon: ImageIcon },
];

const navItems = [...navItemsTop, ...navItemsBottom];

const tokenItems = [
  { path: "/tokens/color", label: "Color Tokens", icon: Palette },
  { path: "/tokens/size", label: "Size & Space", icon: Ruler },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patternsExpanded, setPatternsExpanded] = useState(true);
  const [tokensExpanded, setTokensExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout, patterns } = useAppData();

  const activePatterns = patterns.filter((p) => !p.deleted);
  const isPatternsActive = location.pathname === "/patterns" || location.pathname.startsWith("/patterns/");
  const isTokensActive = location.pathname.startsWith("/tokens");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-border bg-white transition-all duration-300 shrink-0"
        style={{ width: sidebarOpen ? 240 : 56, minWidth: sidebarOpen ? 240 : 56 }}
      >
        {/* Sidebar Header - Logo + fold/expand */}
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
                    title="Collapse sidebar"
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
                    title="Expand sidebar"
                  >
                    <PanelLeft className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className={`flex flex-col gap-1 ${sidebarOpen ? "px-3 py-3" : "p-1.5"}`}>
            <TooltipProvider delayDuration={300}>
              {(() => {
                const renderNavItem = (item: typeof navItems[number]) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(item.path));
                  return sidebarOpen ? (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-primary"
                          : "text-card-foreground hover:bg-sidebar-accent/50"
                      }`}
                      style={{ fontSize: "var(--text-p)" }}
                    >
                      <item.icon className="size-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={`flex items-center justify-center p-2 rounded-[var(--radius-card)] transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-primary"
                              : "text-card-foreground hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <item.icon className="size-[18px]" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                };
                return <>{navItemsTop.map(renderNavItem)}</>;
              })()}

              {/* Tokens - foldable section */}
              {sidebarOpen ? (
                <div>
                  <button
                    onClick={() => setTokensExpanded(!tokensExpanded)}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-[var(--radius-card)] transition-colors ${
                      isTokensActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-card-foreground hover:bg-sidebar-accent/50"
                    }`}
                    style={{ fontSize: "var(--text-p)" }}
                  >
                    <Layers className="size-[18px] shrink-0" />
                    <span className="flex-1 text-left">Tokens</span>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform duration-200 ${
                        tokensExpanded ? "" : "-rotate-90"
                      }`}
                      style={{ opacity: 0.5 }}
                    />
                  </button>
                  {tokensExpanded && (
                    <div className="flex flex-col gap-0.5 mt-0.5 ml-[15px] pl-[15px]" style={{ borderLeft: "1px solid var(--border)" }}>
                      {tokenItems.map((item) => {
                        const isSubActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-card)] transition-colors truncate ${
                              isSubActive
                                ? "bg-sidebar-accent text-primary"
                                : "text-card-foreground hover:bg-sidebar-accent/50"
                            }`}
                            style={{ fontSize: "var(--text-label)" }}
                          >
                            <item.icon className="size-[14px] shrink-0" style={{ opacity: 0.6 }} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {tokenItems.map((item) => {
                    const isSubActive = location.pathname === item.path;
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.path}
                            className={`flex items-center justify-center p-2 rounded-[var(--radius-card)] transition-colors ${
                              isSubActive
                                ? "bg-sidebar-accent text-primary"
                                : "text-card-foreground hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <item.icon className="size-[18px]" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </>
              )}

              {(() => {
                const renderNavItem = (item: typeof navItems[number]) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(item.path));
                  return sidebarOpen ? (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-primary"
                          : "text-card-foreground hover:bg-sidebar-accent/50"
                      }`}
                      style={{ fontSize: "var(--text-p)" }}
                    >
                      <item.icon className="size-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={`flex items-center justify-center p-2 rounded-[var(--radius-card)] transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-primary"
                              : "text-card-foreground hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <item.icon className="size-[18px]" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                };
                return <>{navItemsBottom.map(renderNavItem)}</>;
              })()}

              {/* Patterns - foldable section */}
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
                      className={`size-4 shrink-0 transition-transform duration-200 ${
                        patternsExpanded ? "" : "-rotate-90"
                      }`}
                      style={{ opacity: 0.5 }}
                    />
                  </button>
                  {patternsExpanded && activePatterns.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-0.5 ml-[15px] pl-[15px]" style={{ borderLeft: "1px solid var(--border)" }}>
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

        {/* Footer - CMS entry */}
        <div className={`shrink-0 ${sidebarOpen ? "px-3 pt-[13px] pb-3" : "p-1.5"}`} style={{ backgroundColor: "var(--color-surface-container-high)", borderTop: "1px solid var(--border)" }}>
          {isAuthenticated ? (
            sidebarOpen ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-1.5" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                  <User className="size-4" />
                  <span className="truncate">{currentUser?.username}</span>
                  <span className="ml-auto px-1.5 py-0.5 rounded-[var(--radius)]" style={{ fontSize: "11px", backgroundColor: "var(--color-fill-secondary)", color: "var(--color-label-secondary)" }}>
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

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Page title bar inside right content area */}
        <div className="flex items-center h-[48px] px-6 border-b border-border bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-3 text-foreground" style={{ fontSize: "var(--text-p)" }}>
            {/* Show logo + Design System when sidebar is folded */}
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
            {(() => {
              const allNav = [...navItems, ...tokenItems];
              const current = allNav.find(
                (n) => n.path === location.pathname || (n.path !== "/" && location.pathname.startsWith(n.path))
              );
              const isCms = location.pathname.startsWith("/cms");
              if (isCms) return <span style={{ fontWeight: "var(--font-weight-medium)" }}>CMS</span>;
              if (isPatternsActive) {
                const patternDetail = activePatterns.find((p) => location.pathname === `/patterns/${p.id}`);
                return patternDetail ? (
                  <span style={{ fontWeight: "var(--font-weight-medium)" }}>{patternDetail.title}</span>
                ) : (
                  <span style={{ fontWeight: "var(--font-weight-medium)" }}>Patterns</span>
                );
              }
              return current ? (
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>{current.label}</span>
              ) : (
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>Home</span>
              );
            })()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}