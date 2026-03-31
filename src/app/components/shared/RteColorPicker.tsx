import React, { useRef, useEffect, useState, useCallback } from "react";

// ─── Palette Generation ───────────────────────────────────────────────────────

/** HSL → hex string */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// 10 representative hues spanning the full spectrum
const HUES = [0, 18, 34, 55, 122, 170, 198, 228, 268, 300];
// 7 shade rows: [saturation%, lightness%] → dark ➜ light
const SHADE_VARIANTS: [number, number][] = [
  [90, 18],   // darkest
  [90, 30],   // dark
  [92, 46],   // vivid
  [82, 57],   // medium
  [72, 70],   // light-medium
  [62, 82],   // light
  [50, 92],   // lightest / pastel
];

/** 7 rows × 10 columns color grid (dark-to-light rows) */
export const COLOR_GRID: string[][] = SHADE_VARIANTS.map(([s, l]) =>
  HUES.map((h) => hslToHex(h, s, l))
);

/** 10 monochrome swatches using our design-system gray tokens */
export const MONO_ROW: string[] = [
  "#000000", "#262626", "#4C4C4C", "#737373", "#999999",
  "#BFBFBF", "#D9D9D9", "#E6E6E6", "#F0F0F0", "#FFFFFF",
];

/** Initial custom colors seeded from our design-system brand tokens */
const DS_CUSTOM_DEFAULTS: string[] = [
  "#398AE7", "#E31C1C", "#04B50B", "#E37612", "#E3C712",
  "#479DFF", "#E3571C", "#A02323", "#274928", "#3569A6",
];

const CUSTOM_KEY = "rte-custom-colors";
const MAX_CUSTOM = 10;

// ─── Color Utilities ──────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

/** Normalises any browser-returned color value (rgb(), #hex, etc.) to lowercase #rrggbb */
export function parseColorToHex(raw: string): string {
  if (!raw || raw === "transparent") return "#000000";
  // rgb(r, g, b) or rgba(r, g, b, a)
  const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
  if (raw.startsWith("#")) {
    const h = raw.slice(1);
    if (h.length === 3) return "#" + h.split("").map((c) => c + c).join("");
    if (h.length === 6) return raw.toLowerCase();
  }
  return "#000000";
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

export function loadCustomColors(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, MAX_CUSTOM);
    }
  } catch {}
  return [...DS_CUSTOM_DEFAULTS];
}

export function addCustomColor(color: string): string[] {
  const current = loadCustomColors();
  const norm = color.toLowerCase();
  const deduped = current.filter((c) => c.toLowerCase() !== norm);
  const updated = [norm, ...deduped].slice(0, MAX_CUSTOM);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

// ─── Custom Color Picker Dialog ───────────────────────────────────────────────

interface CustomColorPickerDialogProps {
  initialColor?: string;
  onClose: () => void;
  onApply: (hex: string) => void;
}

const SV_W = 316;
const SV_H = 180;

export function CustomColorPickerDialog({
  initialColor = "#e74040",
  onClose,
  onApply,
}: CustomColorPickerDialogProps) {
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const [hexInput, setHexInput] = useState("e74040");
  const [rIn, setRIn] = useState("231");
  const [gIn, setGIn] = useState("64");
  const [bIn, setBIn] = useState("64");

  const svRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const isDragSv = useRef(false);
  const isDragHue = useRef(false);

  // Initialise from prop
  useEffect(() => {
    const rgb = hexToRgb(initialColor);
    if (!rgb) return;
    const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHue(h); setSat(s); setVal(v);
    setHexInput(rgbToHex(rgb[0], rgb[1], rgb[2]).slice(1));
    setRIn(String(rgb[0])); setGIn(String(rgb[1])); setBIn(String(rgb[2]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRgb = hsvToRgb(hue, sat, val);
  const currentHex = rgbToHex(...currentRgb);

  // Draw SV gradient
  useEffect(() => {
    const canvas = svRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    const [pr, pg, pb] = hsvToRgb(hue, 1, 1);
    ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
    ctx.fillRect(0, 0, w, h);
    const wg = ctx.createLinearGradient(0, 0, w, 0);
    wg.addColorStop(0, "rgba(255,255,255,1)");
    wg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  }, [hue]);

  // Draw hue slider
  useEffect(() => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    [0, 60, 120, 180, 240, 300, 360].forEach((deg) => {
      const [cr, cg, cb] = hsvToRgb(deg, 1, 1);
      grad.addColorStop(deg / 360, `rgb(${cr},${cg},${cb})`);
    });
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  }, []);

  const syncFromHsv = useCallback((h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    setRIn(String(r)); setGIn(String(g)); setBIn(String(b));
    setHexInput(rgbToHex(r, g, b).slice(1));
  }, []);

  const pickSv = useCallback((clientX: number, clientY: number) => {
    const canvas = svRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newS = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newV = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setSat(newS); setVal(newV); syncFromHsv(hue, newS, newV);
  }, [hue, syncFromHsv]);

  const pickHue = useCallback((clientX: number) => {
    const canvas = hueRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newH = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setHue(newH); syncFromHsv(newH, sat, val);
  }, [sat, val, syncFromHsv]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragSv.current) pickSv(e.clientX, e.clientY);
      if (isDragHue.current) pickHue(e.clientX);
    };
    const onUp = () => { isDragSv.current = false; isDragHue.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [pickSv, pickHue]);

  const onHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace("#", "");
    setHexInput(v);
    if (v.length === 6) {
      const rgb = hexToRgb("#" + v);
      if (rgb) {
        const [h, s, vv] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
        setHue(h); setSat(s); setVal(vv);
        setRIn(String(rgb[0])); setGIn(String(rgb[1])); setBIn(String(rgb[2]));
      }
    }
  };

  const onRgbChange = (ch: 0 | 1 | 2, value: string) => {
    const n = Math.max(0, Math.min(255, parseInt(value) || 0));
    const rgb: [number, number, number] = [parseInt(rIn) || 0, parseInt(gIn) || 0, parseInt(bIn) || 0];
    rgb[ch] = n;
    [setRIn, setGIn, setBIn][ch](String(n));
    const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHue(h); setSat(s); setVal(v);
    setHexInput(rgbToHex(rgb[0], rgb[1], rgb[2]).slice(1));
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-card rounded-[var(--radius-card)] overflow-hidden"
        style={{
          width: SV_W,
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* SV Picker canvas */}
        <div className="relative select-none" style={{ height: SV_H }}>
          <canvas
            ref={svRef}
            width={SV_W}
            height={SV_H}
            className="absolute inset-0 cursor-crosshair"
            style={{ width: "100%", height: "100%", display: "block" }}
            onMouseDown={(e) => { isDragSv.current = true; pickSv(e.clientX, e.clientY); }}
          />
          {/* Crosshair cursor */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 16, height: 16,
              left: `calc(${(sat * 100).toFixed(2)}% - 8px)`,
              top: `calc(${((1 - val) * 100).toFixed(2)}% - 8px)`,
              border: "2.5px solid white",
              boxShadow: "0 0 0 1.5px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.1)",
              backgroundColor: currentHex,
            }}
          />
        </div>

        {/* Controls area */}
        <div className="p-4 space-y-3.5">
          {/* Preview + hue slider */}
          <div className="flex items-center gap-3">
            {/* Color preview swatch */}
            <div
              className="rounded-full shrink-0"
              style={{
                width: 38, height: 38,
                backgroundColor: currentHex,
                boxShadow: "0 0 0 1.5px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.15)",
              }}
            />
            {/* Hue slider */}
            <div className="relative flex-1 select-none" style={{ height: 24 }}>
              <canvas
                ref={hueRef}
                width={240}
                height={14}
                className="absolute rounded-full cursor-pointer"
                style={{ width: "100%", height: 14, top: 5, left: 0, display: "block" }}
                onMouseDown={(e) => { isDragHue.current = true; pickHue(e.clientX); }}
              />
              {/* Thumb */}
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: 22, height: 22,
                  left: `calc(${((hue / 360) * 100).toFixed(2)}% - 11px)`,
                  top: 1,
                  border: "2.5px solid white",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                  backgroundColor: rgbToHex(...hsvToRgb(hue, 1, 1)),
                }}
              />
            </div>
          </div>

          {/* Hex + RGB inputs */}
          <div className="flex items-end gap-2">
            {/* Hex input */}
            <div className="flex flex-col gap-1" style={{ width: 96 }}>
              <label className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                Hex
              </label>
              <div
                className="flex items-center border border-border rounded-[var(--radius)] bg-background overflow-hidden focus-within:ring-1 focus-within:ring-primary"
                style={{ height: 32 }}
              >
                <span className="pl-2 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>#</span>
                <input
                  type="text"
                  value={hexInput}
                  onChange={onHexChange}
                  maxLength={6}
                  className="flex-1 pr-1.5 pl-0.5 h-full bg-transparent outline-none text-foreground min-w-0"
                  style={{ fontSize: "var(--text-label)" }}
                  placeholder="000000"
                />
              </div>
            </div>

            {/* R G B inputs */}
            {(["R", "G", "B"] as const).map((ch, idx) => (
              <div key={ch} className="flex flex-col gap-1 flex-1">
                <label className="text-muted-foreground text-center" style={{ fontSize: "var(--text-label)" }}>
                  {ch}
                </label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={[rIn, gIn, bIn][idx]}
                  onChange={(e) => onRgbChange(idx as 0 | 1 | 2, e.target.value)}
                  className="border border-border rounded-[var(--radius)] bg-background text-foreground text-center outline-none focus:ring-1 focus:ring-primary w-full"
                  style={{ fontSize: "var(--text-label)", height: 32 }}
                />
              </div>
            ))}
          </div>

          {/* Cancel / OK */}
          <div className="flex justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 rounded-[var(--radius-card)] border border-border text-foreground hover:bg-secondary transition-colors"
              style={{ fontSize: "var(--text-p)", height: 36 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(currentHex)}
              className="px-4 rounded-[var(--radius-card)] bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              style={{ fontSize: "var(--text-p)", height: 36 }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Color Picker Dropdown ──────────────────────────��──────────────────────────

interface ColorPickerDropdownProps {
  anchorEl: HTMLElement | null;
  onColorSelect: (color: string) => void;
  onClose: () => void;
  activeColor?: string;
}

export function ColorPickerDropdown({
  anchorEl,
  onColorSelect,
  onClose,
  activeColor,
}: ColorPickerDropdownProps) {
  const [customColors, setCustomColors] = useState<string[]>(() => loadCustomColors());
  const [showPicker, setShowPicker] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Calculate dropdown position
  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const panelW = 292;
    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
  }, [anchorEl]);

  // Flip upward if below viewport
  useEffect(() => {
    if (!pos || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8 && anchorEl) {
      const anchorRect = anchorEl.getBoundingClientRect();
      setPos((p) => p ? { ...p, top: anchorRect.top - rect.height - 6 } : p);
    }
  }, [pos, anchorEl]);

  // Close on outside click (skip while custom picker is open)
  useEffect(() => {
    if (showPicker) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorEl?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorEl, showPicker]);

  const applyColor = useCallback(
    (color: string) => { onColorSelect(color); onClose(); },
    [onColorSelect, onClose]
  );

  const handleCustomApply = useCallback(
    (color: string) => {
      const updated = addCustomColor(color);
      setCustomColors(updated);
      setShowPicker(false);
      applyColor(color);
    },
    [applyColor]
  );

  if (!pos) return null;

  const active = activeColor?.toLowerCase();

  /** Single color swatch */
  const Swatch = ({ color }: { color: string }) => {
    const isActive = active === color.toLowerCase();
    return (
      <button
        type="button"
        title={color.toUpperCase()}
        onMouseDown={(e) => { e.preventDefault(); applyColor(color); }}
        className="rounded-full flex-shrink-0 relative focus:outline-none"
        style={{
          width: 24, height: 24,
          backgroundColor: color,
          boxShadow: isActive
            ? `0 0 0 2px var(--card), 0 0 0 3.5px ${color}`
            : "0 0 0 1px rgba(0,0,0,0.13)",
          transition: "transform 0.1s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.18)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
      />
    );
  };

  return (
    <>
      <div
        ref={panelRef}
        className="fixed z-[9998] bg-card border border-border rounded-[var(--radius-card)]"
        style={{
          top: pos.top,
          left: pos.left,
          padding: "10px 10px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
          minWidth: 286,
        }}
      >
        {/* Mono row */}
        <div className="flex gap-1 mb-1">
          {MONO_ROW.map((color) => <Swatch key={color} color={color} />)}
        </div>

        {/* Color grid rows */}
        <div className="flex flex-col gap-1">
          {COLOR_GRID.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((color, ci) => <Swatch key={ci} color={color} />)}
            </div>
          ))}
        </div>

        {/* Custom section */}
        <div className="mt-2.5 pt-2.5 border-t border-border">
          <p
            className="font-semibold text-muted-foreground mb-2"
            style={{ fontSize: 10, letterSpacing: "0.1em" }}
          >
            CUSTOM
          </p>
          <div className="flex gap-1 flex-wrap items-center">
            {customColors.map((color, i) => <Swatch key={i} color={color} />)}

            {/* Add custom color button */}
            <button
              type="button"
              title="Add custom color"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowPicker(true); }}
              className="rounded-full flex items-center justify-center flex-shrink-0 hover:bg-secondary transition-colors focus:outline-none"
              style={{
                width: 24, height: 24,
                boxShadow: "0 0 0 1.5px rgba(0,0,0,0.18)",
                backgroundColor: "var(--background)",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <CustomColorPickerDialog
          initialColor={activeColor || customColors[0] || "#398ae7"}
          onClose={() => setShowPicker(false)}
          onApply={handleCustomApply}
        />
      )}
    </>
  );
}
