import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { HomePage } from "./pages/HomePage";
import { TypographyPage } from "./pages/TypographyPage";
import { ColorTokensPage } from "./pages/ColorTokensPage";
import { SizeTokensPage } from "./pages/SizeTokensPage";
import { IconologyPage } from "./pages/IconologyPage";
import { PatternsPage } from "./pages/PatternsPage";
import { PatternDetailPage } from "./pages/PatternDetailPage";
import { LoginPage } from "./pages/cms/LoginPage";
import { CMSDashboard } from "./pages/cms/CMSDashboard";
import { HomeEditor, HomeArticleEditor } from "./pages/cms/HomeEditor";
import { ChangeLogEditor } from "./pages/cms/ChangeLogEditor";
import { TypographyEditor, TypographyArticleEditor } from "./pages/cms/TypographyEditor";
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
          { path: "typography", Component: TypographyPage },
          { path: "tokens/color", Component: ColorTokensPage },
          { path: "tokens/size", Component: SizeTokensPage },
          { path: "iconology", Component: IconologyPage },
          { path: "patterns", Component: PatternsPage },
          { path: "patterns/:id", Component: PatternDetailPage },
          { path: "cms/login", Component: LoginPage },
          { path: "cms", Component: CMSDashboard },
          { path: "cms/home-editor", Component: HomeEditor },
          { path: "cms/home-editor/edit", Component: HomeArticleEditor },
          { path: "cms/changelog-editor", Component: ChangeLogEditor },
          { path: "cms/typography-editor", Component: TypographyEditor },
          { path: "cms/typography-editor/edit", Component: TypographyArticleEditor },
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