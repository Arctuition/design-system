import React from "react";
import { Navigate } from "react-router";
import { useAppData } from "../../store/data-store";
import { ArticleEditorPage } from "../../components/shared/ArticleEditorPage";

export function SizeArticleEditor() {
  const { isAuthenticated, sizeArticle, setSizeArticle } = useAppData();
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  return (
    <ArticleEditorPage
      title="Edit Size & Space Tokens Article"
      backTo="/cms/size-editor"
      backLabel="Back"
      articleKey="size"
      initialValue={sizeArticle}
      onSave={setSizeArticle}
    />
  );
}
