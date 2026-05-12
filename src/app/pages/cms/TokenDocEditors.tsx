import React from "react";
import { MarkdownEditorPage } from "../../components/shared/MarkdownEditorPage";

/**
 * Three thin route components that each bind `MarkdownEditorPage` to one of
 * the `tokenDocs` slots. The shared editor handles auth, dirty-state,
 * preview, and the KV save round-trip — these only configure the slot key
 * and the page chrome.
 */

export function ColorDocEditor() {
  return (
    <MarkdownEditorPage
      slot="color"
      title="Color reference doc"
      backTo="/cms/color-editor"
      backLabel="Back to Color Tokens"
    />
  );
}

export function SizeDocEditor() {
  return (
    <MarkdownEditorPage
      slot="size"
      title="Size & space reference doc"
      backTo="/cms/size-editor"
      backLabel="Back to Size Tokens"
    />
  );
}

export function TypographyDocEditor() {
  return (
    <MarkdownEditorPage
      slot="typography"
      title="Typography reference doc"
      backTo="/cms"
      backLabel="Back to CMS"
    />
  );
}
