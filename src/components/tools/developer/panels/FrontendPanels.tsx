import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolOutputList, ToolError, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import { optimizeSvg } from "../utils/text";

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const parseHex = (value: string): Rgba | null => {
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
  }
  return null;
};

export function ColorPickerPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("#8B5CF6");
  const rgba = useMemo(() => parseHex(input), [input]);
  const formats = useMemo(() => {
    if (!rgba) return null;
    const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
    return {
      hex: rgbToHex(rgba.r, rgba.g, rgba.b),
      rgb: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsv: `hsv(${hsl.h}, ${hsl.s}%, ${Math.round((Math.max(rgba.r, rgba.g, rgba.b) / 255) * 100)}%)`,
      preview: `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`,
      picker: rgbToHex(rgba.r, rgba.g, rgba.b),
    };
  }, [rgba]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <div className="tools-color-compact">
          <div className="tools-color-compact__swatch" aria-hidden>
            <span className="tools-color-compact__checker" />
            <span className="tools-color-compact__fill" style={{ backgroundColor: formats?.preview ?? "transparent" }} />
            <label className="tools-color-compact__picker">
              <input type="color" value={formats?.picker ?? "#8B5CF6"} onChange={(e) => setInput(e.target.value.toUpperCase())} />
            </label>
          </div>
          <ToolField label={t("tools.color.input")} value={input} onChange={setInput} dir="ltr" />
        </div>
      </ToolColumn>
      <ToolColumn>
        {!formats ? (
          <ToolError message={t("tools.color.errors.invalid")} />
        ) : (
          <ToolOutputList items={[{ label: "HEX", value: formats.hex }, { label: "RGB", value: formats.rgb }, { label: "HSL", value: formats.hsl }, { label: "HSV", value: formats.hsv }]} />
        )}
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function CssGradientPanel() {
  const { t } = useI18n();
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState("90");
  const [color1, setColor1] = useState("#667eea");
  const [color2, setColor2] = useState("#764ba2");

  const css = useMemo(() => {
    if (type === "linear") return `background: linear-gradient(${angle}deg, ${color1}, ${color2});`;
    return `background: radial-gradient(circle, ${color1}, ${color2});`;
  }, [type, angle, color1, color2]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${type === "linear" ? "tools-toggle__btn--active" : ""}`} onClick={() => setType("linear")}>Linear</button>
          <button type="button" className={`tools-toggle__btn ${type === "radial" ? "tools-toggle__btn--active" : ""}`} onClick={() => setType("radial")}>Radial</button>
        </div>
      </ToolToolbar>
      <ToolToolbar className="tools-toolbar--fields">
        {type === "linear" && <ToolField label={t("tools.developerToolkit.css.angle")} value={angle} onChange={setAngle} dir="ltr" compact />}
        <ToolField label={t("tools.developerToolkit.css.color1")} value={color1} onChange={setColor1} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.css.color2")} value={color2} onChange={setColor2} dir="ltr" compact />
      </ToolToolbar>
      <div className="tools-dev-preview" style={{ background: type === "linear" ? `linear-gradient(${angle}deg, ${color1}, ${color2})` : `radial-gradient(circle, ${color1}, ${color2})` }} />
      <ToolTextarea label="CSS" value={css} readOnly dir="ltr" />
    </>
  );
}

export function BoxShadowPanel() {
  const { t } = useI18n();
  const [x, setX] = useState("0");
  const [y, setY] = useState("4");
  const [blur, setBlur] = useState("12");
  const [spread, setSpread] = useState("0");
  const [color, setColor] = useState("rgba(0,0,0,0.15)");

  const css = useMemo(() => `box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${color};`, [x, y, blur, spread, color]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="X" value={x} onChange={setX} dir="ltr" compact />
        <ToolField label="Y" value={y} onChange={setY} dir="ltr" compact />
        <ToolField label="Blur" value={blur} onChange={setBlur} dir="ltr" compact />
        <ToolField label="Spread" value={spread} onChange={setSpread} dir="ltr" compact />
        <ToolField label="Color" value={color} onChange={setColor} dir="ltr" compact />
      </ToolToolbar>
      <div className="tools-dev-preview tools-dev-preview--shadow" style={{ boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${color}` }} />
      <ToolTextarea label="CSS" value={css} readOnly dir="ltr" />
    </>
  );
}

export function BorderRadiusPanel() {
  const { t } = useI18n();
  const [tl, setTl] = useState("8");
  const [tr, setTr] = useState("8");
  const [br, setBr] = useState("8");
  const [bl, setBl] = useState("8");

  const css = useMemo(() => `border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`, [tl, tr, br, bl]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="TL" value={tl} onChange={setTl} dir="ltr" compact />
        <ToolField label="TR" value={tr} onChange={setTr} dir="ltr" compact />
        <ToolField label="BR" value={br} onChange={setBr} dir="ltr" compact />
        <ToolField label="BL" value={bl} onChange={setBl} dir="ltr" compact />
      </ToolToolbar>
      <div className="tools-dev-preview" style={{ borderRadius: `${tl}px ${tr}px ${br}px ${bl}px` }} />
      <ToolTextarea label="CSS" value={css} readOnly dir="ltr" />
    </>
  );
}

export function CssUnitPanel() {
  const { t } = useI18n();
  const [value, setValue] = useState("16");
  const [from, setFrom] = useState<"px" | "rem" | "em">("px");
  const [base, setBase] = useState("16");

  const converted = useMemo(() => {
    const v = Number(value);
    const b = Number(base) || 16;
    if (Number.isNaN(v)) return [];
    const px = from === "px" ? v : v * b;
    return [
      { label: "px", value: `${px.toFixed(2)}px` },
      { label: "rem", value: `${(px / b).toFixed(4)}rem` },
      { label: "em", value: `${(px / b).toFixed(4)}em` },
      { label: "vw", value: `${((px / 1920) * 100).toFixed(4)}vw` },
      { label: "vh", value: `${((px / 1080) * 100).toFixed(4)}vh` },
    ];
  }, [value, from, base]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.common.input")} value={value} onChange={setValue} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.css.base")} value={base} onChange={setBase} dir="ltr" compact />
      </ToolToolbar>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["px", "rem", "em"] as const).map((u) => (
            <button key={u} type="button" className={`tools-toggle__btn ${from === u ? "tools-toggle__btn--active" : ""}`} onClick={() => setFrom(u)}>{u}</button>
          ))}
        </div>
      </ToolToolbar>
      <ToolOutputList items={converted} columns={2} />
    </>
  );
}

export function FlexboxPanel() {
  const { t } = useI18n();
  const [direction, setDirection] = useState("row");
  const [justify, setJustify] = useState("center");
  const [align, setAlign] = useState("center");
  const [gap, setGap] = useState("8");

  const css = `display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\ngap: ${gap}px;`;

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="direction" value={direction} onChange={setDirection} dir="ltr" compact />
        <ToolField label="justify" value={justify} onChange={setJustify} dir="ltr" compact />
        <ToolField label="align" value={align} onChange={setAlign} dir="ltr" compact />
        <ToolField label="gap" value={gap} onChange={setGap} dir="ltr" compact />
      </ToolToolbar>
      <div className="tools-dev-flex-preview" style={{ display: "flex", flexDirection: direction as "row" | "column", justifyContent: justify, alignItems: align, gap: `${gap}px` }}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="tools-dev-flex-preview__item">{n}</div>
        ))}
      </div>
      <ToolTextarea label="CSS" value={css} readOnly dir="ltr" />
    </>
  );
}

export function CssGridPanel() {
  const { t } = useI18n();
  const [cols, setCols] = useState("3");
  const [rows, setRows] = useState("2");
  const [gap, setGap] = useState("8");

  const css = `display: grid;\ngrid-template-columns: repeat(${cols}, 1fr);\ngrid-template-rows: repeat(${rows}, 1fr);\ngap: ${gap}px;`;
  const count = (Number(cols) || 1) * (Number(rows) || 1);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.css.columns")} value={cols} onChange={setCols} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.css.rows")} value={rows} onChange={setRows} dir="ltr" compact />
        <ToolField label="gap" value={gap} onChange={setGap} dir="ltr" compact />
      </ToolToolbar>
      <div className="tools-dev-grid-preview" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: `${gap}px` }}>
        {Array.from({ length: Math.min(count, 12) }, (_, i) => (
          <div key={i} className="tools-dev-grid-preview__item">{i + 1}</div>
        ))}
      </div>
      <ToolTextarea label="CSS" value={css} readOnly dir="ltr" />
    </>
  );
}

export function SvgOptimizerPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const output = useMemo(() => (input.trim() ? optimizeSvg(input) : ""), [input]);

  return (
    <SplitEditor
      inputLabel="SVG"
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
    />
  );
}
