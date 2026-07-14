import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolColumn, ToolField, ToolOutputList, ToolError } from "./shared";

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const roundAlpha = (a: number) => Math.round(a * 1000) / 1000;

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const rgbaToHex = (rgba: Rgba): string => {
  const hex = rgbToHex(rgba.r, rgba.g, rgba.b);
  if (rgba.a >= 1) return hex;
  const alpha = Math.round(rgba.a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alpha}`.toUpperCase();
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
};

const parseHex = (value: string): Rgba | null => {
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return { r: parseInt(hex[0] + hex[0], 16), g: parseInt(hex[1] + hex[1], 16), b: parseInt(hex[2] + hex[2], 16), a: 1 };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  if (/^[0-9a-f]{8}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  return null;
};

const parseRgb = (value: string): Rgba | null => {
  const match = value.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!match) return null;
  const r = clamp(Math.round(Number(match[1])), 0, 255);
  const g = clamp(Math.round(Number(match[2])), 0, 255);
  const b = clamp(Math.round(Number(match[3])), 0, 255);
  const a = match[4] !== undefined ? clamp(Number(match[4]), 0, 1) : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
};

const parseHsl = (value: string): Rgba | null => {
  const match = value.trim().match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!match) return null;
  const h = ((Number(match[1]) % 360) + 360) % 360;
  const s = clamp(Number(match[2]), 0, 100);
  const l = clamp(Number(match[3]), 0, 100);
  const a = match[4] !== undefined ? clamp(Number(match[4]), 0, 1) : 1;
  if ([h, s, l, a].some((n) => Number.isNaN(n))) return null;
  return { ...hslToRgb(h, s, l), a };
};

const parseColorInput = (value: string): Rgba | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#") || /^[0-9a-f]{3,8}$/i.test(trimmed)) {
    return parseHex(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
  }
  if (trimmed.toLowerCase().startsWith("rgb")) return parseRgb(trimmed);
  if (trimmed.toLowerCase().startsWith("hsl")) return parseHsl(trimmed);
  return null;
};

const toPickerHex = (rgba: Rgba): string => rgbToHex(rgba.r, rgba.g, rgba.b);

export function ColorConverter() {
  const { t } = useI18n();
  const [input, setInput] = useState("#8B5CF6");

  const rgba = useMemo(() => parseColorInput(input), [input]);

  const formats = useMemo(() => {
    if (!rgba) return null;
    const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
    const alpha = roundAlpha(rgba.a);
    return {
      hex: rgbaToHex(rgba),
      rgb: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`,
      rgba: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`,
      preview: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`,
      picker: toPickerHex(rgba),
    };
  }, [rgba]);

  const outputItems = formats
    ? [
        { label: "HEX", value: formats.hex },
        { label: "RGB", value: formats.rgb },
        { label: "RGBA", value: formats.rgba },
        { label: "HSL", value: formats.hsl },
        { label: "HSLA", value: formats.hsla },
      ]
    : [];

  return (
    <ToolPanel className="tools-panel--color">
      <ToolWorkspace layout="split">
        <ToolColumn>
          <div className="tools-color-compact">
            <div className="tools-color-compact__swatch" aria-hidden>
              <span className="tools-color-compact__checker" />
              <span className="tools-color-compact__fill" style={{ backgroundColor: formats?.preview ?? "transparent" }} />
              <label className="tools-color-compact__picker">
                <input
                  type="color"
                  value={formats?.picker ?? "#8B5CF6"}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
              </label>
            </div>
            <ToolField
              label={t("tools.color.input")}
              value={input}
              onChange={setInput}
              placeholder={t("tools.color.placeholder")}
              dir="ltr"
            />
          </div>
        </ToolColumn>
        <ToolColumn>
          {!formats ? (
            <ToolError message={t("tools.color.errors.invalid")} />
          ) : (
            <ToolOutputList items={outputItems} />
          )}
        </ToolColumn>
      </ToolWorkspace>
    </ToolPanel>
  );
}
