import React from "react";
import { MarkdownEditorPage } from "../../components/shared/MarkdownEditorPage";

/**
 * Thin route components that each bind `MarkdownEditorPage` to one of the
 * `tokenDocs` slots. The shared editor handles auth, dirty-state, preview, and
 * the KV save round-trip — these only configure the slot key and the page
 * chrome. All Back links point at the CMS dashboard (these docs are their own
 * top-level CMS entries, not sub-pages of the token editors).
 */

export function ColorDocEditor() {
  return (
    <MarkdownEditorPage
      slot="color"
      title="Color reference doc"
      backTo="/cms"
      backLabel="Back to CMS"
    />
  );
}

export function SizeDocEditor() {
  return (
    <MarkdownEditorPage
      slot="size"
      title="Size & space reference doc"
      backTo="/cms"
      backLabel="Back to CMS"
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

export function IconologyDocEditor() {
  return (
    <MarkdownEditorPage
      slot="iconology"
      title="Iconology reference doc"
      backTo="/cms"
      backLabel="Back to CMS"
    />
  );
}
