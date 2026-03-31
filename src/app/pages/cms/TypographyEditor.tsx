import React from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { ArticleEditorPage } from "../../components/shared/ArticleEditorPage";

export function TypographyEditor() {
  const { isAuthenticated } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <Link to="/cms" className="flex items-center gap-1.5 text-primary mb-6 hover:underline" style={{ fontSize: "var(--text-label)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
        Typography Article
      </h1>
      <div className="h-px bg-border mt-3 mb-6" />

      <div className="border border-border rounded-[var(--radius-card)] p-5 bg-secondary/10">
        <p className="text-card-foreground mb-3" style={{ fontSize: "var(--text-p)" }}>
          Edit the Typography article content in the full-page editor.
        </p>
        <Link to="/cms/typography-editor/edit">
          <Button type="button">
            <Pencil className="size-4 mr-1.5" /> Open Editor
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TypographyArticleEditor() {
  const { isAuthenticated, typographyArticle, setTypographyArticle } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <ArticleEditorPage
      title="Edit Typography Article"
      backTo="/cms/typography-editor"
      backLabel="Back"
      articleKey="typography"
      initialValue={typographyArticle}
      onSave={setTypographyArticle}
    />
  );
}