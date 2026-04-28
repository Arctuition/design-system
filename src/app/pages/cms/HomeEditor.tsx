import React from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { ArticleEditorPage } from "../../components/shared/ArticleEditorPage";

export function HomeEditor() {
  const { isAuthenticated } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <Link to="/cms" className="flex items-center gap-1.5 text-primary mb-6 hover:underline" style={{ fontSize: "var(--text-label)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
        Home Page Article
      </h1>
      <div className="h-px bg-border mt-3 mb-6" />

      <div className="border border-border rounded-[var(--radius-card)] p-5 bg-secondary/10">
        <p className="text-card-foreground mb-3" style={{ fontSize: "var(--text-p)" }}>
          Edit the Home page article content in the full-page editor with version history, auto-save protection, and rich formatting tools.
        </p>
        <Link to="/cms/home-editor/edit">
          <Button type="button">
            <Pencil className="size-4 mr-1.5" /> Open Editor
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function HomeArticleEditor() {
  const { isAuthenticated, homeArticle, setHomeArticle } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <ArticleEditorPage
      title="Edit Home Page Article"
      backTo="/cms/home-editor"
      backLabel="Back"
      articleKey="home"
      serverStateKey="homeArticle"
      initialValue={homeArticle}
      onSave={setHomeArticle}
    />
  );
}