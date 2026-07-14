import { useState, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolField, ToolOutputList, ToolError } from "./shared";

type Base = "binary" | "decimal" | "hex" | "octal";

const parseValue = (value: string, base: Base): bigint | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    switch (base) {
      case "binary":
        if (!/^[01]+$/.test(trimmed)) return null;
        return BigInt(`0b${trimmed}`);
      case "decimal":
        if (!/^\d+$/.test(trimmed)) return null;
        return BigInt(trimmed);
      case "hex":
        if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null;
        return BigInt(`0x${trimmed}`);
      case "octal":
        if (!/^[0-7]+$/.test(trimmed)) return null;
        return BigInt(`0o${trimmed}`);
    }
  } catch {
    return null;
  }
};

export function BaseConverter() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState<Base>("decimal");

  const outputs = useMemo(() => {
    const num = parseValue(input, fromBase);
    if (num === null) {
      return input.trim() ? { error: t("tools.base.errors.invalid") } : { error: "" };
    }
    return {
      binary: num.toString(2),
      decimal: num.toString(10),
      hex: num.toString(16).toUpperCase(),
      octal: num.toString(8),
      error: "",
    };
  }, [input, fromBase, t]);

  const bases: Base[] = ["binary", "decimal", "hex", "octal"];

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
          {bases.map((b) => (
            <button
              key={b}
              type="button"
              className={`tools-toggle__btn ${fromBase === b ? "tools-toggle__btn--active" : ""}`}
              onClick={() => setFromBase(b)}
            >
              {t(`tools.base.${b}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.base.input")} value={input} onChange={setInput} dir="ltr" />
        {"error" in outputs && outputs.error ? (
          <ToolError message={outputs.error} />
        ) : (
          <ToolOutputList
            columns={2}
            items={[
              { label: "BIN", value: "binary" in outputs ? outputs.binary : "" },
              { label: "DEC", value: "decimal" in outputs ? outputs.decimal : "" },
              { label: "HEX", value: "hex" in outputs ? outputs.hex : "" },
              { label: "OCT", value: "octal" in outputs ? outputs.octal : "" },
            ]}
          />
        )}
      </ToolWorkspace>
    </ToolPanel>
  );
}
