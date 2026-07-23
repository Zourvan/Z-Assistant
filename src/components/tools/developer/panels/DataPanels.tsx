import { useState, useMemo } from "react";
import YAML from "yaml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import Papa from "papaparse";
import { parse as parseToml } from "smol-toml";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolError, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";

type JsonMode = "format" | "minify";

export function JsonFormatterPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<JsonMode>("format");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      const output = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      return { output, error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.invalidJson") };
    }
  }, [input, mode, t]);

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
          <div className="tools-toggle">
            <button type="button" className={`tools-toggle__btn ${mode === "format" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("format")}>
              {t("tools.developerToolkit.common.format")}
            </button>
            <button type="button" className={`tools-toggle__btn ${mode === "minify" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("minify")}>
              {t("tools.developerToolkit.common.minify")}
            </button>
          </div>
        </ToolToolbar>
      }
    />
  );
}

type YamlDirection = "yamlToJson" | "jsonToYaml";

export function YamlJsonPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<YamlDirection>("yamlToJson");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (direction === "yamlToJson") {
        const doc = YAML.parse(input);
        return { output: JSON.stringify(doc, null, 2), error: "" };
      }
      const parsed = JSON.parse(input);
      return { output: YAML.stringify(parsed), error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.convertFailed") };
    }
  }, [input, direction, t]);

  return (
    <SplitEditor
      inputLabel={direction === "yamlToJson" ? "YAML" : "JSON"}
      outputLabel={direction === "yamlToJson" ? "JSON" : "YAML"}
      input={input}
      onInputChange={setInput}
      output={result.output}
      error={result.error}
      toolbar={
        <ToolToolbar>
          <div className="tools-toggle">
            <button type="button" className={`tools-toggle__btn ${direction === "yamlToJson" ? "tools-toggle__btn--active" : ""}`} onClick={() => setDirection("yamlToJson")}>
              YAML → JSON
            </button>
            <button type="button" className={`tools-toggle__btn ${direction === "jsonToYaml" ? "tools-toggle__btn--active" : ""}`} onClick={() => setDirection("jsonToYaml")}>
              JSON → YAML
            </button>
          </div>
        </ToolToolbar>
      }
    />
  );
}

type XmlDirection = "xmlToJson" | "jsonToXml" | "format";

export function XmlPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<XmlDirection>("format");

  const parser = useMemo(() => new XMLParser({ ignoreAttributes: false, format: true }), []);
  const builder = useMemo(() => new XMLBuilder({ ignoreAttributes: false, format: true }), []);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (direction === "xmlToJson") {
        const obj = parser.parse(input);
        return { output: JSON.stringify(obj, null, 2), error: "" };
      }
      if (direction === "jsonToXml") {
        const obj = JSON.parse(input);
        return { output: builder.build(obj), error: "" };
      }
      const obj = parser.parse(input);
      return { output: builder.build(obj), error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.convertFailed") };
    }
  }, [input, direction, parser, builder, t]);

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
            {(["format", "xmlToJson", "jsonToXml"] as XmlDirection[]).map((d) => (
              <button key={d} type="button" className={`tools-toggle__btn ${direction === d ? "tools-toggle__btn--active" : ""}`} onClick={() => setDirection(d)}>
                {d === "format" ? t("tools.developerToolkit.common.format") : d === "xmlToJson" ? "XML → JSON" : "JSON → XML"}
              </button>
            ))}
          </div>
        </ToolToolbar>
      }
    />
  );
}

type CsvMode = "table" | "toJson";

export function CsvPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CsvMode>("toJson");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "", rows: [] as string[][] };
    try {
      const parsed = Papa.parse<string[]>(input, { skipEmptyLines: true });
      if (parsed.errors.length) throw new Error("parse");
      if (mode === "table") {
        return { output: parsed.data.map((r) => r.join(" | ")).join("\n"), error: "", rows: parsed.data };
      }
      const [header, ...rows] = parsed.data;
      const json = rows.map((row) => Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""])));
      return { output: JSON.stringify(json, null, 2), error: "", rows: parsed.data };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.convertFailed"), rows: [] as string[][] };
    }
  }, [input, mode, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "toJson" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("toJson")}>
            CSV → JSON
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "table" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("table")}>
            {t("tools.developerToolkit.csv.tableView")}
          </button>
        </div>
      </ToolToolbar>
      {mode === "table" && result.rows.length > 0 ? (
        <div className="tools-dev-table-wrap">
          <table className="tools-dev-table">
            <tbody>
              {result.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <SplitEditor
          inputLabel={t("tools.developerToolkit.common.input")}
          outputLabel={t("tools.developerToolkit.common.output")}
          input={input}
          onInputChange={setInput}
          output={result.output}
          error={result.error}
        />
      )}
    </>
  );
}

type TomlDirection = "tomlToJson" | "tomlToYaml";

export function TomlPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<TomlDirection>("tomlToJson");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const obj = parseToml(input);
      if (direction === "tomlToJson") return { output: JSON.stringify(obj, null, 2), error: "" };
      return { output: YAML.stringify(obj), error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.convertFailed") };
    }
  }, [input, direction, t]);

  return (
    <SplitEditor
      inputLabel="TOML"
      outputLabel={direction === "tomlToJson" ? "JSON" : "YAML"}
      input={input}
      onInputChange={setInput}
      output={result.output}
      error={result.error}
      toolbar={
        <ToolToolbar>
          <div className="tools-toggle">
            <button type="button" className={`tools-toggle__btn ${direction === "tomlToJson" ? "tools-toggle__btn--active" : ""}`} onClick={() => setDirection("tomlToJson")}>
              TOML → JSON
            </button>
            <button type="button" className={`tools-toggle__btn ${direction === "tomlToYaml" ? "tools-toggle__btn--active" : ""}`} onClick={() => setDirection("tomlToYaml")}>
              TOML → YAML
            </button>
          </div>
        </ToolToolbar>
      }
    />
  );
}

export function IniPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input.trim()) return { json: "", error: "" };
    try {
      const result: Record<string, Record<string, string>> = {};
      let section = "default";
      for (const line of input.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) continue;
        const secMatch = trimmed.match(/^\[(.+)\]$/);
        if (secMatch) {
          section = secMatch[1];
          result[section] = result[section] ?? {};
          continue;
        }
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        result[section] = result[section] ?? {};
        result[section][key] = val;
      }
      return { json: JSON.stringify(result, null, 2), error: "" };
    } catch {
      return { json: "", error: t("tools.developerToolkit.errors.convertFailed") };
    }
  }, [input, t]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolTextarea label="INI" value={input} onChange={setInput} fill dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        {output.error ? <ToolError message={output.error} /> : <ToolTextarea label="JSON" value={output.json} readOnly fill dir="ltr" />}
      </ToolColumn>
    </ToolWorkspace>
  );
}
