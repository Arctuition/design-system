/**
 * Lazy-load highlight.js + a curated set of languages.
 * The bundler splits these into separate chunks, so visitors who never see a
 * code block never download them. A module-level singleton ensures we only
 * request the chunks once across the whole app.
 */

interface HljsHandle {
  highlightElement: (el: HTMLElement) => void;
}

let hljsPromise: Promise<HljsHandle> | null = null;

export function loadHljs(): Promise<HljsHandle> {
  if (hljsPromise) return hljsPromise;
  hljsPromise = (async () => {
    const [
      coreMod,
      js, ts, xml, css, scss, json, bash, shell, python,
      swift, kotlin, java, go, rust, yaml, markdown, sql, plaintext,
    ] = await Promise.all([
      import("highlight.js/lib/core"),
      import("highlight.js/lib/languages/javascript"),
      import("highlight.js/lib/languages/typescript"),
      import("highlight.js/lib/languages/xml"),
      import("highlight.js/lib/languages/css"),
      import("highlight.js/lib/languages/scss"),
      import("highlight.js/lib/languages/json"),
      import("highlight.js/lib/languages/bash"),
      import("highlight.js/lib/languages/shell"),
      import("highlight.js/lib/languages/python"),
      import("highlight.js/lib/languages/swift"),
      import("highlight.js/lib/languages/kotlin"),
      import("highlight.js/lib/languages/java"),
      import("highlight.js/lib/languages/go"),
      import("highlight.js/lib/languages/rust"),
      import("highlight.js/lib/languages/yaml"),
      import("highlight.js/lib/languages/markdown"),
      import("highlight.js/lib/languages/sql"),
      import("highlight.js/lib/languages/plaintext"),
    ]);
    const hljs = coreMod.default;
    const langs: Array<[string, any]> = [
      ["javascript", js.default], ["typescript", ts.default], ["xml", xml.default],
      ["css", css.default], ["scss", scss.default], ["json", json.default],
      ["bash", bash.default], ["shell", shell.default], ["python", python.default],
      ["swift", swift.default], ["kotlin", kotlin.default], ["java", java.default],
      ["go", go.default], ["rust", rust.default], ["yaml", yaml.default],
      ["markdown", markdown.default], ["sql", sql.default], ["plaintext", plaintext.default],
    ];
    for (const [name, lang] of langs) {
      try { hljs.registerLanguage(name, lang); } catch {}
    }
    const aliases: Array<[string, string]> = [
      ["js", "javascript"], ["ts", "typescript"],
      ["jsx", "javascript"], ["tsx", "typescript"],
      ["html", "xml"], ["htm", "xml"],
      ["sh", "bash"], ["zsh", "bash"],
      ["py", "python"], ["yml", "yaml"],
      ["md", "markdown"], ["text", "plaintext"], ["txt", "plaintext"],
    ];
    for (const [alias, target] of aliases) {
      try { hljs.registerAliases(alias, { languageName: target }); } catch {}
    }
    return { highlightElement: (el: HTMLElement) => hljs.highlightElement(el) };
  })();
  return hljsPromise;
}

/**
 * Highlight every <pre><code> inside `root` that hasn't been highlighted yet.
 * Idempotent: blocks already marked with data-highlighted="yes" are skipped.
 *
 * Returns a cancel function so React effects can opt out of writing to a
 * stale tree on cleanup.
 */
export function highlightCodeIn(root: HTMLElement | null): () => void {
  if (!root) return () => {};
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("pre code")
  ).filter((el) => el.dataset.highlighted !== "yes");
  if (targets.length === 0) return () => {};

  let cancelled = false;
  loadHljs().then((hljs) => {
    if (cancelled) return;
    for (const el of targets) {
      if (el.dataset.highlighted === "yes") continue;
      // If the element is no longer in the DOM (e.g. dialog closed), skip it.
      if (!el.isConnected) continue;
      try { hljs.highlightElement(el); } catch { /* unknown language → leave plain */ }
    }
  });
  return () => { cancelled = true; };
}
