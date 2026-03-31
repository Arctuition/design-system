export function iconFileNameToDisplayName(fileName: string): string {
  return fileName
    .replace(/\.svg$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayNameToIconFileName(name: string): string {
  const baseName = name
    .trim()
    .replace(/\.svg$/i, "")
    .replace(/[^a-zA-Z0-9\s_-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${baseName || "icon"}.svg`;
}

export function getIconDownloadFileName(fileName: string | undefined, fallbackName: string): string {
  const normalized = (fileName || displayNameToIconFileName(fallbackName)).trim();
  return normalized.toLowerCase().endsWith(".svg") ? normalized : `${normalized}.svg`;
}
