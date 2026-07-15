import { useState, useMemo, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { v4 as uuidv4, v7 as uuidv7 } from "uuid";
import { nanoid } from "nanoid";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolTextarea, ToolField, ToolActionButton, ToolOutputList } from "../../shared";

export function UuidPanel() {
  const { t } = useI18n();
  const [count, setCount] = useState("5");
  const [version, setVersion] = useState<"v4" | "v7">("v4");
  const [uuids, setUuids] = useState("");

  const generate = useCallback(() => {
    const n = Math.min(50, Math.max(1, Number(count) || 1));
    const list = Array.from({ length: n }, () => (version === "v7" ? uuidv7() : uuidv4()));
    setUuids(list.join("\n"));
  }, [count, version]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.uuid.count")} value={count} onChange={setCount} type="number" dir="ltr" compact />
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${version === "v4" ? "tools-toggle__btn--active" : ""}`} onClick={() => setVersion("v4")}>v4</button>
          <button type="button" className={`tools-toggle__btn ${version === "v7" ? "tools-toggle__btn--active" : ""}`} onClick={() => setVersion("v7")}>v7</button>
        </div>
        <ToolActionButton onClick={generate}><RefreshCw size={14} /> {t("tools.uuid.generate")}</ToolActionButton>
      </ToolToolbar>
      <ToolTextarea label={t("tools.uuid.result")} value={uuids} readOnly fill dir="ltr" />
    </>
  );
}

export function NanoidPanel() {
  const { t } = useI18n();
  const [count, setCount] = useState("5");
  const [size, setSize] = useState("21");
  const [ids, setIds] = useState("");

  const generate = useCallback(() => {
    const n = Math.min(50, Math.max(1, Number(count) || 1));
    const s = Math.min(64, Math.max(4, Number(size) || 21));
    setIds(Array.from({ length: n }, () => nanoid(s)).join("\n"));
  }, [count, size]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.uuid.count")} value={count} onChange={setCount} type="number" dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.nanoid.size")} value={size} onChange={setSize} type="number" dir="ltr" compact />
        <ToolActionButton onClick={generate}><RefreshCw size={14} /> {t("tools.uuid.generate")}</ToolActionButton>
      </ToolToolbar>
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={ids} readOnly fill dir="ltr" />
    </>
  );
}

type RandomKind = "number" | "string" | "hex" | "color";

export function RandomPanel() {
  const { t } = useI18n();
  const [kind, setKind] = useState<RandomKind>("number");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [length, setLength] = useState("16");
  const [result, setResult] = useState("");

  const generate = useCallback(() => {
    switch (kind) {
      case "number": {
        const lo = Number(min), hi = Number(max);
        setResult(String(Math.floor(Math.random() * (hi - lo + 1)) + lo));
        break;
      }
      case "string": {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const len = Number(length) || 16;
        setResult(Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
        break;
      }
      case "hex": {
        const bytes = new Uint8Array(Number(length) || 16);
        crypto.getRandomValues(bytes);
        setResult([...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""));
        break;
      }
      case "color": {
        const c = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
        setResult(c.toUpperCase());
        break;
      }
    }
  }, [kind, min, max, length]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {(["number", "string", "hex", "color"] as RandomKind[]).map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${kind === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setKind(k)}>
              {t(`tools.encodingToolkit.random.${k === "number" ? "number" : k === "string" ? "string" : k === "hex" ? "hex" : "number"}`) || k}
            </button>
          ))}
        </div>
      </ToolToolbar>
      {kind === "number" && (
        <ToolToolbar className="tools-toolbar--fields">
          <ToolField label="Min" value={min} onChange={setMin} dir="ltr" compact />
          <ToolField label="Max" value={max} onChange={setMax} dir="ltr" compact />
        </ToolToolbar>
      )}
      {(kind === "string" || kind === "hex") && (
        <ToolField label={t("tools.encodingToolkit.random.size")} value={length} onChange={setLength} dir="ltr" />
      )}
      <ToolActionButton onClick={generate}><RefreshCw size={14} /> {t("tools.uuid.generate")}</ToolActionButton>
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={result} readOnly dir="ltr" />
    </>
  );
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function ByteConverterPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("1048576");
  const [fromUnit, setFromUnit] = useState<(typeof BYTE_UNITS)[number]>("B");

  const converted = useMemo(() => {
    const val = Number(input);
    if (Number.isNaN(val)) return [];
    const fromIdx = BYTE_UNITS.indexOf(fromUnit);
    const bytes = val * 1024 ** fromIdx;
    return BYTE_UNITS.map((u, i) => ({
      label: u,
      value: i === 0 ? `${bytes} B` : `${(bytes / 1024 ** i).toFixed(4)} ${u}`,
    }));
  }, [input, fromUnit]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.common.input")} value={input} onChange={setInput} dir="ltr" compact />
      </ToolToolbar>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {BYTE_UNITS.map((u) => (
            <button key={u} type="button" className={`tools-toggle__btn ${fromUnit === u ? "tools-toggle__btn--active" : ""}`} onClick={() => setFromUnit(u)}>{u}</button>
          ))}
        </div>
      </ToolToolbar>
      <ToolOutputList items={converted} columns={2} />
    </>
  );
}

type NumBase = "decimal" | "binary" | "hex" | "octal";

export function NumberBasePanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("255");
  const [from, setFrom] = useState<NumBase>("decimal");

  const converted = useMemo(() => {
    const radix: Record<NumBase, number> = { decimal: 10, binary: 2, hex: 16, octal: 8 };
    const n = parseInt(input.trim(), radix[from]);
    if (Number.isNaN(n)) return null;
    return [
      { label: t("tools.base.binary"), value: n.toString(2) },
      { label: t("tools.base.decimal"), value: String(n) },
      { label: t("tools.base.hex"), value: n.toString(16).toUpperCase() },
      { label: t("tools.base.octal"), value: n.toString(8) },
    ];
  }, [input, from, t]);

  return (
    <>
      <ToolField label={t("tools.base.input")} value={input} onChange={setInput} dir="ltr" />
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {(["decimal", "binary", "hex", "octal"] as NumBase[]).map((b) => (
            <button key={b} type="button" className={`tools-toggle__btn ${from === b ? "tools-toggle__btn--active" : ""}`} onClick={() => setFrom(b)}>
              {t(`tools.base.${b === "decimal" ? "decimal" : b}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      {converted && <ToolOutputList items={converted} columns={2} />}
    </>
  );
}
