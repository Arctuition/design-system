import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { loadStateFromServer, saveStateKey, bulkSaveState } from "./api";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { enrichAllIconTags } from "./icon-tag-enrichment";

// ---- Types ----
export interface ChangeLogEntry {
  id: string;
  date: string;
  version: string;
  title: string;
  description: string;
}

export interface ColorToken {
  name: string;
  value: string;
  description?: string;
}

export interface ColorTokenGroup {
  globalLight: ColorToken[];
  globalDark: ColorToken[];
  semanticLight: ColorToken[];
  semanticDark: ColorToken[];
}

export interface IconItem {
  id: string;
  name: string;
  tags: string[];
  svgContent: string;
  fileName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatternArticle {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt?: string;
}

export interface EditorAccount {
  id: string;
  username: string;
  password: string;
  role: "admin" | "editor";
  createdAt: string;
}

export interface ArticleVersion {
  id: string;
  articleKey: string;
  content: string;
  timestamp: string;
  author: string;
  label: string;
}

export interface AppState {
  homeArticle: string;
  changeLogs: ChangeLogEntry[];
  typographyArticle: string;
  colorTokens: ColorTokenGroup;
  icons: IconItem[];
  patterns: PatternArticle[];
  editors: EditorAccount[];
  colorArticle: string;
  iconologyArticle: string;
  isAuthenticated: boolean;
  currentUser: EditorAccount | null;
  authExpiry: number | null;
  articleVersions: ArticleVersion[];
}

interface AppContextType extends AppState {
  setHomeArticle: (html: string) => void;
  addChangeLog: (entry: Omit<ChangeLogEntry, "id">) => void;
  updateChangeLog: (id: string, entry: Partial<ChangeLogEntry>) => void;
  removeChangeLog: (id: string) => void;
  setTypographyArticle: (html: string) => void;
  setColorTokens: (tokens: ColorTokenGroup) => void;
  setColorArticle: (html: string) => void;
  setIconologyArticle: (html: string) => void;
  addIcon: (icon: Omit<IconItem, "id">) => void;
  updateIcon: (id: string, icon: Partial<IconItem>) => void;
  removeIcon: (id: string) => void;
  bulkAddIcons: (icons: Omit<IconItem, "id">[]) => void;
  addPattern: (pattern: Omit<PatternArticle, "id" | "createdAt" | "updatedAt" | "deleted">) => void;
  updatePattern: (id: string, pattern: Partial<PatternArticle>) => void;
  softDeletePattern: (id: string) => void;
  restorePattern: (id: string) => void;
  permanentDeletePattern: (id: string) => void;
  addUser: (editor: Omit<EditorAccount, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<Pick<EditorAccount, "role" | "password">>) => void;
  removeUser: (id: string) => void;
  login: (username: string, password: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  saveArticleWithVersion: (articleKey: string, content: string, saveFn: (html: string) => void) => void;
  getArticleVersions: (articleKey: string) => ArticleVersion[];
  restoreArticleVersion: (version: ArticleVersion) => void;
  deleteArticleVersion: (versionId: string) => void;
  isLoading: boolean;
}

const uid = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

function generateRandomPassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = pw.length; i < length; i++) {
    pw.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = pw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

// ---- Default Data ----
const defaultColorTokens: ColorTokenGroup = {
  semanticLight: [
    { name: "--background", value: "rgba(255, 255, 255, 1.00)", description: "Default page background" },
    { name: "--foreground", value: "rgba(38, 38, 38, 1.00)", description: "Default text color" },
    { name: "--primary", value: "rgba(57, 138, 231, 1.00)", description: "Primary interactive color" },
    { name: "--primary-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on primary" },
    { name: "--secondary", value: "rgba(240, 240, 240, 1.00)", description: "Secondary backgrounds" },
    { name: "--secondary-foreground", value: "rgba(0, 0, 0, 0.55)", description: "Text on secondary" },
    { name: "--muted", value: "rgba(230, 230, 230, 1.00)", description: "Muted elements" },
    { name: "--muted-foreground", value: "rgba(0, 0, 0, 0.25)", description: "Text on muted" },
    { name: "--accent", value: "rgba(68, 143, 248, 1.00)", description: "Accent highlights" },
    { name: "--accent-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on accent" },
    { name: "--destructive", value: "rgba(227, 28, 28, 1.00)", description: "Destructive actions" },
    { name: "--destructive-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on destructive" },
    { name: "--border", value: "rgba(217, 217, 217, 1.00)", description: "Default borders" },
    { name: "--input", value: "rgba(255, 255, 255, 1.00)", description: "Input fields" },
    { name: "--ring", value: "rgba(57, 138, 231, 1.00)", description: "Focus rings" },
    { name: "--card", value: "rgba(255, 255, 255, 1.00)", description: "Card backgrounds" },
    { name: "--card-foreground", value: "rgba(0, 0, 0, 0.85)", description: "Text on cards" },
    { name: "--popover", value: "rgba(255, 255, 255, 1.00)", description: "Popover background" },
    { name: "--popover-foreground", value: "rgba(0, 0, 0, 0.85)", description: "Text on popover" },
  ],
  semanticDark: [
    { name: "--background", value: "rgba(38, 38, 38, 1.00)", description: "Default page background" },
    { name: "--foreground", value: "rgba(255, 255, 255, 1.00)", description: "Default text color" },
    { name: "--primary", value: "rgba(68, 143, 248, 1.00)", description: "Primary interactive color" },
    { name: "--primary-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on primary" },
    { name: "--secondary", value: "rgba(60, 60, 60, 1.00)", description: "Secondary backgrounds" },
    { name: "--secondary-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on secondary" },
    { name: "--muted", value: "rgba(80, 80, 80, 1.00)", description: "Muted elements" },
    { name: "--muted-foreground", value: "rgba(255, 255, 255, 0.45)", description: "Text on muted" },
    { name: "--accent", value: "rgba(68, 143, 248, 1.00)", description: "Accent highlights" },
    { name: "--accent-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on accent" },
    { name: "--destructive", value: "rgba(227, 28, 28, 1.00)", description: "Destructive actions" },
    { name: "--destructive-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on destructive" },
    { name: "--border", value: "rgba(80, 80, 80, 1.00)", description: "Default borders" },
    { name: "--input", value: "rgba(60, 60, 60, 1.00)", description: "Input fields" },
    { name: "--ring", value: "rgba(68, 143, 248, 1.00)", description: "Focus rings" },
    { name: "--card", value: "rgba(38, 38, 38, 1.00)", description: "Card backgrounds" },
    { name: "--card-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on cards" },
    { name: "--popover", value: "rgba(38, 38, 38, 1.00)", description: "Popover background" },
    { name: "--popover-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on popover" },
  ],
  globalLight: [
    { name: "--color-white", value: "#FFFFFF", description: "Pure white" },
    { name: "--color-black", value: "#000000", description: "Pure black" },
    { name: "--color-gray-50", value: "#F5F5F5", description: "Gray 50" },
    { name: "--color-gray-100", value: "#E6E6E6", description: "Gray 100" },
    { name: "--color-gray-200", value: "#D9D9D9", description: "Gray 200" },
    { name: "--color-gray-300", value: "#BFBFBF", description: "Gray 300" },
    { name: "--color-gray-500", value: "#808080", description: "Gray 500" },
    { name: "--color-gray-700", value: "#505050", description: "Gray 700" },
    { name: "--color-gray-900", value: "#262626", description: "Gray 900" },
    { name: "--color-blue-500", value: "rgba(57, 138, 231, 1.00)", description: "Blue 500" },
    { name: "--color-blue-600", value: "rgba(68, 143, 248, 1.00)", description: "Blue 600" },
    { name: "--color-red-500", value: "rgba(227, 28, 28, 1.00)", description: "Red 500" },
    { name: "--color-green-500", value: "rgba(4, 181, 11, 1.00)", description: "Green 500" },
    { name: "--color-orange-500", value: "rgba(227, 118, 18, 1.00)", description: "Orange 500" },
  ],
  globalDark: [
    { name: "--color-white", value: "#FFFFFF", description: "Pure white" },
    { name: "--color-black", value: "#000000", description: "Pure black" },
    { name: "--color-gray-50", value: "#3C3C3C", description: "Gray 50 (dark)" },
    { name: "--color-gray-100", value: "#505050", description: "Gray 100 (dark)" },
    { name: "--color-gray-200", value: "#606060", description: "Gray 200 (dark)" },
    { name: "--color-gray-300", value: "#808080", description: "Gray 300 (dark)" },
    { name: "--color-gray-500", value: "#A0A0A0", description: "Gray 500 (dark)" },
    { name: "--color-gray-700", value: "#D0D0D0", description: "Gray 700 (dark)" },
    { name: "--color-gray-900", value: "#F5F5F5", description: "Gray 900 (dark)" },
    { name: "--color-blue-500", value: "rgba(68, 143, 248, 1.00)", description: "Blue 500 (dark)" },
    { name: "--color-blue-600", value: "rgba(100, 165, 255, 1.00)", description: "Blue 600 (dark)" },
    { name: "--color-red-500", value: "rgba(255, 80, 80, 1.00)", description: "Red 500 (dark)" },
    { name: "--color-green-500", value: "rgba(50, 210, 60, 1.00)", description: "Green 500 (dark)" },
    { name: "--color-orange-500", value: "rgba(255, 150, 50, 1.00)", description: "Orange 500 (dark)" },
  ],
};

const defaultChangeLogs: ChangeLogEntry[] = [
  { id: uid(), date: "2026-03-11", version: "1.0.0", title: "Initial Release", description: "Launched the design system with core components including Typography, Color Tokens, Iconology, and Patterns documentation." },
  { id: uid(), date: "2026-03-05", version: "0.9.0", title: "Beta Release", description: "Added semantic and global color token documentation. Introduced dark mode token support." },
  { id: uid(), date: "2026-02-20", version: "0.8.0", title: "Icon Library", description: "Added the icon library with search, download, and tagging capabilities for designers and developers." },
];

const defaultIcons: IconItem[] = [
  { id: uid(), name: "Arrow Right", tags: ["arrow", "direction", "navigation", "right", "forward", "next", "proceed", "continue", "chevron", "east", "go"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>', fileName: "arrow-right.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Arrow Left", tags: ["arrow", "direction", "navigation", "left", "back", "previous", "return", "west", "undo", "retreat"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>', fileName: "arrow-left.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Check", tags: ["check", "confirm", "success", "done", "approve", "tick", "complete", "verified", "accept", "yes", "correct"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>', fileName: "check.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Close", tags: ["close", "x", "dismiss", "remove", "delete", "cancel", "cross", "clear", "exit", "discard"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>', fileName: "close.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Search", tags: ["search", "find", "magnify", "lookup", "magnifying glass", "explore", "discover", "query", "filter", "lens"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>', fileName: "search.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Home", tags: ["home", "house", "main", "dashboard", "residence", "start", "landing", "roof", "building", "shelter"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', fileName: "home.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Settings", tags: ["settings", "gear", "config", "preferences", "sun", "brightness", "light", "display", "contrast", "radial", "rays"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>', fileName: "settings.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "User", tags: ["user", "person", "profile", "account", "avatar", "member", "human", "people", "contact", "identity"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', fileName: "user.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Plus", tags: ["plus", "add", "new", "create", "positive", "increase", "expand", "insert", "append", "more"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>', fileName: "plus.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Menu", tags: ["menu", "hamburger", "navigation", "bars", "list", "lines", "drawer", "sidebar", "toggle", "three lines"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>', fileName: "menu.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Star", tags: ["star", "favorite", "rating", "bookmark", "featured", "highlight", "review", "important", "award", "five point"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', fileName: "star.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Download", tags: ["download", "save", "export", "file", "arrow down", "receive", "get", "fetch", "install", "transfer"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>', fileName: "download.svg", createdAt: "2026-03-18T12:00:00.000Z" },
];

const defaultPatterns: PatternArticle[] = [
  {
    id: uid(),
    title: "Web View",
    content: `<h2>Overview</h2><p>The Web View is a container used to display web content within the app interface. It facilitates embedding web-based content within the mobile and tablet application, allowing reuse of existing web modules while maintaining a cohesive in-app experience.</p><h3>When to Use</h3><p>Use a Web View for content that is external to the app's core codebase, for example, user site management page, interactive help guide, or terms and conditions hosted online.</p><h3>Format Variants</h3><p>To accommodate different workflow scopes and user needs, the Web View is presented in three distinct styles:</p><ul><li><strong>Modal Web View:</strong> A web view displayed as a modal overlay on top of the current context.</li><li><strong>Full-Screen Web View (Single-Page):</strong> A full-screen web view for a single, self-contained web page.</li><li><strong>Full-Screen Web View (Multi-Page/Modal):</strong> A full-screen web view that supports multiple pages or an entire module.</li></ul><h2>Anatomy</h2><h3>Modal Web View</h3><p>An overlay container that dims the background and hosts the web view with a header section displaying the task title.</p><h3>Full-Screen Web View</h3><p>A full-screen container that displays a single web page, providing an immersive browsing experience.</p><h2>Recommendations</h2><p>Use a Web View for content that is external to the app's core codebase. Avoid using a Web View for simple confirmations or inputs that can be achieved with native dialogs or controls.</p>`,
    createdAt: "2026-03-01",
    updatedAt: "2026-03-10",
    deleted: false,
  },
  {
    id: uid(),
    title: "Navigation Patterns",
    content: `<h2>Overview</h2><p>Navigation patterns define how users move through the application. Consistent navigation helps users build a mental model of the app's structure and find content efficiently.</p><h3>Primary Navigation</h3><p>The primary navigation is the main way users move between top-level sections of the application. It is always visible and provides clear indication of the current location.</p><h3>Secondary Navigation</h3><p>Secondary navigation provides access to sub-sections within a primary section. It appears contextually based on the current primary navigation selection.</p><h2>Best Practices</h2><h3>Consistency</h3><p>Maintain consistent navigation patterns throughout the application. Users should always know where they are and how to get back to familiar locations.</p><h3>Hierarchy</h3><p>Organize navigation items in a logical hierarchy that reflects the information architecture of your content.</p>`,
    createdAt: "2026-02-15",
    updatedAt: "2026-03-08",
    deleted: false,
  },
  {
    id: uid(),
    title: "Form Patterns",
    content: `<h2>Overview</h2><p>Form patterns establish consistent approaches for collecting user input across the application. Well-designed forms reduce cognitive load and help users complete tasks efficiently.</p><h3>Input Fields</h3><p>Standard input fields should follow consistent sizing, spacing, and labeling conventions. Always provide clear labels and helpful placeholder text.</p><h3>Validation</h3><p>Form validation should be immediate and helpful. Display error messages inline with the relevant field and use color coding to indicate the state of validation.</p><h2>Layout Guidelines</h2><h3>Single Column</h3><p>Use single-column layouts for forms that require sequential input. This is the most common and accessible layout pattern.</p><h3>Multi Column</h3><p>Multi-column layouts may be used for related fields that logically group together, such as first name and last name.</p>`,
    createdAt: "2026-02-10",
    updatedAt: "2026-03-05",
    deleted: false,
  },
];

const defaultEditors: EditorAccount[] = [
  { id: uid(), username: "admin", password: "ArcSite2026$", role: "admin", createdAt: "2026-01-01" },
];

const defaultHomeArticle = `<h1>Design System</h1><p>Welcome to our Design System. This is a living documentation that provides guidelines, components, and patterns for building consistent user experiences across all our products.</p><p>Our design system helps teams work more efficiently by providing reusable components, clear guidelines, and a shared design language. Explore the sections below to learn about typography, color tokens, iconology, and UI patterns.</p><h2>Getting Started</h2><p>Start by exploring our foundational elements - Typography and Color Tokens. These form the building blocks of every component and pattern in the system. Then dive into our Icon Library and Patterns for more complex implementations.</p>`;

const defaultTypographyArticle = `<h1>Typography</h1><p>Typography is the foundation of our design system's visual language. Consistent use of type helps establish hierarchy, improve readability, and create a cohesive user experience across all platforms.</p><h2>Type Scale</h2><p>Our type scale is based on a modular approach that ensures consistent sizing across all applications. We use Roboto as our primary typeface.</p><h2>Heading Styles</h2><p><strong>H1 - Page Title:</strong> 34px / Normal weight / Line height 1.5</p><p><strong>H2 - Section Title:</strong> 28px / Normal weight / Line height 1.5</p><p><strong>H3 - Subsection Title:</strong> 22px / Normal weight / Line height 1.5</p><p><strong>H4 - Group Title:</strong> 16px / Medium weight / Line height 1.5</p><h2>Body Text</h2><p><strong>Body (P):</strong> 17px / Normal weight / Line height 1.5 - Used for general content and descriptions.</p><p><strong>Label:</strong> 13px / Normal weight / Line height 1.5 - Used for form labels, captions, and metadata.</p><h2>Font Weights</h2><p><strong>Normal (400):</strong> Used for body text, descriptions, and general content.</p><p><strong>Medium (600):</strong> Used for emphasis, headings, and interactive elements that need to stand out.</p>`;

const defaultColorArticle = `<h1>Color Tokens</h1><p>Color tokens are the building blocks of our color system. They provide a consistent and maintainable way to manage colors across all platforms and themes. Our system uses semantic tokens that map to global color values, making theme switching seamless.</p><h2>Token Architecture</h2><p>We use a two-tier token system: <strong>Global Tokens</strong> define the raw color palette, while <strong>Semantic Tokens</strong> assign meaning to those colors based on their usage context. This separation allows us to support multiple themes (light/dark) without changing component code.</p>`;

const defaultIconologyArticle = `<h1>Iconology</h1><p>Our icon library provides a comprehensive set of icons designed for consistency across all products. Each icon follows strict grid and sizing guidelines to ensure visual harmony.</p><h2>Usage Guidelines</h2><p>Icons should be used at their designed sizes (16px, 20px, or 24px). Always use the provided SVG files to ensure crisp rendering at any resolution. Icons use <code>currentColor</code> for stroke so they automatically inherit the text color of their container.</p>`;

const STORAGE_KEY = "ds-app-state";

function getDefaults(): AppState {
  return {
    homeArticle: defaultHomeArticle,
    changeLogs: defaultChangeLogs,
    typographyArticle: defaultTypographyArticle,
    colorTokens: defaultColorTokens,
    colorArticle: defaultColorArticle,
    iconologyArticle: defaultIconologyArticle,
    icons: defaultIcons,
    patterns: defaultPatterns,
    editors: defaultEditors,
    isAuthenticated: false,
    currentUser: null,
    authExpiry: null,
    articleVersions: [],
  };
}

/** Build state from server data, using defaults for missing keys */
function buildStateFromServer(serverData: Record<string, any>): AppState {
  const defaults = getDefaults();

  // Migrate editors that lack a password field
  const rawEditors = Array.isArray(serverData.editors) ? serverData.editors : defaults.editors;
  const editors = rawEditors.map((e: any) => ({
    id: e.id || uid(),
    username: e.username || "unknown",
    password: e.password || (e.username === "admin" ? "ArcSite2026$" : generateRandomPassword()),
    role: e.role || "editor",
    createdAt: e.createdAt || new Date().toISOString().split("T")[0],
  }));

  const ct = serverData.colorTokens || {};

  return {
    homeArticle: serverData.homeArticle ?? defaults.homeArticle,
    changeLogs: Array.isArray(serverData.changeLogs) ? serverData.changeLogs : defaults.changeLogs,
    typographyArticle: serverData.typographyArticle ?? defaults.typographyArticle,
    colorTokens: {
      globalLight: ct.globalLight || defaults.colorTokens.globalLight,
      globalDark: ct.globalDark || defaults.colorTokens.globalDark,
      semanticLight: ct.semanticLight || defaults.colorTokens.semanticLight,
      semanticDark: ct.semanticDark || defaults.colorTokens.semanticDark,
    },
    colorArticle: serverData.colorArticle ?? defaults.colorArticle,
    iconologyArticle: serverData.iconologyArticle ?? defaults.iconologyArticle,
    icons: Array.isArray(serverData.icons)
      ? serverData.icons.map((i: any) => ({
          ...i,
          createdAt: i.createdAt || "2026-03-18T12:00:00.000Z",
          updatedAt: i.updatedAt || i.createdAt || "2026-03-18T12:00:00.000Z",
        }))
      : defaults.icons,
    patterns: Array.isArray(serverData.patterns) ? serverData.patterns : defaults.patterns,
    editors,
    isAuthenticated: false,
    currentUser: null,
    authExpiry: null,
    articleVersions: Array.isArray(serverData.articleVersions) ? serverData.articleVersions : [],
  };
}

function loadStateFromLocalStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return buildStateFromServer(parsed);
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  return getDefaults();
}

function loadFromLocalStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return buildStateFromServer(parsed);
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  return null;
}

function persistKey(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to persist key to localStorage:", err);
  }
}

function seedDefaults(): void {
  const defaults = getDefaults();
  const toSave: Record<string, any> = {
    homeArticle: defaults.homeArticle,
    changeLogs: defaults.changeLogs,
    typographyArticle: defaults.typographyArticle,
    colorTokens: defaults.colorTokens,
    colorArticle: defaults.colorArticle,
    iconologyArticle: defaults.iconologyArticle,
    icons: defaults.icons,
    patterns: defaults.patterns,
    editors: defaults.editors,
    articleVersions: defaults.articleVersions,
  };
  bulkSaveState(toSave).catch((err) => {
    console.error("Failed to seed defaults to server:", err);
  });
}

const AppContext = createContext<AppContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const initialState = loadStateFromLocalStorage();
    // Restore auth session from localStorage if available and not expired
    try {
      const authSession = localStorage.getItem('ds-auth-session');
      if (authSession) {
        const { isAuthenticated, currentUser, authExpiry } = JSON.parse(authSession);
        // Check if session has expired
        if (authExpiry && authExpiry < Date.now()) {
          // Session expired, remove it
          localStorage.removeItem('ds-auth-session');
          console.log('🔒 Auth session expired, logged out');
        } else if (isAuthenticated && currentUser) {
          // Session valid, restore it
          return { ...initialState, isAuthenticated, currentUser, authExpiry };
        }
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    }
    return initialState;
  });
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  // Track which keys changed for granular server sync
  const pendingSyncRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: load from server and seed defaults if needed
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const serverData = await loadStateFromServer();
        if (serverData) {
          // Check if server has any non-null data
          const hasData = Object.values(serverData).some((v) => v !== null);
          if (hasData) {
            const newState = buildStateFromServer(serverData);
            setState((prev) => ({ ...newState, isAuthenticated: prev.isAuthenticated, currentUser: prev.currentUser, authExpiry: prev.authExpiry }));

            // Idempotent tag enrichment: adds semantic search tags based on icon names & SVG structure
            const enriched = enrichAllIconTags(newState.icons);
            if (enriched) {
              setState((prev) => ({ ...prev, icons: enriched }));
              persistKey("ds:icons", enriched);
            }

            console.log("✅ Loaded state from server");
            setIsLoading(false);
            return;
          }
        }
        
        // If server has no data or failed to load, fall back to localStorage
        console.log("⚠️ Server has no data, using localStorage");
        const localState = loadFromLocalStorage();
        if (localState && Object.keys(localState).length > 0) {
          setState((prev) => ({ ...localState, isAuthenticated: prev.isAuthenticated, currentUser: prev.currentUser, authExpiry: prev.authExpiry }));
          console.log("✅ Loaded state from localStorage");
          setIsLoading(false);
          return;
        }

        // Otherwise seed defaults
        console.log("📦 Seeding default state");
        seedDefaults();
        setIsLoading(false);
      } catch (err) {
        // Server unavailable - silently fall back to localStorage
        console.log("📡 Server unavailable, using localStorage");
        
        // Fallback to localStorage on error
        try {
          const localState = loadFromLocalStorage();
          if (localState && Object.keys(localState).length > 0) {
            setState((prev) => ({ ...localState, isAuthenticated: prev.isAuthenticated, currentUser: prev.currentUser, authExpiry: prev.authExpiry }));
            console.log("✅ Loaded state from localStorage");
            setIsLoading(false);
            return;
          }
        } catch (localErr) {
          console.warn("Could not load from localStorage:", localErr);
        }
        
        // Final fallback: use defaults already in state
        console.log("📦 Using default state");
        setIsLoading(false);
      }
    })();
  }, []);

  // Flush pending sync on page unload to prevent data loss
  useEffect(() => {
    const flushSync = () => {
      const keys = Array.from(pendingSyncRef.current);
      pendingSyncRef.current.clear();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (keys.length === 0) return;

      // During unload, use sendBeacon for best-effort delivery
      // This is more reliable than fetch during page unload
      const stateKeyMap: Record<string, any> = {
        homeArticle: state.homeArticle,
        changeLogs: state.changeLogs,
        typographyArticle: state.typographyArticle,
        colorTokens: state.colorTokens,
        colorArticle: state.colorArticle,
        iconologyArticle: state.iconologyArticle,
        icons: state.icons,
        patterns: state.patterns,
        editors: state.editors,
        articleVersions: state.articleVersions,
      };
      
      const payload: Record<string, any> = {};
      for (const key of keys) {
        if (stateKeyMap[key] !== undefined) {
          payload[key] = stateKeyMap[key];
        }
      }
      
      if (Object.keys(payload).length > 0) {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-067f252d/state`;
        try {
          // Use sendBeacon for reliable delivery during page unload
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          const headers = {
            type: "application/json",
          };
          // Note: sendBeacon doesn't support custom headers, so we skip Authorization
          // The data is already in localStorage, so this is just a backup sync
          navigator.sendBeacon(url, blob);
        } catch (err) {
          // If sendBeacon fails, data is already in localStorage so it's fine
        }
      }
    };

    window.addEventListener("beforeunload", flushSync);
    return () => window.removeEventListener("beforeunload", flushSync);
  }, [state]);

  // Persist to localStorage on every state change (instant local cache)
  useEffect(() => {
    const { isAuthenticated, currentUser, ...rest } = state;
    const payload = { ...rest, isAuthenticated: false, currentUser: null };

    // Helper: try to save, strip data progressively if quota exceeded
    const trySave = () => {
      // Attempt 1: full state
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return;
      } catch (e1) {
        if (!isQuotaError(e1)) { console.error("localStorage save failed:", e1); return; }
      }

      // Attempt 2: drop articleVersions (can grow large)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, articleVersions: [] }));
        console.warn("localStorage: dropped articleVersions to fit quota.");
        return;
      } catch (e2) {
        if (!isQuotaError(e2)) { console.error("localStorage save failed:", e2); return; }
      }

      // Attempt 3: drop articleVersions + strip SVG content from icons (keep metadata only)
      try {
        const lightIcons = (payload.icons || []).map(
          ({ id, name, tags, fileName, createdAt, updatedAt }: any) =>
            ({ id, name, tags, fileName, createdAt, updatedAt, svgContent: "" })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, articleVersions: [], icons: lightIcons }));
        console.warn("localStorage: stripped icon SVG content to fit quota.");
        return;
      } catch (e3) {
        if (!isQuotaError(e3)) { console.error("localStorage save failed:", e3); return; }
      }

      // Attempt 4: save minimal state (auth/user data only, rely on server for the rest)
      try {
        const minimal = {
          homeArticle: "",
          changeLogs: [],
          typographyArticle: "",
          colorTokens: payload.colorTokens,
          colorArticle: "",
          iconologyArticle: "",
          icons: [],
          patterns: [],
          editors: payload.editors,
          articleVersions: [],
          isAuthenticated: false,
          currentUser: null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        console.warn("localStorage: saved minimal state only (quota exceeded). Server sync will restore full data.");
      } catch (e4) {
        // All attempts failed — clear to prevent stale/corrupt data
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        console.error("localStorage: completely full, cleared cache. Server sync is the source of truth.", e4);
      }
    };

    trySave();
  }, [state]);

  // Debounced sync of changed keys to server
  const syncToServer = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const keys = Array.from(pendingSyncRef.current);
      pendingSyncRef.current.clear();
      if (keys.length === 0) return;

      // Read current state for the pending keys
      setState((currentState) => {
        const stateKeyMap: Record<string, any> = {
          homeArticle: currentState.homeArticle,
          changeLogs: currentState.changeLogs,
          typographyArticle: currentState.typographyArticle,
          colorTokens: currentState.colorTokens,
          colorArticle: currentState.colorArticle,
          iconologyArticle: currentState.iconologyArticle,
          icons: currentState.icons,
          patterns: currentState.patterns,
          editors: currentState.editors,
          articleVersions: currentState.articleVersions,
        };

        // Save each changed key
        for (const key of keys) {
          if (stateKeyMap[key] !== undefined) {
            saveStateKey(key, stateKeyMap[key]).catch(() => {
              // Silently fail - localStorage is the primary storage
            });
          }
        }
        return currentState; // no state change
      });
    }, 500); // debounce 500ms
  }, []);

  const update = useCallback((partial: Partial<AppState>, ...changedKeys: string[]) => {
    setState((prev) => ({ ...prev, ...partial }));
    for (const k of changedKeys) {
      pendingSyncRef.current.add(k);
    }
    syncToServer();
  }, [syncToServer]);

  const ctx: AppContextType = {
    ...state,
    isLoading,
    setHomeArticle: (html) => update({ homeArticle: html }, "homeArticle"),
    addChangeLog: (entry) =>
      update({ changeLogs: [{ ...entry, id: uid() }, ...state.changeLogs] }, "changeLogs"),
    updateChangeLog: (id, entry) =>
      update({ changeLogs: state.changeLogs.map((c) => (c.id === id ? { ...c, ...entry } : c)) }, "changeLogs"),
    removeChangeLog: (id) =>
      update({ changeLogs: state.changeLogs.filter((c) => c.id !== id) }, "changeLogs"),
    setTypographyArticle: (html) => update({ typographyArticle: html }, "typographyArticle"),
    setColorTokens: (tokens) => {
      setState((prev) => ({
        ...prev,
        colorTokens: {
          globalLight: tokens.globalLight || [],
          globalDark: tokens.globalDark || [],
          semanticLight: tokens.semanticLight || [],
          semanticDark: tokens.semanticDark || [],
        },
      }));
      pendingSyncRef.current.add("colorTokens");
      syncToServer();
    },
    setColorArticle: (html) => update({ colorArticle: html }, "colorArticle"),
    setIconologyArticle: (html) => update({ iconologyArticle: html }, "iconologyArticle"),
    addIcon: (icon) => {
      const now = new Date().toISOString();
      setState((prev) => ({ ...prev, icons: [...prev.icons, { ...icon, id: uid(), createdAt: icon.createdAt || now, updatedAt: icon.updatedAt || now }] }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    updateIcon: (id, icon) => {
      setState((prev) => ({ ...prev, icons: prev.icons.map((i) => (i.id === id ? { ...i, ...icon, updatedAt: new Date().toISOString() } : i)) }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    removeIcon: (id) => {
      setState((prev) => ({ ...prev, icons: prev.icons.filter((i) => i.id !== id) }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    bulkAddIcons: (icons) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        icons: [
          ...prev.icons,
          ...icons.map((icon) => ({ ...icon, id: uid(), createdAt: icon.createdAt || now, updatedAt: icon.updatedAt || now })),
        ],
      }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    addPattern: (pattern) =>
      update({
        patterns: [
          ...state.patterns,
          { ...pattern, id: uid(), createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0], deleted: false },
        ],
      }, "patterns"),
    updatePattern: (id, pattern) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, ...pattern, updatedAt: new Date().toISOString().split("T")[0] } : p
        ),
      }, "patterns"),
    softDeletePattern: (id) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, deleted: true, deletedAt: new Date().toISOString().split("T")[0] } : p
        ),
      }, "patterns"),
    restorePattern: (id) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, deleted: false, deletedAt: undefined } : p
        ),
      }, "patterns"),
    permanentDeletePattern: (id) =>
      update({ patterns: state.patterns.filter((p) => p.id !== id) }, "patterns"),
    addUser: (editor) =>
      update({ editors: [...state.editors, { ...editor, id: uid(), createdAt: new Date().toISOString().split("T")[0] }] }, "editors"),
    updateUser: (id, updates) =>
      update({
        editors: state.editors.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }, "editors"),
    removeUser: (id) =>
      update({ editors: state.editors.filter((e) => e.id !== id) }, "editors"),
    login: (username: string, password: string, rememberMe?: boolean) => {
      const user = state.editors.find((e) => e.username === username && e.password === password);
      if (user) {
        const expiry = rememberMe ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null; // 7 days in milliseconds
        setState((prev) => ({ ...prev, isAuthenticated: true, currentUser: user, authExpiry: expiry }));
        // Persist auth state to localStorage for session persistence
        try {
          localStorage.setItem('ds-auth-session', JSON.stringify({ 
            isAuthenticated: true, 
            currentUser: user,
            authExpiry: expiry
          }));
        } catch (err) {
          console.error("Failed to persist auth session:", err);
        }
        return true;
      }
      return false;
    },
    logout: () => {
      update({ isAuthenticated: false, currentUser: null, authExpiry: null });
      // Clear persisted auth session
      try {
        localStorage.removeItem('ds-auth-session');
      } catch (err) {
        console.error("Failed to clear auth session:", err);
      }
    },

    // Versioning
    saveArticleWithVersion: (articleKey: string, content: string, saveFn: (html: string) => void) => {
      // Get the current content before saving to store as version
      const currentContentMap: Record<string, string> = {
        home: state.homeArticle,
        typography: state.typographyArticle,
        color: state.colorArticle,
        iconology: state.iconologyArticle,
      };
      // Also check pattern articles (key format: "pattern-{id}")
      let currentContent = currentContentMap[articleKey];
      if (!currentContent && articleKey.startsWith("pattern-")) {
        const patternId = articleKey.replace("pattern-", "");
        const pattern = state.patterns.find((p) => p.id === patternId);
        if (pattern) currentContent = pattern.content;
      }
      if (currentContent && currentContent !== content) {
        const existingVersions = (state.articleVersions || []).filter((v) => v.articleKey === articleKey);
        const versionNum = existingVersions.length + 1;
        const newVersion: ArticleVersion = {
          id: uid(),
          articleKey,
          content: currentContent,
          timestamp: new Date().toISOString(),
          author: state.currentUser?.username || "admin",
          label: `Version ${versionNum}`,
        };
        update({
          articleVersions: [newVersion, ...(state.articleVersions || [])],
        }, "articleVersions");
      }
      saveFn(content);
    },
    getArticleVersions: (articleKey: string) => {
      return (state.articleVersions || []).filter((v) => v.articleKey === articleKey);
    },
    restoreArticleVersion: (_version: ArticleVersion) => {
      // This is handled by ArticleEditorPage setting draft state
    },
    deleteArticleVersion: (versionId: string) => {
      update({
        articleVersions: state.articleVersions.filter((v) => v.id !== versionId),
      }, "articleVersions");
    },
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // Return a safe loading stub so HMR / error-boundary renders don't crash
    return {
      isLoading: true,
      homeArticle: "",
      changeLogs: [],
      typographyArticle: "",
      colorTokens: { globalLight: [], globalDark: [], semanticLight: [], semanticDark: [] },
      colorArticle: "",
      iconologyArticle: "",
      icons: [],
      patternsArticle: "",
      patterns: [],
      trashedPatterns: [],
      users: [],
      setHomeArticle: () => {},
      addChangeLog: () => {},
      updateChangeLog: () => {},
      removeChangeLog: () => {},
      setTypographyArticle: () => {},
      setColorTokens: () => {},
      setColorArticle: () => {},
      setIconologyArticle: () => {},
      addIcon: () => {},
      updateIcon: () => {},
      removeIcon: () => {},
      bulkAddIcons: () => {},
      setPatternsArticle: () => {},
      addPattern: () => {},
      updatePattern: () => {},
      softDeletePattern: () => {},
      restorePattern: () => {},
      permanentDeletePattern: () => {},
      addUser: () => {},
      updateUser: () => {},
      removeUser: () => {},
    } as unknown as AppContextType;
  }
  return ctx;
}

function isQuotaError(e: any): boolean {
  if (!(e instanceof DOMException)) return false;
  // code 22 = QUOTA_EXCEEDED_ERR (standard)
  // name checks cover Safari/Firefox variants
  return (
    e.code === 22 ||
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}