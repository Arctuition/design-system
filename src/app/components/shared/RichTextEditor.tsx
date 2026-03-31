import React, { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Bold, Italic, Underline, List, ListOrdered,
  Image, Table, Minus, Undo, Redo, AlignLeft, AlignCenter, AlignRight,
  Trash2, ArrowDown, ArrowRight, TableCellsMerge, TableCellsSplit,
  X, Upload, ChevronDown, LayoutTemplate, AlertCircle, Copy, Scissors,
  ClipboardPaste,
} from "lucide-react";
import { ColorPickerDropdown, parseColorToHex } from "./RteColorPicker";

// ─── Module-level clipboard ───────────────────────────────────────────────────
// Stores the last cut/copied rich element for reliable paste within the session.
let rteClipboard: { html: string; kind: "image" | "table" } | null = null;
// Monotonically-increasing counter – bumped on every toolbar/keyboard copy/cut
// so the paste handler can prefer the internal clipboard over stale system data.
let rteClipboardGen = 0;

/** Write HTML to the system clipboard (text/html) with a plain-text fallback. */
async function writeHTMLToClipboard(html: string): Promise<void> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" }),
      }),
    ]);
  } catch {
    // ClipboardItem may be blocked in some browsers – silent fallback.
    // The module-level `rteClipboard` will still be available for paste.
  }
}

/** Convert markdown syntax to HTML when pasting */
function parseMarkdownToHTML(text: string): string {
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let inBlockquote = false;
  let blockquoteContent: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushBlockquote = () => {
    if (blockquoteContent.length > 0) {
      result.push(`<blockquote>${blockquoteContent.join('')}</blockquote>`);
      blockquoteContent = [];
      inBlockquote = false;
    }
  };

  const flushList = () => {
    if (listItems.length > 0 && inList) {
      const tag = inList === 'ul' ? 'ul' : 'ol';
      result.push(`<${tag}>${listItems.join('')}</${tag}>`);
      listItems = [];
      inList = null;
    }
  };

  const processInlineMarkdown = (line: string): string => {
    // Note: We don't escape HTML entities at the start because we're generating HTML tags
    // The browser's insertHTML will handle escaping of text content
    
    // Inline code first (to avoid processing markdown inside code)
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Images: ![alt](url)
    line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // Links: [text](url)
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Strikethrough: ~~text~~
    line = line.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // Bold: **text** or __text__ (before italic to handle ***text***)
    line = line.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    line = line.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    line = line.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    return line;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        flushBlockquote();
        flushList();
        const escapedCode = codeBlockContent
          .join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        result.push(`<pre><code>${escapedCode}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
        codeBlockLang = '';
        continue;
      } else {
        // Start code block
        flushBlockquote();
        flushList();
        inCodeBlock = true;
        codeBlockLang = trimmed.substring(3).trim();
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      if (!inBlockquote) {
        flushList();
        inBlockquote = true;
      }
      const content = processInlineMarkdown(trimmed.substring(2));
      blockquoteContent.push(`<p>${content}</p>`);
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Horizontal rule: ---, ***, or ___
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushBlockquote();
      flushList();
      result.push('<hr>');
      continue;
    }

    // Headings: # H1 through ###### H6
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushBlockquote();
      flushList();
      const level = headingMatch[1].length;
      const content = processInlineMarkdown(headingMatch[2]);
      result.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    // Task list: - [ ] or - [x]
    const taskMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)/);
    if (taskMatch) {
      flushBlockquote();
      const checked = taskMatch[1].toLowerCase() === 'x';
      const content = processInlineMarkdown(taskMatch[2]);
      
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      
      const checkbox = checked 
        ? '<input type="checkbox" checked disabled style="margin-right: 8px;" />'
        : '<input type="checkbox" disabled style="margin-right: 8px;" />';
      listItems.push(`<li style="list-style: none;">${checkbox}${content}</li>`);
      continue;
    }

    // Unordered list: - item or * item
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      flushBlockquote();
      const content = processInlineMarkdown(ulMatch[1]);
      
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      
      listItems.push(`<li>${content}</li>`);
      continue;
    }

    // Ordered list: 1. item
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      flushBlockquote();
      const content = processInlineMarkdown(olMatch[1]);
      
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      
      listItems.push(`<li>${content}</li>`);
      continue;
    }

    // If we reach here and have an active list, flush it
    if (inList) {
      flushList();
    }

    // Empty line
    if (trimmed === '') {
      flushBlockquote();
      flushList();
      result.push('<p><br></p>');
      continue;
    }

    // Regular paragraph
    flushBlockquote();
    flushList();
    const content = processInlineMarkdown(trimmed);
    result.push(`<p>${content}</p>`);
  }

  // Flush any remaining blocks
  flushBlockquote();
  flushList();
  
  // Close any remaining code block
  if (inCodeBlock) {
    const escapedCode = codeBlockContent
      .join('\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    result.push(`<pre><code>${escapedCode}</code></pre>`);
  }

  return result.join('');
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  blockFormat: string;
  unorderedList: boolean;
  orderedList: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  /** Set when the cursor is inside a figcaption, fig-description field, or table header. */
  contextStyle: "FIGCAPTION" | "FIG-DESCRIPTION" | "TH" | null;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave?: () => void;
  className?: string;
  stickyToolbar?: boolean;
  borderless?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_STYLE_OPTIONS = [
  { value: "P",               label: "Normal Text", readOnly: false },
  { value: "H1",              label: "Heading 1",   readOnly: false },
  { value: "H2",              label: "Heading 2",   readOnly: false },
  { value: "H3",              label: "Heading 3",   readOnly: false },
  { value: "H4",              label: "Heading 4",   readOnly: false },
  { value: "H5",              label: "Heading 5",   readOnly: false },
  { value: "H6",              label: "Heading 6",   readOnly: false },
  { value: "FIGCAPTION",      label: "Caption (Image)",    readOnly: true  },
  { value: "FIG-DESCRIPTION", label: "Description (Image)", readOnly: true  },
  { value: "TH",              label: "Header (Table)",      readOnly: true  },
];

const HEADING_TAGS = new Set(["H1","H2","H3","H4","H5","H6"]);

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function getParentTable(node: Node | null): HTMLTableElement | null {
  let c = node;
  while (c) {
    if (c.nodeType === 1 && (c as HTMLElement).tagName === "TABLE") return c as HTMLTableElement;
    c = c.parentNode;
  }
  return null;
}

function getParentCell(node: Node | null): HTMLTableCellElement | null {
  let c = node;
  while (c) {
    if (c.nodeType === 1 && ["TD","TH"].includes((c as HTMLElement).tagName))
      return c as HTMLTableCellElement;
    c = c.parentNode;
  }
  return null;
}

function getParentFigure(node: Node | null): HTMLElement | null {
  let c = node;
  while (c) {
    if (c.nodeType === 1 && (c as HTMLElement).tagName === "FIGURE") return c as HTMLElement;
    c = c.parentNode;
  }
  return null;
}

function isInsideFigcaption(node: Node | null): boolean {
  let c = node;
  while (c) {
    if (c.nodeType === 1) {
      const tag = (c as HTMLElement).tagName;
      if (tag === "FIGCAPTION") return true;
      if (tag === "FIGURE" || tag === "DIV") break;
    }
    c = c.parentNode;
  }
  return false;
}

function getParentHeading(node: Node | null, root: Node | null): HTMLElement | null {
  let c = node;
  while (c && c !== root) {
    if (c.nodeType === 1 && HEADING_TAGS.has((c as HTMLElement).tagName)) return c as HTMLElement;
    c = c.parentNode;
  }
  return null;
}

function getParentColumnLayout(node: Node | null, root: Node | null): HTMLElement | null {
  let c = node;
  while (c && c !== root) {
    if (c.nodeType === 1 && (c as HTMLElement).hasAttribute("data-rte-cols")) return c as HTMLElement;
    c = c.parentNode;
  }
  return null;
}

function getParentColumn(node: Node | null, root: Node | null): HTMLElement | null {
  let c = node;
  while (c && c !== root) {
    if (c.nodeType === 1 && (c as HTMLElement).hasAttribute("data-rte-col")) return c as HTMLElement;
    c = c.parentNode;
  }
  return null;
}

/**
 * Returns true when the cursor (collapsed range) is at the very first character
 * position inside `el`. Walks up the ancestor chain verifying offset===0 and
 * that each node is the first meaningful (non-empty-text) child of its parent.
 */
function cursorIsAtElementStart(range: Range, el: HTMLElement): boolean {
  if (!range.collapsed) return false;
  let node: Node | null = range.startContainer;
  let offset = range.startOffset;
  while (node && node !== el) {
    if (offset !== 0) return false;
    const parent = node.parentNode;
    if (!parent) return false;
    let first: Node | null = parent.firstChild;
    while (first && first.nodeType === 3 && (first as Text).data === "") first = first.nextSibling;
    if (first !== node) return false;
    node = parent;
    offset = 0;
  }
  return node === el;
}

/** Check if a field (caption/description) has any real text content. */
function fieldHasContent(el: HTMLElement): boolean {
  return (el.textContent || "").trim().length > 0;
}

/**
 * Sync the data-empty attribute on a caption or description field.
 * Sets data-empty when the field has no real text, removes it otherwise.
 */
function syncEmptyAttr(el: HTMLElement): void {
  if (fieldHasContent(el)) {
    el.removeAttribute("data-empty");
  } else {
    // Clear any leftover browser artifacts (e.g. <br>, empty <p>) so the
    // field is truly empty for consistent behaviour.
    el.innerHTML = "";
    el.setAttribute("data-empty", "");
  }
}

/**
 * Walk all caption and description fields inside the container and sync
 * their data-empty attribute. Also strips any legacy placeholder spans.
 * Returns true if any DOM changes were made.
 */
function syncAllEmptyAttrs(container: HTMLElement): boolean {
  let changed = false;
  const fields = container.querySelectorAll<HTMLElement>(
    "figcaption, [data-role='fig-description']"
  );
  fields.forEach((el) => {
    // Strip legacy placeholder spans if present (from older saved content)
    el.querySelectorAll("[data-rte-placeholder]").forEach((ph) => {
      ph.remove();
      changed = true;
    });
    const hadEmpty = el.hasAttribute("data-empty");
    const hasContent = fieldHasContent(el);
    if (hasContent && hadEmpty) {
      el.removeAttribute("data-empty");
      changed = true;
    } else if (!hasContent && !hadEmpty) {
      el.innerHTML = "";
      el.setAttribute("data-empty", "");
      changed = true;
    }
  });
  return changed;
}

/**
 * Migrate legacy figcaption / fig-description inline styles to match the
 * current design system spec:
 *   figcaption  → bold (font-weight-medium) + italic, primary label colour, no border
 *   fig-description → regular + italic, secondary label colour
 * Returns true if any DOM changes were made.
 */
function migrateFigureStyles(container: HTMLElement): boolean {
  let changed = false;
  container.querySelectorAll<HTMLElement>("figure figcaption").forEach((el) => {
    const s = el.style;
    let dirty = false;
    if (s.borderBottom || s.getPropertyValue("border-bottom")) {
      s.removeProperty("border-bottom");
      s.removeProperty("border-bottom-width");
      s.removeProperty("border-bottom-style");
      s.removeProperty("border-bottom-color");
      dirty = true;
    }
    if (s.fontStyle !== "italic") { s.fontStyle = "italic"; dirty = true; }
    if (s.fontWeight !== "var(--font-weight-medium)" && s.fontWeight !== "600") {
      s.fontWeight = "var(--font-weight-medium)";
      dirty = true;
    }
    if (s.color !== "var(--color-label-primary)") {
      s.color = "var(--color-label-primary)";
      dirty = true;
    }
    if (dirty) changed = true;
  });
  container.querySelectorAll<HTMLElement>("figure [data-role='fig-description']").forEach((el) => {
    const s = el.style;
    let dirty = false;
    if (s.fontStyle !== "italic") { s.fontStyle = "italic"; dirty = true; }
    if (s.fontWeight && s.fontWeight !== "normal" && s.fontWeight !== "400" && s.fontWeight !== "var(--font-weight-normal)") {
      s.fontWeight = "var(--font-weight-normal)";
      dirty = true;
    }
    if (s.color !== "var(--color-label-secondary)") {
      s.color = "var(--color-label-secondary)";
      dirty = true;
    }
    if (dirty) changed = true;
  });
  return changed;
}

/** Walk up the tree to find the nearest FIGCAPTION or [data-role=fig-description] ancestor. */
function getCaptionOrDescParent(node: Node | null, root: Node | null): HTMLElement | null {
  let c = node;
  while (c && c !== root) {
    if (c.nodeType === 1) {
      const el = c as HTMLElement;
      if (el.tagName === "FIGCAPTION" || el.getAttribute("data-role") === "fig-description") return el;
    }
    c = c.parentNode;
  }
  return null;
}

/** Strip <table> and [data-rte-cols] elements from an HTML string, keeping their text. */
function stripComplexElementsFromHTML(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  // Remove column layout wrappers (replace with inner text)
  div.querySelectorAll("[data-rte-cols]").forEach((el) => {
    const p = document.createElement("p");
    p.textContent = el.textContent || "";
    el.replaceWith(p);
  });
  // Remove tables (replace with plain text wrapped in <p>)
  div.querySelectorAll("table").forEach((el) => {
    const p = document.createElement("p");
    p.textContent = el.textContent || "";
    el.replaceWith(p);
  });
  // Remove figures / images
  div.querySelectorAll("figure").forEach((el) => el.remove());
  return div.innerHTML;
}

function snapToColumns(widthPx: number, containerPx: number): number {
  const colWidth = containerPx / 12;
  return Math.max(1, Math.min(12, Math.round(widthPx / colWidth)));
}

function figureColumns(fig: HTMLElement): number {
  const w = fig.style.width;
  if (!w) return 12;
  const pct = parseFloat(w);
  if (isNaN(pct)) return 12;
  return Math.round((pct / 100) * 12);
}

function getImageAlignment(fig: HTMLElement): "left" | "center" | "right" {
  const ml = fig.style.marginLeft;
  const mr = fig.style.marginRight;
  if (ml === "auto" && mr === "auto") return "center";
  if (ml === "auto") return "right";
  return "left";
}

// ─── Mini column-preview icon ─────────────────────────────────────────────────

function ColIcon({ count }: { count: 2 | 3 | 4 }) {
  return (
    <div className="flex gap-0.5 items-end" style={{ height: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-current rounded-sm"
          style={{ width: count === 4 ? 5 : count === 3 ? 6 : 8, height: "100%", opacity: 0.75 }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, onSave, className, stickyToolbar, borderless }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);

  // ── Format state ──
  const [formatState, setFormatState] = useState<FormatState>({
    bold: false, italic: false, underline: false,
    blockFormat: "P", unorderedList: false, orderedList: false,
    justifyLeft: true, justifyCenter: false, justifyRight: false,
    contextStyle: null,
  });

  // ── Paragraph style dropdown ──
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  // ── Text color ──
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const colorSavedSelectionRef = useRef<Range | null>(null);

  // ── Table state ──
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null);
  const activeTableRef = useRef<HTMLTableElement | null>(null);
  const [tableBarPos, setTableBarPos] = useState<{ top: number; left: number } | null>(null);
  const tableBarRef = useRef<HTMLDivElement>(null);

  // ── Image state ──
  const [activeImageFigure, setActiveImageFigure] = useState<HTMLElement | null>(null);
  const activeImageFigureRef = useRef<HTMLElement | null>(null);
  const [imageFigureRect, setImageFigureRect] = useState<DOMRect | null>(null);
  const [imageBarPos, setImageBarPos] = useState<{ top: number; left: number } | null>(null);
  const imageBarRef = useRef<HTMLDivElement>(null);

  // ── Column layout state ──
  const [activeColLayout, setActiveColLayout] = useState<HTMLElement | null>(null);
  const activeColLayoutRef = useRef<HTMLElement | null>(null);
  const [colBarPos, setColBarPos] = useState<{ top: number; left: number } | null>(null);
  const colBarRef = useRef<HTMLDivElement>(null);

  // ── Column picker dropdown ──
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);

  // ── Restriction toast ── shows inline when user tries to insert complex element inside a column
  const [restrictionMsg, setRestrictionMsg] = useState<string | null>(null);
  const restrictionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Drag/resize state ──
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);
  const dragSideRef = useRef<"left" | "right">("right");

  // ── Pending delete (two-step backspace) ──
  // First Backspace marks a complex block element (figure/table/column layout).
  // Second Backspace deletes it. Any other key cancels the pending state.
  const pendingDeleteRef = useRef<Element | null>(null);

  // ── Image dialog state ──
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // ─── Restriction helper ────────────────────────────────────────────────────

  const showRestriction = useCallback((msg: string) => {
    setRestrictionMsg(msg);
    if (restrictionTimerRef.current) clearTimeout(restrictionTimerRef.current);
    restrictionTimerRef.current = setTimeout(() => setRestrictionMsg(null), 3000);
  }, []);

  /** Remove the pending-delete highlight and clear the ref. Stable (only uses refs). */
  const clearPendingDelete = useCallback(() => {
    if (pendingDeleteRef.current) {
      try { pendingDeleteRef.current.removeAttribute("data-rte-pending-delete"); } catch {}
      pendingDeleteRef.current = null;
    }
  }, []);

  // ─── Floating toolbar position calculation ─────────────────────────────────

  const updateFloatingPositions = useCallback(() => {
    const table = activeTableRef.current;
    const figure = activeImageFigureRef.current;
    const layout = activeColLayoutRef.current;

    if (table) {
      const rect = table.getBoundingClientRect();
      let top = rect.top - 46 - 6;
      if (top < 8) top = rect.bottom + 6;
      setTableBarPos({ top, left: rect.left });
    } else {
      setTableBarPos(null);
    }

    if (figure) {
      const rect = figure.getBoundingClientRect();
      setImageFigureRect(rect);
      let top = rect.top - 46 - 6;
      if (top < 8) top = rect.bottom + 6;
      setImageBarPos({ top, left: rect.left });
    } else {
      setImageBarPos(null);
      setImageFigureRect(null);
    }

    if (layout) {
      const rect = layout.getBoundingClientRect();
      let top = rect.top - 46 - 6;
      if (top < 8) top = rect.bottom + 6;
      setColBarPos({ top, left: rect.left });
    } else {
      setColBarPos(null);
    }
  }, []);

  // Re-position on scroll / resize
  useEffect(() => {
    const handle = () => {
      if (activeTableRef.current || activeImageFigureRef.current || activeColLayoutRef.current)
        updateFloatingPositions();
    };
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [updateFloatingPositions]);

  // Close column picker on outside click
  useEffect(() => {
    if (!showColPicker) return;
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node))
        setShowColPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColPicker]);

  // Close paragraph style dropdown on outside click
  useEffect(() => {
    if (!showStyleDropdown) return;
    const handler = (e: MouseEvent) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target as Node))
        setShowStyleDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStyleDropdown]);

  // ─── Format state updater ──────────────────────────────────────────────────

  const updateFormatState = useCallback(() => {
    try {
      const raw = (document.queryCommandValue("formatBlock") || "P").toUpperCase().replace(/^<|>$/g, "");

      // Detect if cursor is inside a figcaption, fig-description, or table header
      let contextStyle: "FIGCAPTION" | "FIG-DESCRIPTION" | "TH" | null = null;
      const selCheck = window.getSelection();
      if (selCheck && selCheck.rangeCount > 0) {
        const nodeCheck = selCheck.getRangeAt(0).startContainer;
        const capEl = getCaptionOrDescParent(nodeCheck, editorRef.current);
        if (capEl) {
          contextStyle = capEl.tagName === "FIGCAPTION" ? "FIGCAPTION" : "FIG-DESCRIPTION";
        } else {
          // Check if inside a table header (TH)
          const cellEl = getParentCell(nodeCheck);
          if (cellEl && cellEl.tagName === "TH") {
            contextStyle = "TH";
          }
        }
      }

      const state: FormatState = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        blockFormat: raw || "P",
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        contextStyle,
      };
      setFormatState(state);
    } catch {}

    // Track active text color
    try {
      const rawColor = document.queryCommandValue("foreColor");
      if (rawColor) setCurrentTextColor(parseColorToHex(rawColor));
    } catch {}

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).startContainer;

      const table = getParentTable(node);
      const cell = getParentCell(node);
      if (table && editorRef.current?.contains(table)) {
        activeTableRef.current = table;
        setActiveTable(table);
        setActiveCell(cell);
      } else {
        activeTableRef.current = null;
        setActiveTable(null);
        setActiveCell(null);
      }

      const layout = getParentColumnLayout(node, editorRef.current);
      if (layout && editorRef.current?.contains(layout)) {
        activeColLayoutRef.current = layout;
        setActiveColLayout(layout);
      } else {
        activeColLayoutRef.current = null;
        setActiveColLayout(null);
      }
    }

    updateFloatingPositions();
  }, [updateFloatingPositions]);

  // ─── Basic exec ───────────────────────────────────────────────────────────

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  }, [onChange, updateFormatState]);

  // ─── Block style dropdown ──────────────────────────────────────────────────

  const applyBlockStyle = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag === "P" ? "p" : tag.toLowerCase());
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(updateFormatState, 0);
  }, [onChange, updateFormatState]);

  /**
   * Apply a paragraph style AND clear all inline formatting within the block.
   * This is what the custom style dropdown calls – enforcing "one style per paragraph".
   */
  const applyParagraphStyle = useCallback((tag: string) => {
    setShowStyleDropdown(false);
    editorRef.current?.focus();

    // For contextual styles (figcaption, fig-description, th), we can't change the tag,
    // but we CAN reset formatting when user clicks on the active contextual style
    if (tag === "FIGCAPTION" || tag === "FIG-DESCRIPTION" || tag === "TH") {
      // Reset inline formatting for the current element
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        let targetEl: Node | null = node;
        
        // Find the figcaption, fig-description, or th element
        while (targetEl && targetEl !== editorRef.current) {
          if (targetEl.nodeType === 1) {
            const el = targetEl as HTMLElement;
            if (
              (tag === "FIGCAPTION" && el.tagName === "FIGCAPTION") ||
              (tag === "FIG-DESCRIPTION" && el.getAttribute("data-role") === "fig-description") ||
              (tag === "TH" && el.tagName === "TH")
            ) {
              // Select all content and strip inline formats
              const range = document.createRange();
              range.selectNodeContents(el);
              sel.removeAllRanges();
              sel.addRange(range);
              document.execCommand("removeFormat");
              // Also explicitly clear bold/italic/underline if still active
              if (document.queryCommandState("bold")) document.execCommand("bold");
              if (document.queryCommandState("italic")) document.execCommand("italic");
              if (document.queryCommandState("underline")) document.execCommand("underline");
              
              // Strip ALL inline styles and nested formatting tags
              const stripAllFormatting = (element: HTMLElement) => {
                // Remove all inline styles from the element itself
                element.removeAttribute("style");
                
                // Process all child nodes
                const children = Array.from(element.childNodes);
                children.forEach((child) => {
                  if (child.nodeType === 1) { // Element node
                    const childEl = child as HTMLElement;
                    const tagName = childEl.tagName;
                    
                    // If it's a formatting tag (SPAN, B, I, U, STRONG, EM, FONT, etc.), unwrap it
                    if (["SPAN", "B", "I", "U", "STRONG", "EM", "FONT", "MARK", "SMALL", "BIG", "SUB", "SUP"].includes(tagName)) {
                      // Move all children out of this wrapper
                      while (childEl.firstChild) {
                        element.insertBefore(childEl.firstChild, childEl);
                      }
                      childEl.remove();
                    } else {
                      // For other elements, just remove style attribute and recurse
                      childEl.removeAttribute("style");
                      stripAllFormatting(childEl);
                    }
                  }
                });
                
                // Normalize text nodes (merge adjacent text nodes)
                element.normalize();
              };
              
              stripAllFormatting(el);
              
              // Re-apply default formatting for each contextual style
              // Instead of using execCommand, directly manipulate the DOM
              const textContent = el.textContent || "";
              
              if (tag === "FIGCAPTION") {
                // Caption default: bold + italic
                el.innerHTML = "";
                const strong = document.createElement("strong");
                const em = document.createElement("em");
                em.textContent = textContent;
                strong.appendChild(em);
                el.appendChild(strong);
              } else if (tag === "FIG-DESCRIPTION") {
                // Description default: italic only
                el.innerHTML = "";
                const em = document.createElement("em");
                em.textContent = textContent;
                el.appendChild(em);
              } else if (tag === "TH") {
                // Table header default: bold only
                el.innerHTML = "";
                const strong = document.createElement("strong");
                strong.textContent = textContent;
                el.appendChild(strong);
              }
              
              // Restore collapsed cursor at the end of the element
              range.selectNodeContents(el);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
              break;
            }
          }
          targetEl = targetEl.parentNode;
        }
      }
      
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
      setTimeout(updateFormatState, 0);
      return;
    }

    // 1. Apply the block tag
    document.execCommand("formatBlock", false, tag === "P" ? "p" : tag.toLowerCase());

    // 2. Find the current block element and select all its contents
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).startContainer;
      const BLOCK_TAGS = new Set(["P","H1","H2","H3","H4","H5","H6","LI","TD","TH","BLOCKQUOTE"]);
      let block: Node | null = node;
      while (block && block !== editorRef.current) {
        if (block.nodeType === 1 && BLOCK_TAGS.has((block as HTMLElement).tagName)) break;
        block = block.parentNode;
      }
      if (block && block !== editorRef.current && block.nodeType === 1) {
        // Select all content and strip inline formats
        const range = document.createRange();
        range.selectNodeContents(block);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("removeFormat");
        // Also explicitly clear bold/italic/underline if still active
        if (document.queryCommandState("bold")) document.execCommand("bold");
        if (document.queryCommandState("italic")) document.execCommand("italic");
        if (document.queryCommandState("underline")) document.execCommand("underline");
        
        // Strip ALL inline styles and nested formatting tags
        const stripAllFormatting = (element: HTMLElement) => {
          // Remove all inline styles from the element itself
          element.removeAttribute("style");
          
          // Process all child nodes
          const children = Array.from(element.childNodes);
          children.forEach((child) => {
            if (child.nodeType === 1) { // Element node
              const childEl = child as HTMLElement;
              const tagName = childEl.tagName;
              
              // If it's a formatting tag (SPAN, B, I, U, STRONG, EM, FONT, etc.), unwrap it
              if (["SPAN", "B", "I", "U", "STRONG", "EM", "FONT", "MARK", "SMALL", "BIG", "SUB", "SUP"].includes(tagName)) {
                // Move all children out of this wrapper
                while (childEl.firstChild) {
                  element.insertBefore(childEl.firstChild, childEl);
                }
                childEl.remove();
              } else {
                // For other elements, just remove style attribute and recurse
                childEl.removeAttribute("style");
                stripAllFormatting(childEl);
              }
            }
          });
          
          // Normalize text nodes (merge adjacent text nodes)
          element.normalize();
        };
        
        stripAllFormatting(block as HTMLElement);
        
        // Re-apply default formatting for H4
        // Instead of using execCommand, directly manipulate the DOM
        if (tag === "H4") {
          const blockEl = block as HTMLElement;
          const textContent = blockEl.textContent || "";
          // H4 default: bold only
          blockEl.innerHTML = "";
          const strong = document.createElement("strong");
          strong.textContent = textContent;
          blockEl.appendChild(strong);
        }
        
        // Restore collapsed cursor to end of block
        range.selectNodeContents(block);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(updateFormatState, 0);
  }, [onChange, updateFormatState]);

  // ─── Get current selection node ───────────────────────────────────────────

  const getCurrentSelectionNode = useCallback((): Node | null => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).startContainer;
    return null;
  }, []);

  // ─── Column layout helpers ─────────────────────────────────────────────────

  const insertColumnLayout = useCallback((cols: 2 | 3 | 4) => {
    // Guard: cannot insert inside a column cell
    const node = getCurrentSelectionNode();
    if (node && getParentColumn(node, editorRef.current)) {
      showRestriction("Column layouts cannot be nested inside a column section.");
      return;
    }

    const colsHtml = Array.from({ length: cols })
      .map(() => `<div data-rte-col="true"><p><br></p></div>`)
      .join("");
    const html = `<div data-rte-cols="${cols}">${colsHtml}</div><p><br></p>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(updateFormatState, 0);
  }, [onChange, updateFormatState, getCurrentSelectionNode, showRestriction]);

  const changeColumnCount = useCallback((layoutEl: HTMLElement, newCols: 2 | 3 | 4) => {
    const existingCols = Array.from(layoutEl.querySelectorAll("[data-rte-col]")) as HTMLElement[];
    const currentCount = existingCols.length;
    layoutEl.setAttribute("data-rte-cols", String(newCols));

    if (newCols > currentCount) {
      for (let i = currentCount; i < newCols; i++) {
        const col = document.createElement("div");
        col.setAttribute("data-rte-col", "true");
        col.innerHTML = "<p><br></p>";
        layoutEl.appendChild(col);
      }
    } else if (newCols < currentCount) {
      for (let i = currentCount - 1; i >= newCols; i--) {
        if (existingCols[i].textContent?.trim()) {
          const keepCol = existingCols[newCols - 1];
          keepCol.innerHTML += existingCols[i].innerHTML;
        }
        existingCols[i].remove();
      }
    }

    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(updateFloatingPositions, 0);
  }, [onChange, updateFloatingPositions]);

  const deleteColumnLayout = useCallback((layoutEl: HTMLElement) => {
    const next = layoutEl.nextElementSibling || layoutEl.nextSibling;
    layoutEl.remove();
    activeColLayoutRef.current = null;
    setActiveColLayout(null);
    setColBarPos(null);
    if (next && editorRef.current?.contains(next)) {
      const r = document.createRange();
      r.setStart(next, 0); r.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
    }
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ─── Image helpers ─────────────────────────────────────────────────────────

  const openImageDialog = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
    setImageUrl("");
    setImageCaption("");
    setShowImageDialog(true);
  }, []);

  const insertImageFromUrl = useCallback(() => {
    if (!imageUrl.trim()) return;
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRef.current);
    }
    editorRef.current?.focus();
    const captionContent = imageCaption.trim() || "";
    const captionEmpty = !captionContent ? ' data-empty' : '';
    document.execCommand(
      "insertHTML", false,
      `<figure style="margin:16px auto;width:100%;display:block;" contenteditable="false"><img src="${imageUrl}" style="width:100%;border-radius:var(--radius-card);display:block;"/><figcaption contenteditable="true" style="font-size:var(--text-label);color:var(--color-label-primary);margin-top:8px;font-style:italic;font-weight:var(--font-weight-medium);padding:4px 0;outline:none;"${captionEmpty}>${captionContent}</figcaption><div contenteditable="true" data-role="fig-description" style="font-size:var(--text-label);color:var(--color-label-secondary);margin-top:2px;padding:4px 0;font-style:italic;outline:none;" data-empty></div></figure><p><br></p>`
    );
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    setShowImageDialog(false);
    savedSelectionRef.current = null;
  }, [imageUrl, imageCaption, onChange]);

  const handleImageFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, []);

  // ─── Image selection ──────────────────────────────────��────────────────────

  const selectImageFigure = useCallback((fig: HTMLElement | null) => {
    activeImageFigureRef.current = fig;
    setActiveImageFigure(fig);
    setTimeout(updateFloatingPositions, 0);
  }, [updateFloatingPositions]);

  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Any click in the editor cancels a pending two-step delete.
    clearPendingDelete();

    const target = e.target as HTMLElement;
    const figure = target.closest("figure") as HTMLElement | null;

    if (figure && editorRef.current?.contains(figure)) {
      selectImageFigure(figure);

      // ── Click on the <img> element → redirect cursor to after the figure ──
      if (target.tagName === "IMG") {
        const next = figure.nextSibling;
        try {
          const r = document.createRange();
          if (next && editorRef.current?.contains(next)) { r.setStart(next, 0); }
          else { r.setStartAfter(figure); }
          r.collapse(true);
          window.getSelection()?.removeAllRanges();
          window.getSelection()?.addRange(r);
        } catch {}
        return;
      }

      // ── Click on an empty caption/description field ──
      // When the field shows the CSS placeholder (data-empty), focus it and
      // place the cursor so the user can type immediately.
      const ppContainer =
        (target.tagName === "FIGCAPTION" || target.getAttribute("data-role") === "fig-description")
          ? target : null;

      if (ppContainer && ppContainer.hasAttribute("data-empty")) {
        e.preventDefault();
        ppContainer.focus();
        const sel = window.getSelection();
        const r = document.createRange();
        r.setStart(ppContainer, 0);
        r.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(r);
        setTimeout(updateFormatState, 0);
        return;
      }
    } else {
      selectImageFigure(null);
    }
    updateFormatState();
  }, [clearPendingDelete, selectImageFigure, updateFormatState, onChange]);

  useEffect(() => {
    if (!activeImageFigure) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (imageBarRef.current?.contains(target) || editorRef.current?.contains(target)) return;
      selectImageFigure(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeImageFigure, selectImageFigure]);

  // ─── Image alignment ───────────────────────────────────────────────────────

  const setImageAlignment = useCallback((align: "left" | "center" | "right") => {
    const fig = activeImageFigureRef.current;
    if (!fig) return;
    if (align === "left") { fig.style.marginLeft = "0"; fig.style.marginRight = "auto"; }
    else if (align === "center") { fig.style.marginLeft = "auto"; fig.style.marginRight = "auto"; }
    else { fig.style.marginLeft = "auto"; fig.style.marginRight = "0"; }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
    updateFloatingPositions();
  }, [onChange, updateFloatingPositions]);

  // ─── Image resize ──────────────────────────────────────────────────────────

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault(); e.stopPropagation();
    const fig = activeImageFigureRef.current;
    if (!fig || !editorRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = fig.getBoundingClientRect().width;
    dragSideRef.current = side;

    const onMouseMove = (me: MouseEvent) => {
      if (!isDraggingRef.current || !activeImageFigureRef.current || !editorRef.current) return;
      const dx = me.clientX - dragStartXRef.current;
      const delta = dragSideRef.current === "right" ? dx : -dx;
      const cols = snapToColumns(dragStartWidthRef.current + delta, editorRef.current.offsetWidth);
      activeImageFigureRef.current.style.width = `${((cols / 12) * 100).toFixed(4)}%`;
      updateFloatingPositions();
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [onChange, updateFloatingPositions]);

  // ─── Copy / Cut helpers for images & tables ────────────────────────────────

  const copyImageToClipboard = useCallback(async () => {
    const fig = activeImageFigureRef.current;
    if (!fig) return;
    const html = fig.outerHTML;
    rteClipboard = { html, kind: "image" };
    rteClipboardGen++;
    await writeHTMLToClipboard(html);
  }, []);

  const cutImageToClipboard = useCallback(async () => {
    const fig = activeImageFigureRef.current;
    if (!fig) return;
    const html = fig.outerHTML;
    rteClipboard = { html, kind: "image" };
    rteClipboardGen++;
    await writeHTMLToClipboard(html);
    const next = fig.nextElementSibling || fig.nextSibling;
    fig.remove();
    selectImageFigure(null);
    if (next && editorRef.current?.contains(next)) {
      const r = document.createRange();
      r.setStart(next, 0); r.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange, selectImageFigure]);

  const deleteImageFigure = useCallback(() => {
    const fig = activeImageFigureRef.current;
    if (!fig) return;
    const next = fig.nextElementSibling || fig.nextSibling;
    try {
      const r = document.createRange();
      r.selectNode(fig);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
      document.execCommand("delete");
    } catch {
      fig.remove();
    }
    selectImageFigure(null);
    if (next && editorRef.current?.contains(next)) {
      try {
        const r = document.createRange();
        r.setStart(next, 0); r.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges(); sel?.addRange(r);
      } catch { /* ignore */ }
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange, selectImageFigure]);

  const copyTableToClipboard = useCallback(async () => {
    const table = activeTableRef.current;
    if (!table) return;
    const html = table.outerHTML + "<p><br></p>";
    rteClipboard = { html, kind: "table" };
    rteClipboardGen++;
    await writeHTMLToClipboard(html);
  }, []);

  const cutTableToClipboard = useCallback(async () => {
    const table = activeTableRef.current;
    if (!table) return;
    const html = table.outerHTML + "<p><br></p>";
    rteClipboard = { html, kind: "table" };
    rteClipboardGen++;
    await writeHTMLToClipboard(html);
    const next = table.nextElementSibling || table.nextSibling;
    table.remove();
    activeTableRef.current = null;
    setActiveTable(null); setActiveCell(null); setTableBarPos(null);
    if (next && editorRef.current?.contains(next)) {
      const r = document.createRange();
      r.setStart(next, 0); r.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges(); sel?.addRange(r);
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  // ─── Paste handler ─────────────────────────────────────────────────────────

  /** Shared paste logic used by both the native paste event and the toolbar Paste button. */
  const pasteContent = useCallback((systemHtml?: string, systemPlain?: string) => {
    const node = getCurrentSelectionNode();
    const inColumn = !!(node && getParentColumn(node, editorRef.current));

    // Always prefer the internal RTE clipboard when it has content – it was
    // explicitly set by our copy/cut actions and is guaranteed to be correct.
    // The system clipboard may contain stale data from before, or the browser
    // may have blocked our write.
    let html = rteClipboard ? rteClipboard.html : (systemHtml || "");
    const plainText = systemPlain || "";

    // If pasting inside a column, strip column-layout wrappers (nesting) but
    // allow tables, images, text, and headings.
    let toInsert = "";
    if (html) {
      if (inColumn) {
        // Only strip nested column layouts – keep tables & images
        const div = document.createElement("div");
        div.innerHTML = html;
        div.querySelectorAll("[data-rte-cols]").forEach((el) => {
          const p = document.createElement("p");
          p.textContent = el.textContent || "";
          el.replaceWith(p);
        });
        toInsert = div.innerHTML || "<p><br></p>";
      } else {
        toInsert = html;
      }
    } else if (plainText) {
      // Check for markdown syntax in plain text
      const hasMarkdownSyntax = /^#{1,6}\s+|^\d+\.\s+|^[-*+]\s+|^>\s+|\*\*.*\*\*|__.*__|~~.*~~|`.*`|\[.*\]\(.*\)|!\[.*\]\(.*\)/m.test(plainText);
      if (hasMarkdownSyntax) {
        toInsert = parseMarkdownToHTML(plainText);
      } else {
        toInsert = plainText
          .split(/\r?\n/)
          .map((line) => `<p>${line.trim() || "<br>"}</p>`)
          .join("");
      }
    }

    if (toInsert) {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, toInsert);
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }

    // After a cut-paste, clear the internal clipboard so it isn't pasted twice
    // (copy leaves it in place for multiple pastes).
    setTimeout(updateFormatState, 0);
  }, [getCurrentSelectionNode, onChange, updateFormatState]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    console.log('📋 PASTE EVENT TRIGGERED');
    
    try {
      e.preventDefault();
      
      // Check if paste is happening inside a nested contentEditable (figcaption or description)
      // We need to check for elements with explicit contenteditable attribute, not just inherited
      const target = e.target as HTMLElement;
      console.log('Paste target:', target.tagName, target.className);
      
      // Only detect as nested if we're inside an element with explicit contenteditable attribute
      // (figcaption, image description, etc.) - not just any element that inherits contentEditable
      const nestedEditableParent = target.closest && (
        target.closest('figcaption[contenteditable="true"]') ||
        target.closest('[data-rte-description][contenteditable="true"]')
      );
      const isNestedEditable = !!nestedEditableParent && target !== editorRef.current;
      console.log('Is nested editable?', isNestedEditable, 'Parent:', nestedEditableParent?.tagName);
      
      // Try to get HTML first (from apps like Notion, Google Docs, etc.)
      const htmlContent = e.clipboardData.getData("text/html");
      const plainText = e.clipboardData.getData("text/plain");
      
      // Debug logging
      console.log('📋 CLIPBOARD DATA:');
      console.log('  - HTML length:', htmlContent?.length || 0);
      console.log('  - Plain text length:', plainText?.length || 0);
      console.log('  - Plain text preview:', plainText?.substring(0, 100));
      console.log('  - HTML preview:', htmlContent?.substring(0, 200));
      
      if (!htmlContent && !plainText) {
        console.warn('⚠️ No clipboard data available');
        return;
      }
    
    if (isNestedEditable) {
      // Paste into the nested contentEditable without refocusing main editor
      const toInsert = plainText.replace(/\r?\n/g, ' '); // Replace newlines with spaces for inline elements
      document.execCommand("insertText", false, toInsert);
    } else {
      let toInsert: string;
      
      if (htmlContent && htmlContent.trim()) {
        // Parse the HTML properly - Notion/Google Docs may wrap in <html><head><body>
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Extract body content (or fall back to the whole parsed content)
        const bodyContent = doc.body || doc.documentElement;
        
        // Create a clean container
        const tempDiv = document.createElement('div');
        
        // Clone the content nodes (avoiding head, meta, etc.)
        Array.from(bodyContent.childNodes).forEach(node => {
          tempDiv.appendChild(node.cloneNode(true));
        });
        
        // Remove potentially dangerous elements
        const dangerous = tempDiv.querySelectorAll('script, link, meta, iframe, object, embed, head, style');
        dangerous.forEach(el => el.remove());
        
        // Remove event handler attributes AND clean up Notion/external app attributes
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            // Remove event handlers
            if (attr.name.startsWith('on')) {
              el.removeAttribute(attr.name);
            }
            // Remove data attributes (Notion IDs, etc.)
            if (attr.name.startsWith('data-')) {
              el.removeAttribute(attr.name);
            }
            // Remove dir, contenteditable attributes
            if (attr.name === 'dir' || attr.name === 'contenteditable') {
              el.removeAttribute(attr.name);
            }
          });
          
          // Remove ALL class attributes to avoid external styling conflicts
          el.removeAttribute('class');
          
          // Remove inline styles to use only CSS variables from design system
          el.removeAttribute('style');
        });
        
        toInsert = tempDiv.innerHTML;
        console.log('📄 Cleaned HTML length:', toInsert?.length);
        console.log('📄 Cleaned HTML preview:', toInsert?.substring(0, 200));
        console.log('📋 Plain text preview:', plainText?.substring(0, 200));
        
        // Only fall back to markdown if we truly have no HTML tags
        const hasSemanticTags = /<(h[1-6]|strong|em|code|pre|ul|ol|li|blockquote|a|img|table|del|hr)[>\s\/]/i.test(toInsert);
        console.log('Has semantic tags?', hasSemanticTags);
        if (!toInsert || !hasSemanticTags) {
          console.log('⚠️ No semantic tags in HTML, falling back to markdown parsing');
          const hasMarkdownSyntax = /^#{1,6}\s+|^\d+\.\s+|^[-*+]\s+|^>\s+|\*\*.*\*\*|__.*__|~~.*~~|`.*`|\[.*\]\(.*\)|!\[.*\]\(.*\)/m.test(plainText);
          console.log('Has markdown syntax?', hasMarkdownSyntax);
          if (hasMarkdownSyntax) {
            console.log('Parsing as markdown');
            toInsert = parseMarkdownToHTML(plainText);
            console.log('Parsed markdown HTML:', toInsert);
          } else {
            toInsert = plainText
              .split(/\r?\n/)
              .map((line) => `<p>${line.trim() || "<br>"}</p>`)
              .join("");
          }
        } else {
          console.log('✅ Using cleaned HTML with semantic tags');
        }
      } else if (plainText) {
        // No HTML - parse markdown formatting if present, otherwise convert to paragraphs
        const hasMarkdownSyntax = /^#{1,6}\s+|^\d+\.\s+|^[-*+]\s+|^>\s+|\*\*.*\*\*|__.*__|~~.*~~|`.*`|\[.*\]\(.*\)|!\[.*\]\(.*\)/m.test(plainText);
        console.log('Plain text only - has markdown?', hasMarkdownSyntax);
        
        if (hasMarkdownSyntax) {
          // Try to parse as markdown
          console.log('Parsing plain text as markdown');
          toInsert = parseMarkdownToHTML(plainText);
          console.log('Parsed markdown HTML:', toInsert);
        } else {
          // Plain text - convert to paragraphs
          toInsert = plainText
            .split(/\r?\n/)
            .map((line) => `<p>${line.trim() || "<br>"}</p>`)
            .join("");
        }
      } else {
        return;
      }
      
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, toInsert);
      
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }
    
      setTimeout(updateFormatState, 0);
    } catch (error) {
      console.error('❌ PASTE ERROR:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Fallback: just insert plain text if there's an error
      if (e.clipboardData) {
        const plainText = e.clipboardData.getData("text/plain");
        if (plainText && editorRef.current) {
          document.execCommand("insertText", false, plainText);
        }
      }
    }
  }, [onChange, updateFormatState]);

  /** Paste from toolbar button – uses internal clipboard only. */
  const pasteFromToolbar = useCallback(async () => {
    editorRef.current?.focus();
    
    // Try using the browser's native paste command first (works better with permissions)
    try {
      const success = document.execCommand('paste');
      if (success) {
        console.log('✅ Native paste command executed successfully');
        return;
      }
    } catch (err) {
      console.warn('Native paste command failed:', err);
    }
    
    // If native paste fails, try reading plain text from clipboard
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        console.log('📋 Read plain text from clipboard:', text.substring(0, 100));
        pasteContent("", text);
        return;
      }
    } catch (err) {
      console.warn('Clipboard readText blocked:', err);
    }
    
    // Final fallback: use internal clipboard or show message
    if (rteClipboard) {
      console.log('Using internal RTE clipboard');
      pasteContent("", "");
    } else {
      // Show a helpful message to the user
      alert('Paste from toolbar is blocked by browser permissions. Please use Ctrl+V (Windows) or Cmd+V (Mac) to paste instead.');
    }
  }, [pasteContent]);

  // ─── Table helpers ─────────────────────────────────────────────────────────

  const insertTable = useCallback(() => {
    // Guard: cannot insert inside a column cell
    const node = getCurrentSelectionNode();
    if (node && getParentColumn(node, editorRef.current)) {
      showRestriction("Tables cannot be inserted inside a column section.");
      return;
    }

    const rows = parseInt(prompt("Number of rows:", "3") || "3", 10);
    const cols = parseInt(prompt("Number of columns:", "3") || "3", 10);
    let html = '<table class="rte-table"><thead><tr>';
    for (let c = 0; c < cols; c++) html += `<th>Header ${c + 1}</th>`;
    html += "</tr></thead><tbody>";
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) html += `<td>Cell</td>`;
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  }, [exec, getCurrentSelectionNode, showRestriction]);

  const addRow = useCallback((table: HTMLTableElement, afterRowIndex: number) => {
    const tbody = table.querySelector("tbody") || table;
    const rows = tbody.querySelectorAll("tr");
    const refRow = rows[afterRowIndex >= 0 ? afterRowIndex : rows.length - 1];
    if (!refRow) return;
    const colCount = refRow.cells.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td"); td.textContent = "Cell"; newRow.appendChild(td);
    }
    if (afterRowIndex >= 0 && afterRowIndex < rows.length - 1) rows[afterRowIndex + 1].before(newRow);
    else tbody.appendChild(newRow);
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const removeRow = useCallback((table: HTMLTableElement, rowIndex: number) => {
    const tbody = table.querySelector("tbody") || table;
    const rows = tbody.querySelectorAll("tr");
    if (rows.length <= 1) {
      table.remove();
      activeTableRef.current = null; setActiveTable(null); setActiveCell(null);
    } else if (rows[rowIndex]) {
      rows[rowIndex].remove();
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const addColumn = useCallback((table: HTMLTableElement, afterColIndex: number) => {
    table.querySelectorAll("tr").forEach((row) => {
      const isHeader = row.parentElement?.tagName === "THEAD";
      const cell = document.createElement(isHeader ? "th" : "td");
      cell.textContent = isHeader ? "Header" : "Cell";
      const cells = row.querySelectorAll("td, th");
      if (afterColIndex >= 0 && afterColIndex < cells.length - 1 && cells[afterColIndex + 1])
        cells[afterColIndex + 1].before(cell);
      else row.appendChild(cell);
    });
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const removeColumn = useCallback((table: HTMLTableElement, colIndex: number) => {
    const allRows = table.querySelectorAll("tr");
    const colCount = allRows[0]?.querySelectorAll("td, th").length || 0;
    if (colCount <= 1) {
      table.remove();
      activeTableRef.current = null; setActiveTable(null); setActiveCell(null);
    } else {
      allRows.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        if (cells[colIndex]) cells[colIndex].remove();
      });
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const mergeCells = useCallback(() => {
    if (!activeTable) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const cells: HTMLTableCellElement[] = [];
    activeTable.querySelectorAll("td, th").forEach((cell) => {
      if (range.intersectsNode(cell) || cell.contains(range.startContainer) || cell.contains(range.endContainer))
        cells.push(cell as HTMLTableCellElement);
    });
    if (cells.length < 2) {
      if (activeCell) {
        const row = activeCell.parentElement as HTMLTableRowElement;
        const cellIndex = Array.from(row.cells).indexOf(activeCell);
        const nextCell = row.cells[cellIndex + 1];
        if (nextCell) {
          const cs = parseInt(activeCell.getAttribute("colspan") || "1", 10);
          const ns = parseInt(nextCell.getAttribute("colspan") || "1", 10);
          activeCell.setAttribute("colspan", String(cs + ns));
          activeCell.innerHTML += " " + nextCell.innerHTML;
          nextCell.remove();
          if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
        }
      }
      return;
    }
    const firstCell = cells[0];
    let totalCs = 0; let combined = "";
    cells.forEach((c) => {
      totalCs += parseInt(c.getAttribute("colspan") || "1", 10);
      combined += (combined ? " " : "") + c.innerHTML;
    });
    firstCell.setAttribute("colspan", String(totalCs));
    firstCell.innerHTML = combined;
    cells.slice(1).forEach((c) => c.remove());
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [activeTable, activeCell, onChange]);

  const splitCell = useCallback(() => {
    if (!activeCell || !activeTable) return;
    const colspan = parseInt(activeCell.getAttribute("colspan") || "1", 10);
    if (colspan <= 1) return;
    activeCell.setAttribute("colspan", "1");
    for (let i = 1; i < colspan; i++) {
      const newCell = document.createElement(activeCell.tagName === "TH" ? "th" : "td");
      newCell.textContent = "";
      activeCell.after(newCell);
    }
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [activeCell, activeTable, onChange]);

  // ─── Blur handler – restores placeholder spans when caption/description is emptied ───

  const handleEditorBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isFigCaption = target.tagName === "FIGCAPTION";
    const isFigDesc = target.getAttribute("data-role") === "fig-description";
    if (!isFigCaption && !isFigDesc) return;
    syncEmptyAttr(target);
    if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  // ─── Keyboard handling ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMod = e.ctrlKey || e.metaKey;

    // Any key other than Backspace cancels a pending two-step delete.
    if (e.key !== "Backspace") {
      clearPendingDelete();
    }

    // ── Printable key inside an empty caption/description ────────────────
    // When the field shows the CSS placeholder (data-empty), remove the attr
    // so the placeholder disappears, and let the browser insert the character.
    if (!isMod && e.key.length === 1) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const ppNode = sel.getRangeAt(0).startContainer;
        const ppParent = getCaptionOrDescParent(ppNode, editorRef.current);
        if (ppParent && ppParent.hasAttribute("data-empty")) {
          ppParent.removeAttribute("data-empty");
          // Field is empty — let the browser insert normally.
        }
      }
    }

    // Ctrl/Cmd+S → save
    if (isMod && e.key === "s") {
      e.preventDefault();
      if (onSave) onSave();
      return;
    }

    // ── Paste via keyboard: if internal clipboard has content, intercept ──
    if (isMod && e.key === "v" && rteClipboard) {
      e.preventDefault();
      pasteContent("", "");
      return;
    }

    // ── Copy / Cut for selected image ──────────────────��───────────────────
    if (isMod && e.key === "c" && activeImageFigureRef.current) {
      e.preventDefault();
      copyImageToClipboard();
      return;
    }
    if (isMod && e.key === "x" && activeImageFigureRef.current) {
      e.preventDefault();
      cutImageToClipboard();
      return;
    }

    // ── Copy / Cut for active table (when cursor is in table, no text selected) ──
    if (isMod && (e.key === "c" || e.key === "x") && activeTableRef.current) {
      const sel = window.getSelection();
      const collapsed = sel ? sel.isCollapsed : true;
      if (collapsed) {
        e.preventDefault();
        if (e.key === "c") copyTableToClipboard();
        else cutTableToClipboard();
        return;
      }
    }

    // ── Tab inside column → navigate between columns ───────────────────────
    if (e.key === "Tab") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        
        // First check if we're inside a list item for indentation
        let listItem = node.nodeType === Node.ELEMENT_NODE 
          ? (node as HTMLElement).closest("li")
          : (node.parentElement?.closest("li") || null);
        
        if (listItem && editorRef.current?.contains(listItem)) {
          e.preventDefault();
          
          if (!e.shiftKey) {
            // Tab: Indent (increase margin-left)
            const currentMargin = parseInt(listItem.style.marginLeft || "0", 10);
            listItem.style.marginLeft = `${currentMargin + 20}px`;
          } else {
            // Shift+Tab: Outdent (decrease margin-left)
            const currentMargin = parseInt(listItem.style.marginLeft || "0", 10);
            const newMargin = Math.max(0, currentMargin - 20);
            listItem.style.marginLeft = `${newMargin}px`;
          }
          
          if (editorRef.current) {
            isInternalChange.current = true;
            onChange(editorRef.current.innerHTML);
          }
          setTimeout(updateFormatState, 0);
          return;
        }
        
        // If not in a list, check for column navigation
        const colEl = getParentColumn(node, editorRef.current);
        const layoutEl = getParentColumnLayout(node, editorRef.current);
        if (colEl && layoutEl) {
          e.preventDefault();
          const allCols = Array.from(layoutEl.querySelectorAll("[data-rte-col]")) as HTMLElement[];
          const currentIdx = allCols.indexOf(colEl);
          if (!e.shiftKey) {
            if (currentIdx < allCols.length - 1) {
              const nextCol = allCols[currentIdx + 1];
              const r = document.createRange();
              r.selectNodeContents(nextCol); r.collapse(false);
              sel.removeAllRanges(); sel.addRange(r);
            } else {
              const next = layoutEl.nextElementSibling;
              if (next) {
                const r = document.createRange();
                r.setStart(next, 0); r.collapse(true);
                sel.removeAllRanges(); sel.addRange(r);
              }
            }
          } else {
            if (currentIdx > 0) {
              const prevCol = allCols[currentIdx - 1];
              const r = document.createRange();
              r.selectNodeContents(prevCol); r.collapse(false);
              sel.removeAllRanges(); sel.addRange(r);
            }
          }
          setTimeout(updateFormatState, 0);
          return;
        }
      }
    }

    // ── Enter at start OR end of heading → insert Normal Text paragraph ──
    if (e.key === "Enter" && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          const headingEl = getParentHeading(range.startContainer, editorRef.current);
          if (headingEl) {
            // ── At the START of a heading ────────────────────────────────────
            // Insert a blank normal-text <p> BEFORE the heading so the heading
            // moves down one line, then place the cursor at the START of the
            // heading so the user continues typing inside the heading.
            if (cursorIsAtElementStart(range, headingEl)) {
              e.preventDefault();
              const newP = document.createElement("p");
              newP.innerHTML = "<br>";
              headingEl.before(newP);
              // Cursor lands at the beginning of the heading, not the new <p>.
              const nr = document.createRange();
              const firstChild = headingEl.firstChild;
              if (firstChild) {
                nr.setStart(firstChild, 0);
              } else {
                nr.setStart(headingEl, 0);
              }
              nr.collapse(true);
              sel.removeAllRanges(); sel.addRange(nr);
              if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
              setTimeout(updateFormatState, 0);
              return;
            }

            // ── At the END of a heading ──────────────────────────────────────
            // Insert a blank <p> AFTER the heading; cursor goes into it.
            const endRange = document.createRange();
            endRange.selectNodeContents(headingEl);
            endRange.collapse(false);
            const atEnd = range.compareBoundaryPoints(Range.START_TO_END, endRange) === 0;
            if (atEnd) {
              e.preventDefault();
              const newP = document.createElement("p");
              newP.innerHTML = "<br>";
              headingEl.after(newP);
              const nr = document.createRange();
              nr.setStart(newP, 0); nr.collapse(true);
              sel.removeAllRanges(); sel.addRange(nr);
              if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
              setTimeout(updateFormatState, 0);
              return;
            }
          }
        }
      }
    }

    // ── ArrowDown / Enter inside figcaption or fig-description ────────────
    if (e.key === "ArrowDown" || e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        const figure = getParentFigure(node);
        if (figure && editorRef.current?.contains(figure)) {
          const inCaption = isInsideFigcaption(node);
          let inFigDescription = false;
          let cur: Node | null = node;
          while (cur && cur !== figure) {
            if (cur.nodeType === 1 && (cur as HTMLElement).getAttribute("data-role") === "fig-description") {
              inFigDescription = true; break;
            }
            cur = cur.parentNode;
          }
          if (e.key === "Enter" && inCaption) {
            // Enter in caption → jump to description field (cursor at its start)
            e.preventDefault();
            const descEl = figure.querySelector<HTMLElement>("[data-role='fig-description']");
            if (descEl) {
              const r = document.createRange();
              r.setStart(descEl, 0); r.collapse(true);
              sel.removeAllRanges(); sel.addRange(r);
              descEl.focus();
            } else {
              const next = figure.nextElementSibling || figure.nextSibling;
              if (next) { const r = document.createRange(); r.setStart(next, 0); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
            }
            setTimeout(updateFormatState, 0);
            return;
          }
          if (e.key === "Enter" && inFigDescription) {
            // Enter in description → new paragraph within the description field.
            // If the field is empty (showing placeholder), no-op.
            e.preventDefault();
            const descEl = figure.querySelector<HTMLElement>("[data-role='fig-description']");
            if (descEl?.hasAttribute("data-empty")) return;
            document.execCommand("insertParagraph");
            if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
            setTimeout(updateFormatState, 0);
            return;
          }
          if (e.key === "ArrowDown" && (inCaption || inFigDescription)) {
            e.preventDefault();
            if (inCaption && !inFigDescription) {
              const desc = figure.querySelector("[data-role='fig-description']");
              if (desc) { const r = document.createRange(); r.selectNodeContents(desc); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); return; }
            }
            const next = figure.nextElementSibling || figure.nextSibling;
            if (next) { const r = document.createRange(); r.setStart(next, 0); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
            return;
          }
        }
      }
    }

    // ── Backspace ─────────────────────────────────────────────────────────
    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const node = range.startContainer;
        const offset = range.startOffset;

        // ── Step 2: a complex block was already marked on the previous
        //    Backspace press – delete it now via execCommand so Ctrl+Z works. ─
        if (pendingDeleteRef.current) {
          e.preventDefault();
          const el = pendingDeleteRef.current as HTMLElement;
          clearPendingDelete();
          const tag = el.tagName;
          const isCols = el.hasAttribute("data-rte-cols");
          // Select the element and delete via execCommand so the browser tracks
          // this in its native undo stack (Ctrl+Z / Cmd+Z will restore it).
          try {
            const r = document.createRange();
            r.selectNode(el);
            selection.removeAllRanges();
            selection.addRange(r);
            document.execCommand("delete");
          } catch {
            el.remove(); // fallback
          }
          if (tag === "FIGURE") selectImageFigure(null);
          if (tag === "TABLE") { activeTableRef.current = null; setActiveTable(null); setActiveCell(null); }
          if (isCols) { activeColLayoutRef.current = null; setActiveColLayout(null); setColBarPos(null); }
          if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
          return;
        }

        // ── Guard: cursor inside figure's non-editable zone ───────────────
        // Can occur via keyboard navigation. Redirect cursor outside the figure
        // so the user can never accidentally backspace just the <img> element.
        const figureForNode = getParentFigure(node);
        if (figureForNode && editorRef.current?.contains(figureForNode)) {
          const inCap = isInsideFigcaption(node);
          let inDesc = false;
          let curCheck: Node | null = node;
          while (curCheck && curCheck !== figureForNode) {
            if (curCheck.nodeType === 1 && (curCheck as HTMLElement).getAttribute("data-role") === "fig-description") { inDesc = true; break; }
            curCheck = curCheck.parentNode;
          }

          if (inCap || inDesc) {
            const islandEl = inCap
              ? figureForNode.querySelector<HTMLElement>("figcaption")
              : figureForNode.querySelector<HTMLElement>("[data-role='fig-description']");
            const isEmpty = !!(islandEl && islandEl.hasAttribute("data-empty"));

            // Field is empty (placeholder visible) → always no-op.
            if (isEmpty) {
              e.preventDefault();
              return;
            }

            if (inCap) {
              // Caption: at the very start with no content → no-op. Otherwise let
              // the browser handle within-caption deletion, but don't fall through
              // to the outer complex-block detection logic.
              if (offset === 0) {
                const capText = figureForNode.querySelector("figcaption")?.textContent?.trim() || "";
                if (!capText) { e.preventDefault(); return; }
              }
              return; // cursor not at start or has content – normal browser backspace
            }

            if (inDesc) {
              // Description is now a <div> that can contain nested <p> elements.
              // Only block Backspace when cursor is at the ABSOLUTE start of the div
              // (nothing to delete above). This lets paragraph-merge work freely inside.
              if (islandEl) {
                try {
                  const absStart = document.createRange();
                  absStart.selectNodeContents(islandEl);
                  absStart.collapse(true); // move to absolute start
                  if (range.compareBoundaryPoints(Range.START_TO_START, absStart) === 0) {
                    e.preventDefault();
                    return;
                  }
                } catch { /* ignore */ }
              }
              // Not at absolute start → let the browser merge paragraphs within the div,
              // but return so outer complex-block detection is never triggered.
              return;
            }
          } else {
            // Cursor is in the non-editable part of the figure (e.g. adjacent to
            // the <img>). Prevent any edit and redirect cursor to after the figure.
            e.preventDefault();
            try {
              const r = document.createRange();
              const next = figureForNode.nextSibling;
              if (next && editorRef.current?.contains(next)) { r.setStart(next, 0); }
              else { r.setStartAfter(figureForNode); }
              r.collapse(true);
              selection.removeAllRanges(); selection.addRange(r);
            } catch {}
            return;
          }
        }

        // ── Step 1: mark a complex block for pending delete ───────────────
        // The first Backspace highlights the element; the second Backspace
        // (caught above) deletes it.  This prevents accidental one-key deletion
        // and also prevents the "select all table content" browser quirk.
        if (offset === 0) {
          let prevSibling: Node | null = null;
          let checkNode: Node | null = node;
          while (checkNode && checkNode !== editorRef.current) {
            if (checkNode.previousSibling) { prevSibling = checkNode.previousSibling; break; }
            checkNode = checkNode.parentNode;
          }
          if (prevSibling?.nodeType === 1) {
            const prevEl = prevSibling as HTMLElement;
            const isComplex =
              prevEl.tagName === "FIGURE" ||
              prevEl.tagName === "TABLE" ||
              prevEl.hasAttribute("data-rte-cols");
            if (isComplex) {
              e.preventDefault();
              pendingDeleteRef.current = prevEl;
              prevEl.setAttribute("data-rte-pending-delete", "true");
              // Move cursor to just after the element so it visually appears
              // "to the right of" the block.  The next Backspace will delete it.
              try {
                const r = document.createRange();
                r.setStartAfter(prevEl); r.collapse(true);
                selection.removeAllRanges(); selection.addRange(r);
              } catch {}
              return;
            }
          }
        }

        // ── Element-node cursor adjacent to a complex block ───────────────
        // Handles the browser quirk where pressing Backspace when the caret
        // lands directly next to a <table> would select all table content.
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const prevEl = el.previousElementSibling;
          if (prevEl && (prevEl.tagName === "TABLE" || prevEl.hasAttribute("data-rte-cols") || prevEl.tagName === "FIGURE")) {
            e.preventDefault();
            pendingDeleteRef.current = prevEl;
            prevEl.setAttribute("data-rte-pending-delete", "true");
            try {
              const r = document.createRange();
              r.setStartAfter(prevEl); r.collapse(true);
              selection.removeAllRanges(); selection.addRange(r);
            } catch {}
            return;
          }
        }
      }
    }

    // ── Delete key ────────────────────────────────────────────────────────
    if (e.key === "Delete") {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        const node = range.startContainer;
        const figure = getParentFigure(node);
        if (figure && editorRef.current?.contains(figure)) {
          e.preventDefault();
          // Use execCommand so this deletion is tracked in the browser undo stack.
          try {
            const r = document.createRange();
            r.selectNode(figure);
            selection.removeAllRanges();
            selection.addRange(r);
            document.execCommand("delete");
          } catch {
            figure.remove();
          }
          selectImageFigure(null);
          if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
          return;
        }
      }
    }

    setTimeout(updateFormatState, 0);
  }, [onChange, updateFormatState, onSave, copyImageToClipboard, cutImageToClipboard, deleteImageFigure, copyTableToClipboard, cutTableToClipboard, pasteContent, clearPendingDelete, selectImageFigure]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Sync the data-empty attribute on the active caption/description field.
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const ppContainer = getCaptionOrDescParent(
          sel.getRangeAt(0).startContainer,
          editorRef.current
        );
        if (ppContainer) {
          const wasFocused = document.activeElement === ppContainer;
          syncEmptyAttr(ppContainer);
          // If the field just became empty and was focused, re-place cursor
          if (wasFocused && ppContainer.hasAttribute("data-empty")) {
            const r = document.createRange();
            r.setStart(ppContainer, 0);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
      }
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  }, [onChange, updateFormatState]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      // Sync data-empty attributes and strip legacy placeholder spans.
      const changed = syncAllEmptyAttrs(editorRef.current);
      // Migrate any legacy figcaption/fig-description inline styles.
      const migrated = migrateFigureStyles(editorRef.current);
      if (changed || migrated) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [value, onChange]);

  useEffect(() => {
    const handler = () => updateFormatState();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [updateFormatState]);

  useEffect(() => {
    return () => {
      if (restrictionTimerRef.current) clearTimeout(restrictionTimerRef.current);
    };
  }, []);

  // ─── Derived state ────────────────────────────────────────────────────────

  const currentStyleValue =
    formatState.contextStyle === "FIGCAPTION"      ? "FIGCAPTION"      :
    formatState.contextStyle === "FIG-DESCRIPTION" ? "FIG-DESCRIPTION" :
    formatState.contextStyle === "TH"              ? "TH"              :
    HEADING_TAGS.has(formatState.blockFormat)       ? formatState.blockFormat : "P";

  const currentStyleLabel = BLOCK_STYLE_OPTIONS.find((o) => o.value === currentStyleValue)?.label ?? "Normal Text";

  // Show "*" when there's extra formatting that deviates from the expected defaults:
  // - For H4: bold is default, so show * if italic or underline OR if NOT bold
  // - For Caption (FIGCAPTION): bold + italic is default, so show * if underline OR if missing bold/italic
  // - For Description (FIG-DESCRIPTION): italic is default, so show * if bold or underline OR if NOT italic
  // - For Table Header (TH): bold is default, so show * if italic or underline OR if NOT bold
  // - For regular paragraphs/headings (P, H1-3, H5-6): show * if ANY inline formatting
  const hasExtraFormatting = (() => {
    if (currentStyleValue === "H4") {
      // H4 default: bold only
      return !formatState.bold || formatState.italic || formatState.underline;
    }
    if (currentStyleValue === "FIGCAPTION") {
      // Caption default: bold + italic
      return !formatState.bold || !formatState.italic || formatState.underline;
    }
    if (currentStyleValue === "FIG-DESCRIPTION") {
      // Description default: italic only (not bold)
      return formatState.bold || !formatState.italic || formatState.underline;
    }
    if (currentStyleValue === "TH") {
      // Table header default: bold only
      return !formatState.bold || formatState.italic || formatState.underline;
    }
    // For all other styles (P, H1, H2, H3, H5, H6): any formatting is "extra"
    return formatState.bold || formatState.italic || formatState.underline;
  })();

  const getCellInfo = () => {
    if (!activeCell || !activeTable) return null;
    const row = activeCell.parentElement as HTMLTableRowElement;
    if (!row) return null;
    const cellIndex = Array.from(row.cells).indexOf(activeCell);
    const isInTbody = row.parentElement?.tagName === "TBODY";
    const rowIndex = isInTbody ? Array.from(row.parentElement?.children || []).indexOf(row) : -1;
    const colspan = parseInt(activeCell.getAttribute("colspan") || "1", 10);
    return { cellIndex, rowIndex, isInTbody, colspan };
  };

  const cellInfo = getCellInfo();
  const showTableBar = !!(activeTable && cellInfo && tableBarPos);
  const showImageBar = !!(activeImageFigure && imageBarPos);
  const showColBar = !!(activeColLayout && colBarPos);
  const imgAlign = activeImageFigure ? getImageAlignment(activeImageFigure) : "left";
  const imgCols = activeImageFigure ? figureColumns(activeImageFigure) : 12;
  const currentColCount = activeColLayout
    ? parseInt(activeColLayout.getAttribute("data-rte-cols") || "2", 10)
    : 2;

  // ─── Apply text color ─────────────────────────────────────────────────────

  const applyTextColor = useCallback((color: string) => {
    // Restore the selection that was saved when the color picker was opened
    if (colorSavedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(colorSavedSelectionRef.current);
    } else {
      editorRef.current?.focus();
    }
    document.execCommand("foreColor", false, color);
    setCurrentTextColor(color);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  }, [onChange, updateFormatState]);

  // ─── Toolbar items ────────────────────────────────────────────────────────

  type ToolItem = { icon: React.ReactNode; action: () => void; title: string; active?: boolean; group: number };
  const toolbarItems: ToolItem[] = [
    { icon: <Undo className="size-4" />, action: () => exec("undo"), title: "Undo", group: 0 },
    { icon: <Redo className="size-4" />, action: () => exec("redo"), title: "Redo", group: 0 },
    { icon: <ClipboardPaste className="size-4" />, action: pasteFromToolbar, title: "Paste (from clipboard)", group: 0 },
    { icon: <Bold className="size-4" />, action: () => exec("bold"), title: "Bold", active: formatState.bold, group: 1 },
    { icon: <Italic className="size-4" />, action: () => exec("italic"), title: "Italic", active: formatState.italic, group: 1 },
    { icon: <Underline className="size-4" />, action: () => exec("underline"), title: "Underline", active: formatState.underline, group: 1 },
    { icon: <List className="size-4" />, action: () => exec("insertUnorderedList"), title: "Bullet List", active: formatState.unorderedList, group: 2 },
    { icon: <ListOrdered className="size-4" />, action: () => exec("insertOrderedList"), title: "Numbered List", active: formatState.orderedList, group: 2 },
    { icon: <AlignLeft className="size-4" />, action: () => exec("justifyLeft"), title: "Align Left", active: formatState.justifyLeft, group: 3 },
    { icon: <AlignCenter className="size-4" />, action: () => exec("justifyCenter"), title: "Align Center", active: formatState.justifyCenter, group: 3 },
    { icon: <AlignRight className="size-4" />, action: () => exec("justifyRight"), title: "Align Right", active: formatState.justifyRight, group: 3 },
    { icon: <Minus className="size-4" />, action: () => exec("insertHorizontalRule"), title: "Horizontal Rule", group: 4 },
    { icon: <Image className="size-4" />, action: openImageDialog, title: "Insert Image", group: 4 },
    { icon: <Table className="size-4" />, action: insertTable, title: "Insert Table", group: 4 },
  ];

  const groups: Array<ToolItem[]> = [];
  let lastGroup = -1;
  toolbarItems.forEach((item) => {
    if (item.group !== lastGroup) { groups.push([]); lastGroup = item.group; }
    groups[groups.length - 1].push(item);
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* RTE structural styles */}
      <style>{`
        /* Two-step delete highlight – uses the action colour, not destructive */
        [data-rte-pending-delete] {
          outline: 2px solid var(--color-border-action-primary, #479DFF) !important;
          outline-offset: 3px;
          border-radius: var(--radius-card, 4px);
          opacity: 0.8;
          transition: outline 0.1s, opacity 0.1s;
        }
        /* Legacy placeholder spans – hide if any remain in saved content */
        [data-rte-placeholder] {
          display: none;
        }
        /* Caption: bold + italic, primary label colour, no separator line */
        .rte-editor figure figcaption {
          color: var(--color-label-primary) !important;
          font-style: italic !important;
          font-weight: var(--font-weight-medium) !important;
          border-bottom: none !important;
          border: none !important;
        }
        /* Description: regular italic, secondary label colour */
        .rte-editor figure [data-role="fig-description"] {
          color: var(--color-label-secondary) !important;
          font-style: italic !important;
          font-weight: var(--font-weight-normal) !important;
        }
      `}</style>
      <div className={`${borderless ? "" : "border border-border rounded-[var(--radius-card)]"} bg-card ${className || ""}`}>
        {/* ── Main toolbar ── */}
        <div className={stickyToolbar ? "sticky top-0 z-20" : ""}>
          <div className={`flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-card/90 backdrop-blur-md ${borderless ? "" : "rounded-t-[var(--radius-card)]"}`}>

            {/* Paragraph style dropdown */}
            <div className="relative mr-1" ref={styleDropdownRef}>
              <button
                type="button"
                onClick={() => setShowStyleDropdown((v) => !v)}
                className={`appearance-none bg-background border border-border rounded-[var(--radius)] pl-2.5 pr-7 h-8 text-foreground cursor-pointer flex items-center gap-1 hover:bg-secondary/50 transition-colors ${showStyleDropdown ? "border-primary" : ""}`}
                style={{ fontSize: "var(--text-label)", minWidth: 140 }}
              >
                <span className="flex-1 text-left leading-none" style={{ fontSize: "var(--text-label)" }}>
                  {currentStyleLabel}
                </span>
                {hasExtraFormatting && (
                  <span className="text-primary font-medium leading-none" style={{ fontSize: "var(--text-label)" }}>*</span>
                )}
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              </button>

              {showStyleDropdown && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-[var(--radius-card)] py-1 overflow-hidden"
                  style={{ minWidth: 160, boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.08)" }}
                >
                  {/* Regular paragraph styles */}
                  {BLOCK_STYLE_OPTIONS.filter(o => !o.readOnly).map((opt) => {
                    const isActive = currentStyleValue === opt.value;
                    const showAsterisk = isActive && hasExtraFormatting;
                    // When inside a contextual style (figcaption/description/header), 
                    // disable other styles visually but keep them clickable to reset
                    const isDisabled = !!formatState.contextStyle && !isActive;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => applyParagraphStyle(opt.value)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors
                          ${isActive ? "bg-primary/10 text-primary" : isDisabled ? "text-muted-foreground/40 cursor-default" : "text-foreground hover:bg-secondary/60"}`}
                        style={{ fontSize: "var(--text-label)" }}
                      >
                        <span>{opt.label}</span>
                        {showAsterisk && (
                          <span className="text-primary font-medium ml-1" style={{ fontSize: "var(--text-label)" }}>*</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Divider + active contextual style (only shown when cursor is inside one) */}
                  {formatState.contextStyle && (
                    <>
                      <div className="h-px bg-border mx-2 my-1" />
                      {BLOCK_STYLE_OPTIONS.filter(o => o.readOnly && o.value === currentStyleValue).map((opt) => {
                        const showAsterisk = hasExtraFormatting;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => applyParagraphStyle(opt.value)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-left bg-primary/10 text-primary transition-colors hover:bg-primary/15"
                            style={{ fontSize: "var(--text-label)" }}
                            title="Click to reset formatting"
                        >
                          <span>{opt.label}</span>
                          {showAsterisk && (
                              <span className="text-primary font-medium ml-1" style={{ fontSize: "var(--text-label)" }}>*</span>
                            )}
                        </button>
                      );
                    })}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Standard toolbar groups */}
            {groups.map((group, gi) => (
              <div key={gi} className="contents">
                {gi > 0 && <div className="w-px h-6 bg-border mx-1" />}
                {group.map((item, i) => (
                  <Button key={i} variant="ghost" size="icon"
                    className={`size-8 ${item.active ? "bg-primary/15 text-primary" : ""}`}
                    onClick={(e) => { e.preventDefault(); item.action(); }}
                    title={item.title} type="button"
                  >
                    {item.icon}
                  </Button>
                ))}

                {/* ── Text color button: inserted right after the B/I/U group (gi === 1) ── */}
                {gi === 1 && (
                  <button
                    ref={colorBtnRef}
                    type="button"
                    title="Text color"
                    className={`size-8 rounded-[var(--radius)] flex flex-col items-center justify-center hover:bg-secondary/70 transition-colors focus:outline-none ${showColorPicker ? "bg-primary/15 text-primary" : ""}`}
                    style={{ gap: 3 }}
                    onClick={() => {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0) {
                        colorSavedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                      }
                      setShowColorPicker((v) => !v);
                    }}
                  >
                    <span className="leading-none select-none" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1, marginTop: 1 }}>
                      A
                    </span>
                    <span
                      className="block rounded-sm"
                      style={{ width: 14, height: 3, backgroundColor: currentTextColor, flexShrink: 0 }}
                    />
                  </button>
                )}
              </div>
            ))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Column layout picker */}
            <div className="relative" ref={colPickerRef}>
              <Button
                variant="ghost" size="sm"
                className={`h-8 px-2 gap-1.5 ${showColPicker ? "bg-primary/15 text-primary" : ""}`}
                onClick={() => setShowColPicker((v) => !v)}
                title="Insert column layout" type="button"
              >
                <LayoutTemplate className="size-4" />
                <ChevronDown className="size-3" />
              </Button>

              {showColPicker && (
                <div
                  className="absolute top-full left-0 mt-1.5 z-50 bg-card border border-border rounded-[var(--radius-card)] p-2 flex gap-1.5"
                  style={{ boxShadow: "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.08)" }}
                >
                  {([2, 3, 4] as const).map((n) => (
                    <button
                      key={n} type="button"
                      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-[var(--radius)] hover:bg-secondary/60 active:bg-secondary transition-colors cursor-pointer group"
                      onClick={() => { insertColumnLayout(n); setShowColPicker(false); }}
                      title={`Insert ${n}-column layout`}
                    >
                      <div className="flex gap-1 items-stretch" style={{ height: 28 }}>
                        {Array.from({ length: n }).map((_, i) => (
                          <div key={i}
                            className="bg-border group-hover:bg-primary/40 rounded-sm transition-colors"
                            style={{ width: n === 4 ? 14 : n === 3 ? 18 : 24 }}
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors" style={{ fontSize: "var(--text-label)" }}>
                        {n} col
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Restriction toast (inline, under toolbar) ── */}
          {restrictionMsg && (
            <div
              className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border"
              style={{ borderTop: "1px solid color-mix(in srgb, var(--destructive) 20%, transparent)" }}
            >
              <AlertCircle className="size-3.5 shrink-0" style={{ color: "var(--destructive)" }} />
              <span style={{ fontSize: "var(--text-label)", color: "var(--destructive)" }}>
                {restrictionMsg}
              </span>
              <button
                type="button"
                className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => setRestrictionMsg(null)}
              >
                <X className="size-3" style={{ color: "var(--destructive)" }} />
              </button>
            </div>
          )}
        </div>

        {/* ── Editor area ── */}
        <div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="rte-editor article-content min-h-full px-10 py-12 outline-none overflow-auto max-w-[818px] mx-auto w-full"
            style={{ fontSize: "var(--text-p)", lineHeight: "1.5" }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onMouseUp={updateFormatState}
            onClick={handleEditorClick}
            onBlur={handleEditorBlur}
            onPaste={handlePaste}
          />
        </div>
      </div>

      {/* ── Floating TABLE toolbar ── */}
      {showTableBar && tableBarPos && (
        <div
          ref={tableBarRef}
          className="fixed z-10 flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-card border border-border rounded-[var(--radius-card)] backdrop-blur-md"
          style={{ top: tableBarPos.top, left: tableBarPos.left, fontSize: "var(--text-label)", boxShadow: "0px 4px 12px rgba(0,0,0,0.15), 0px 1px 4px rgba(0,0,0,0.1)" }}
        >
          <span className="text-muted-foreground mr-0.5" style={{ fontSize: "var(--text-label)" }}>Table</span>
          <div className="w-px h-4 bg-border mx-0.5" />
          {/* Copy / Cut table */}
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={copyTableToClipboard} title="Copy table" style={{ fontSize: "var(--text-label)" }}>
            <Copy className="size-3 mr-1" /> Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={cutTableToClipboard} title="Cut table" style={{ fontSize: "var(--text-label)" }}>
            <Scissors className="size-3 mr-1" /> Cut
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={() => { if (activeTable && cellInfo) addRow(activeTable, cellInfo.isInTbody ? cellInfo.rowIndex : -1); }}
            style={{ fontSize: "var(--text-label)" }}>
            <ArrowDown className="size-3 mr-1" /> Add Row
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={() => { if (activeTable && cellInfo) addColumn(activeTable, cellInfo.cellIndex); }}
            style={{ fontSize: "var(--text-label)" }}>
            <ArrowRight className="size-3 mr-1" /> Add Col
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={() => { if (activeTable && cellInfo && cellInfo.isInTbody && cellInfo.rowIndex >= 0) removeRow(activeTable, cellInfo.rowIndex); }}
            disabled={!cellInfo?.isInTbody} style={{ fontSize: "var(--text-label)" }}>
            Del Row
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={() => { if (activeTable && cellInfo) removeColumn(activeTable, cellInfo.cellIndex); }}
            style={{ fontSize: "var(--text-label)" }}>
            Del Col
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button" onClick={mergeCells} style={{ fontSize: "var(--text-label)" }}>
            <TableCellsMerge className="size-3 mr-1" /> Merge
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button" onClick={splitCell}
            disabled={!cellInfo || cellInfo.colspan <= 1} style={{ fontSize: "var(--text-label)" }}>
            <TableCellsSplit className="size-3 mr-1" /> Split
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" type="button"
            onClick={() => {
              if (activeTable) {
                activeTable.remove();
                activeTableRef.current = null;
                setActiveTable(null); setActiveCell(null);
                if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); }
              }
            }} style={{ fontSize: "var(--text-label)" }}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* ── Floating IMAGE toolbar ── */}
      {showImageBar && imageBarPos && (
        <div
          ref={imageBarRef}
          className="fixed z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-[var(--radius-card)] backdrop-blur-md"
          style={{ top: imageBarPos.top, left: imageBarPos.left, fontSize: "var(--text-label)", boxShadow: "0px 4px 12px rgba(0,0,0,0.15), 0px 1px 4px rgba(0,0,0,0.1)" }}
        >
          {/* Column indicator */}
          <span className="text-muted-foreground tabular-nums" style={{ fontSize: "var(--text-label)", minWidth: 48 }}>
            {imgCols}/12 col
          </span>
          <div className="w-px h-4 bg-border" />
          {/* Copy / Cut */}
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={copyImageToClipboard} title="Copy image (Ctrl+C)" style={{ fontSize: "var(--text-label)" }}>
            <Copy className="size-3 mr-1" /> Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" type="button"
            onClick={cutImageToClipboard} title="Cut image (Ctrl+X)" style={{ fontSize: "var(--text-label)" }}>
            <Scissors className="size-3 mr-1" /> Cut
          </Button>
          <div className="w-px h-4 bg-border" />
          {/* Alignment */}
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>Align:</span>
          <Button variant="ghost" size="icon"
            className={`size-7 ${imgAlign === "left" ? "bg-primary/15 text-primary" : ""}`}
            type="button" title="Align left" onClick={() => setImageAlignment("left")}>
            <AlignLeft className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className={`size-7 ${imgAlign === "center" ? "bg-primary/15 text-primary" : ""}`}
            type="button" title="Align center" onClick={() => setImageAlignment("center")}>
            <AlignCenter className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className={`size-7 ${imgAlign === "right" ? "bg-primary/15 text-primary" : ""}`}
            type="button" title="Align right" onClick={() => setImageAlignment("right")}>
            <AlignRight className="size-3.5" />
          </Button>
          <div className="w-px h-4 bg-border" />
          {/* Delete */}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" type="button"
            onClick={deleteImageFigure} title="Delete image" style={{ fontSize: "var(--text-label)" }}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* ── Image selection overlay + resize handles ── */}
      {activeImageFigure && imageFigureRect && (
        <div
          className="fixed pointer-events-none"
          style={{
            top: imageFigureRect.top, left: imageFigureRect.left,
            width: imageFigureRect.width, height: imageFigureRect.height,
            zIndex: 9,
            outline: "2px solid var(--color-primary, #479DFF)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <div className="absolute pointer-events-auto cursor-ew-resize select-none"
            style={{ top: "50%", left: -5, transform: "translateY(-50%)", width: 10, height: 32, backgroundColor: "var(--color-primary, #479DFF)", borderRadius: "var(--radius)", opacity: 0.9 }}
            onMouseDown={(e) => handleResizeMouseDown(e, "left")} />
          <div className="absolute pointer-events-auto cursor-ew-resize select-none"
            style={{ top: "50%", right: -5, transform: "translateY(-50%)", width: 10, height: 32, backgroundColor: "var(--color-primary, #479DFF)", borderRadius: "var(--radius)", opacity: 0.9 }}
            onMouseDown={(e) => handleResizeMouseDown(e, "right")} />
        </div>
      )}

      {/* ── Floating COLUMN LAYOUT toolbar ── */}
      {showColBar && colBarPos && activeColLayout && (
        <div
          ref={colBarRef}
          className="fixed z-10 flex items-center gap-1 px-2.5 py-1.5 bg-card border border-border rounded-[var(--radius-card)] backdrop-blur-md"
          style={{ top: colBarPos.top, left: colBarPos.left, fontSize: "var(--text-label)", boxShadow: "0px 4px 12px rgba(0,0,0,0.15), 0px 1px 4px rgba(0,0,0,0.1)" }}
        >
          <span className="text-muted-foreground mr-0.5 shrink-0" style={{ fontSize: "var(--text-label)" }}>
            Columns
          </span>
          <div className="w-px h-4 bg-border mx-0.5" />
          {([2, 3, 4] as const).map((n) => (
            <button key={n} type="button" title={`${n} columns`}
              className={`flex items-center gap-1.5 px-2 h-6 rounded-[var(--radius)] transition-colors ${currentColCount === n ? "bg-primary/15 text-primary" : "hover:bg-secondary/60 text-foreground"}`}
              onClick={() => changeColumnCount(activeColLayout, n)}>
              <ColIcon count={n} />
              <span style={{ fontSize: "var(--text-label)" }}>{n}</span>
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-0.5" />
          <button type="button"
            className="flex items-center gap-1 px-2 h-6 rounded-[var(--radius)] hover:bg-destructive/10 text-destructive transition-colors"
            onClick={() => deleteColumnLayout(activeColLayout)} style={{ fontSize: "var(--text-label)" }}>
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      )}

      {/* ── Text color picker dropdown ── */}
      {showColorPicker && (
        <ColorPickerDropdown
          anchorEl={colorBtnRef.current}
          onColorSelect={applyTextColor}
          onClose={() => setShowColorPicker(false)}
          activeColor={currentTextColor}
        />
      )}

      {/* ── Image upload dialog ── */}
      {showImageDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
          onClick={() => setShowImageDialog(false)}>
          <div className="bg-card border border-border rounded-[var(--radius-card)] p-6 max-w-[480px] w-full mx-4"
            style={{ boxShadow: "0px 10px 30px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                Insert Image
              </h3>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowImageDialog(false)} type="button">
                <X className="size-4" />
              </Button>
            </div>
            {imageUrl && (
              <div className="mb-4 border border-border rounded-[var(--radius)] overflow-hidden">
                <img src={imageUrl} alt="Preview" className="max-h-[200px] w-full object-contain bg-secondary/20" />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-card-foreground block mb-1" style={{ fontSize: "var(--text-label)" }}>Image URL</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>or</span>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} type="button">
                  <Upload className="size-3.5 mr-1.5" /> Upload File
                </Button>
              </div>
              <div>
                <label className="text-card-foreground block mb-1" style={{ fontSize: "var(--text-label)" }}>Caption (optional)</label>
                <Input value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Describe the image..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="ghost" onClick={() => setShowImageDialog(false)} type="button">Cancel</Button>
              <Button onClick={insertImageFromUrl} disabled={!imageUrl.trim()} type="button">Insert Image</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
