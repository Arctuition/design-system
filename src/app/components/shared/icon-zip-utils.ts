import JSZip from "jszip";
import type { IconItem } from "../../store/data-store";

export async function downloadIconsAsZip(icons: IconItem[], zipFileName = "icons.zip") {
  if (icons.length === 0) return;
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  icons.forEach((icon) => {
    let name = icon.fileName || `${icon.name}.svg`;
    if (!name.toLowerCase().endsWith(".svg")) name += ".svg";

    // Deduplicate file names
    const count = usedNames.get(name) || 0;
    if (count > 0) {
      const base = name.replace(/\.svg$/i, "");
      name = `${base}-${count}.svg`;
    }
    usedNames.set(icon.fileName || `${icon.name}.svg`, count + 1);

    zip.file(name, icon.svgContent);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  a.click();
  URL.revokeObjectURL(url);
}
