import React from "react";
import { Navigate } from "react-router";
import { useAppData } from "../../store/data-store";
import { ArticleEditorPage } from "../../components/shared/ArticleEditorPage";

export function ColorArticleEditor() {
  const { isAuthenticated, colorArticle, setColorArticle } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <ArticleEditorPage
      title="Edit Color Tokens Article"
      backTo="/cms/color-editor"
      backLabel="Back"
      articleKey="color"
      serverStateKey="colorArticle"
      initialValue={colorArticle}
      onSave={setColorArticle}
    />
  );
}
