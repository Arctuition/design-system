import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { HomePage } from "./pages/HomePage";

// Strip trailing slash so react-router accepts it as a basename. When the app
// is hosted at the root (custom domain / user-site repo), BASE_URL is "/" and
// basename becomes "" which react-router treats as no basename.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// Helper: turn a dynamic import into a route module react-router can mount.
// React Router 7's `lazy` route option expects an object with `Component`.
const lazyComponent = (
  loader: () => Promise<Record<string, any>>,
  exportName: string,
) => async () => {
  const m = await loader();
  return { Component: m[exportName] };
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        path: "/",
        Component: AppLayout,
        children: [
          // Landing page is eager — we always need it on first paint.
          { index: true, Component: HomePage },

          // Typography
          { path: "typography", lazy: lazyComponent(() => import("./pages/TypographyPage"), "TypographyPage") },
          { path: "typography/tokens", lazy: lazyComponent(() => import("./pages/TypographyTokensPage"), "TypographyTokensPage") },

          // Color
          { path: "color", lazy: lazyComponent(() => import("./pages/ColorPage"), "ColorPage") },
          { path: "color/tokens", lazy: lazyComponent(() => import("./pages/ColorTokensPage"), "ColorTokensPage") },
          { path: "color/swatches", lazy: lazyComponent(() => import("./pages/ColorSwatchesPage"), "ColorSwatchesPage") },

          // Size & Space
          { path: "size", lazy: lazyComponent(() => import("./pages/SizePage"), "SizePage") },
          { path: "size/tokens", lazy: lazyComponent(() => import("./pages/SizeTokensPage"), "SizeTokensPage") },

          // Iconology & Patterns
          { path: "iconology", lazy: lazyComponent(() => import("./pages/IconologyPage"), "IconologyPage") },
          { path: "iconology/library", lazy: lazyComponent(() => import("./pages/IconLibraryPage"), "IconLibraryPage") },
          { path: "patterns", lazy: lazyComponent(() => import("./pages/PatternsPage"), "PatternsPage") },
          { path: "patterns/:id", lazy: lazyComponent(() => import("./pages/PatternDetailPage"), "PatternDetailPage") },

          // AI reference
          { path: "llms.txt", lazy: lazyComponent(() => import("./pages/LlmsPage"), "LlmsPage") },

          // CMS — heavy editors (Shiki, jszip, react-dnd, etc.) all stay out of the main bundle
          { path: "cms/login", lazy: lazyComponent(() => import("./pages/cms/LoginPage"), "LoginPage") },
          { path: "cms", lazy: lazyComponent(() => import("./pages/cms/CMSDashboard"), "CMSDashboard") },
          { path: "cms/home-editor", lazy: lazyComponent(() => import("./pages/cms/HomeEditor"), "HomeEditor") },
          { path: "cms/home-editor/edit", lazy: lazyComponent(() => import("./pages/cms/HomeEditor"), "HomeArticleEditor") },
          { path: "cms/changelog-editor", lazy: lazyComponent(() => import("./pages/cms/ChangeLogEditor"), "ChangeLogEditor") },
          { path: "cms/color-editor", lazy: lazyComponent(() => import("./pages/cms/ColorTokensEditor"), "ColorTokensEditor") },
          { path: "cms/size-editor", lazy: lazyComponent(() => import("./pages/cms/SizeTokensEditor"), "SizeTokensEditor") },
          { path: "cms/font-editor", lazy: lazyComponent(() => import("./pages/cms/FontTokensEditor"), "FontTokensEditor") },
          { path: "cms/color-editor/doc", lazy: lazyComponent(() => import("./pages/cms/TokenDocEditors"), "ColorDocEditor") },
          { path: "cms/size-editor/doc", lazy: lazyComponent(() => import("./pages/cms/TokenDocEditors"), "SizeDocEditor") },
          { path: "cms/typography-editor", lazy: lazyComponent(() => import("./pages/cms/TokenDocEditors"), "TypographyDocEditor") },
          { path: "cms/icon-editor", lazy: lazyComponent(() => import("./pages/cms/IconEditor"), "IconEditor") },
          { path: "cms/icon-editor/doc", lazy: lazyComponent(() => import("./pages/cms/TokenDocEditors"), "IconologyDocEditor") },
          { path: "cms/patterns-editor", lazy: lazyComponent(() => import("./pages/cms/PatternsEditor"), "PatternsEditor") },
          { path: "cms/patterns-editor/:id/edit", lazy: lazyComponent(() => import("./pages/cms/PatternArticleEditor"), "PatternArticleEditor") },
          // cms/accounts (username/password editor management) retired — auth is
          // now Google Workspace via Supabase Auth. See .claude/decisions.md #9.
          { path: "admin/data-cleanup", lazy: lazyComponent(() => import("./components/admin/DataCleanup"), "DataCleanup") },
        ],
      },

      // Catch-all 404 lives outside AppLayout so the design fills the
      // full viewport (no sidebar/topbar chrome), matching the Figma
      // responsive frames. GitHub Pages also routes unknown paths
      // through 404.html (copied from index.html by the vite
      // spaFallback plugin), so this handles both server-side misses
      // and in-app navigation to missing routes.
      { path: "*", lazy: lazyComponent(() => import("./pages/NotFoundPage"), "NotFoundPage") },
    ],
  },
], { basename });
