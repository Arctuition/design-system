import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { HomePage } from "./pages/HomePage";
import { TypographyPage } from "./pages/TypographyPage";
import { TypographyTokensPage } from "./pages/TypographyTokensPage";
import { ColorPage } from "./pages/ColorPage";
import { ColorTokensPage } from "./pages/ColorTokensPage";
import { ColorSwatchesPage } from "./pages/ColorSwatchesPage";
import { SizePage } from "./pages/SizePage";
import { SizeTokensPage } from "./pages/SizeTokensPage";
import { IconologyPage } from "./pages/IconologyPage";
import { PatternsPage } from "./pages/PatternsPage";
import { PatternDetailPage } from "./pages/PatternDetailPage";
import { LlmsPage } from "./pages/LlmsPage";
import { LoginPage } from "./pages/cms/LoginPage";
import { CMSDashboard } from "./pages/cms/CMSDashboard";
import { HomeEditor, HomeArticleEditor } from "./pages/cms/HomeEditor";
import { ChangeLogEditor } from "./pages/cms/ChangeLogEditor";
import { ColorTokensEditor } from "./pages/cms/ColorTokensEditor";
import { ColorArticleEditor } from "./pages/cms/ColorArticleEditor";
import { SizeTokensEditor } from "./pages/cms/SizeTokensEditor";
import { SizeArticleEditor } from "./pages/cms/SizeArticleEditor";
import { IconEditor, IconArticleEditor } from "./pages/cms/IconEditor";
import { PatternsEditor } from "./pages/cms/PatternsEditor";
import { PatternArticleEditor } from "./pages/cms/PatternArticleEditor";
import { AccountManager } from "./pages/cms/AccountManager";
import { DataCleanup } from "./components/admin/DataCleanup";

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
          { index: true, Component: HomePage },

          // Typography
          { path: "typography", Component: TypographyPage },
          { path: "typography/tokens", Component: TypographyTokensPage },

          // Color
          { path: "color", Component: ColorPage },
          { path: "color/tokens", Component: ColorTokensPage },
          { path: "color/swatches", Component: ColorSwatchesPage },

          // Size & Space
          { path: "size", Component: SizePage },
          { path: "size/tokens", Component: SizeTokensPage },

          // Iconology & Patterns
          { path: "iconology", Component: IconologyPage },
          { path: "patterns", Component: PatternsPage },
          { path: "patterns/:id", Component: PatternDetailPage },

          // AI reference
          { path: "llms.txt", Component: LlmsPage },

          // CMS
          { path: "cms/login", Component: LoginPage },
          { path: "cms", Component: CMSDashboard },
          { path: "cms/home-editor", Component: HomeEditor },
          { path: "cms/home-editor/edit", Component: HomeArticleEditor },
          { path: "cms/changelog-editor", Component: ChangeLogEditor },
          { path: "cms/color-editor", Component: ColorTokensEditor },
          { path: "cms/color-editor/article", Component: ColorArticleEditor },
          { path: "cms/size-editor", Component: SizeTokensEditor },
          { path: "cms/size-editor/article", Component: SizeArticleEditor },
          { path: "cms/icon-editor", Component: IconEditor },
          { path: "cms/icon-editor/article", Component: IconArticleEditor },
          { path: "cms/patterns-editor", Component: PatternsEditor },
          { path: "cms/patterns-editor/:id/edit", Component: PatternArticleEditor },
          { path: "cms/accounts", Component: AccountManager },
          { path: "admin/data-cleanup", Component: DataCleanup },
        ],
      },
    ],
  },
]);
