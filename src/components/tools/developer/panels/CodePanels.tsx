import { useState, useMemo } from "react";
import YAML from "yaml";
import { format as formatSql } from "sql-formatter";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolError, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import { formatGraphql, minifyCode } from "../utils/text";
import { REGEX_PATTERNS } from "../utils/staticData";

type CodeLang = "javascript" | "typescript" | "html" | "css" | "sql" | "json" | "yaml" | "markdown";

export function CodeFormatterPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [lang, setLang] = useState<CodeLang>("javascript");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (lang === "json") {
        return { output: JSON.stringify(JSON.parse(input), null, 2), error: "" };
      }
      if (lang === "sql") {
        return { output: formatSql(input), error: "" };
      }
      if (lang === "yaml") {
        return { output: YAML.stringify(YAML.parse(input)), error: "" };
      }
      // Basic indent for JS/TS/HTML/CSS/MD
      const lines = input.split("\n");
      let indent = 0;
      const formatted = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          if (/^[}\])]/.test(trimmed)) indent = Math.max(0, indent - 1);
          const out = "  ".repeat(indent) + trimmed;
          if (/[{[(]$/.test(trimmed) || (trimmed.endsWith("{") && !trimmed.startsWith("}"))) indent++;
          return out;
        })
        .join("\n");
      return { output: formatted, error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.formatFailed") };
    }
  }, [input, lang, t]);

  const langs: CodeLang[] = ["javascript", "typescript", "html", "css", "sql", "json", "yaml", "markdown"];

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={result.output}
      error={result.error}
      toolbar={
        <ToolToolbar>
          <div className="tools-toggle tools-toggle--wrap">
            {langs.map((l) => (
              <button key={l} type="button" className={`tools-toggle__btn ${lang === l ? "tools-toggle__btn--active" : ""}`} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </ToolToolbar>
      }
    />
  );
}

export function CodeMinifierPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const output = useMemo(() => (input ? minifyCode(input) : ""), [input]);

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
    />
  );
}

type EscapeKind = "json" | "html" | "xml" | "javascript" | "sql" | "shell" | "regex";
type EscapeMode = "escape" | "unescape";

const escapeFns: Record<EscapeKind, (s: string) => string> = {
  json: (s) => JSON.stringify(s).slice(1, -1),
  html: (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  xml: (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"),
  javascript: (s) => JSON.stringify(s).slice(1, -1),
  sql: (s) => s.replace(/'/g, "''"),
  shell: (s) => `'${s.replace(/'/g, `'\\''`)}'`,
  regex: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
};

const unescapeFns: Record<EscapeKind, (s: string) => string> = {
  json: (s) => { try { return JSON.parse(`"${s.replace(/"/g, '\\"')}"`); } catch { return s; } },
  html: (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
  xml: (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"),
  javascript: (s) => { try { return JSON.parse(`"${s.replace(/"/g, '\\"')}"`); } catch { return s; } },
  sql: (s) => s.replace(/''/g, "'"),
  shell: (s) => (s.startsWith("'") && s.endsWith("'") ? s.slice(1, -1).replace(/'\\''/g, "'") : s),
  regex: (s) => s.replace(/\\(.)/g, "$1"),
};

export function EscapePanel() {
  const { t } = useI18n();
  const [kind, setKind] = useState<EscapeKind>("json");
  const [mode, setMode] = useState<EscapeMode>("escape");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "escape" ? escapeFns[kind](input) : unescapeFns[kind](input);
  }, [input, mode, kind]);

  const kinds: EscapeKind[] = ["json", "html", "xml", "javascript", "sql", "shell", "regex"];

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
      toolbar={
        <>
          <ToolToolbar>
            <div className="tools-toggle tools-toggle--wrap">
              {kinds.map((k) => (
                <button key={k} type="button" className={`tools-toggle__btn ${kind === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setKind(k)}>
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </ToolToolbar>
          <ToolToolbar>
            <div className="tools-toggle">
              <button type="button" className={`tools-toggle__btn ${mode === "escape" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("escape")}>
                {t("tools.escape.escape")}
              </button>
              <button type="button" className={`tools-toggle__btn ${mode === "unescape" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("unescape")}>
                {t("tools.escape.unescape")}
              </button>
            </div>
          </ToolToolbar>
        </>
      }
    />
  );
}

export function RegexTesterPanel() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const result = useMemo(() => {
    if (!pattern) return { matches: "", error: "" };
    try {
      const regex = new RegExp(pattern, flags);
      const found = [...text.matchAll(regex)].map((m, i) => `[${i + 1}] ${m[0]}${m.index !== undefined ? ` @${m.index}` : ""}`);
      return { matches: found.length ? found.join("\n") : t("tools.regex.noMatch"), error: "" };
    } catch {
      return { matches: "", error: t("tools.regex.errors.invalid") };
    }
  }, [pattern, flags, text, t]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.regex.pattern")} value={pattern} onChange={setPattern} placeholder="/pattern/" dir="ltr" compact />
        <ToolField label={t("tools.regex.flags")} value={flags} onChange={setFlags} placeholder="gim" dir="ltr" compact />
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.regex.text")} value={text} onChange={setText} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {result.error ? <ToolError message={result.error} /> : <ToolTextarea label={t("tools.regex.matches")} value={result.matches} readOnly fill dir="ltr" />}
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

export function RegexGeneratorPanel() {
  const { t } = useI18n();
  const [selected, setSelected] = useState("email");
  const [testText, setTestText] = useState("");

  const pattern = REGEX_PATTERNS.find((p) => p.id === selected) ?? REGEX_PATTERNS[0];

  const matches = useMemo(() => {
    if (!testText || !pattern) return "";
    try {
      const regex = new RegExp(pattern.pattern, pattern.flags);
      return [...testText.matchAll(regex)].map((m) => m[0]).join("\n") || t("tools.regex.noMatch");
    } catch {
      return "";
    }
  }, [testText, pattern, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {REGEX_PATTERNS.map((p) => (
            <button key={p.id} type="button" className={`tools-toggle__btn ${selected === p.id ? "tools-toggle__btn--active" : ""}`} onClick={() => setSelected(p.id)}>
              {t(`tools.developerToolkit.regexGen.${p.id}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolTextarea label={t("tools.developerToolkit.regexGen.pattern")} value={`/${pattern.pattern}/${pattern.flags}`} readOnly dir="ltr" />
      <ToolTextarea label={t("tools.regex.text")} value={testText} onChange={setTestText} fill dir="ltr" />
      <ToolTextarea label={t("tools.regex.matches")} value={matches} readOnly dir="ltr" />
    </>
  );
}
