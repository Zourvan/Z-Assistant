import { useState, useMemo, useEffect, useRef } from "react";
import { marked } from "marked";
import mermaid from "mermaid";
import Ajv from "ajv";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolColumn, ToolTextarea, ToolField, ToolError, ToolWorkspace } from "../../shared";
import { estimateTokens } from "../utils/text";

export function TokenCounterPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const tokens = useMemo(() => estimateTokens(input), [input]);
  const chars = input.length;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <>
      <ToolTextarea label={t("tools.developerToolkit.common.input")} value={input} onChange={setInput} fill dir="ltr" />
      <div className="tools-output-list tools-output-list--2col">
        <div className="tools-output-row"><span className="tools-output-row__badge">{t("tools.developerToolkit.tokens.estimated")}</span><code className="tools-output-row__value">{tokens}</code></div>
        <div className="tools-output-row"><span className="tools-output-row__badge">{t("tools.developerToolkit.textStats.words")}</span><code className="tools-output-row__value">{words}</code></div>
        <div className="tools-output-row"><span className="tools-output-row__badge">{t("tools.developerToolkit.textStats.characters")}</span><code className="tools-output-row__value">{chars}</code></div>
      </div>
    </>
  );
}

export function MarkdownPreviewPanel() {
  const [input, setInput] = useState("# Hello\n\n**Bold** and *italic* text.");

  const html = useMemo(() => {
    try {
      return marked.parse(input) as string;
    } catch {
      return "";
    }
  }, [input]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolTextarea label="Markdown" value={input} onChange={setInput} fill dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        <div className="tools-dev-md-preview" dangerouslySetInnerHTML={{ __html: html }} />
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function MarkdownTablePanel() {
  const { t } = useI18n();
  const [headers, setHeaders] = useState("Name,Age,City");
  const [rows, setRows] = useState("Ali,20,Tehran\nSara,25,Shiraz");

  const table = useMemo(() => {
    const hdrs = headers.split(",").map((h) => h.trim());
    const dataRows = rows.split("\n").filter(Boolean).map((r) => r.split(",").map((c) => c.trim()));
    const sep = `| ${hdrs.map(() => "---").join(" | ")} |`;
    const headerRow = `| ${hdrs.join(" | ")} |`;
    const body = dataRows.map((r) => `| ${r.join(" | ")} |`).join("\n");
    return `${headerRow}\n${sep}\n${body}`;
  }, [headers, rows]);

  return (
    <>
      <ToolField label={t("tools.developerToolkit.mdTable.headers")} value={headers} onChange={setHeaders} dir="ltr" />
      <ToolTextarea label={t("tools.developerToolkit.mdTable.rows")} value={rows} onChange={setRows} fill dir="ltr" hint="CSV rows" />
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={table} readOnly fill dir="ltr" />
    </>
  );
}

export function MermaidPreviewPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
  }, []);

  useEffect(() => {
    if (!containerRef.current || !input.trim()) return;
    const id = `mermaid-${Date.now()}`;
    mermaid
      .render(id, input)
      .then(({ svg }) => {
        if (containerRef.current) containerRef.current.innerHTML = svg;
        setError("");
      })
      .catch(() => setError(t("tools.developerToolkit.errors.renderFailed")));
  }, [input, t]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolTextarea label="Mermaid" value={input} onChange={setInput} fill dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        {error && <ToolError message={error} />}
        <div className="tools-dev-mermaid" ref={containerRef} />
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function JsonSchemaPanel() {
  const { t } = useI18n();
  const [schema, setSchema] = useState('{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  },\n  "required": ["name"]\n}');
  const [data, setData] = useState('{\n  "name": "Nima",\n  "age": 28\n}');

  const result = useMemo(() => {
    try {
      const ajv = new Ajv();
      const validate = ajv.compile(JSON.parse(schema));
      const parsed = JSON.parse(data);
      const valid = validate(parsed);
      if (valid) return { output: t("tools.developerToolkit.schema.valid"), error: "" };
      return { output: ajv.errorsText(validate.errors), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : t("tools.developerToolkit.errors.invalidJson") };
    }
  }, [schema, data, t]);

  return (
    <>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label="JSON Schema" value={schema} onChange={setSchema} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label="JSON Data" value={data} onChange={setData} fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
      {result.error ? <ToolError message={result.error} /> : <ToolTextarea label={t("tools.developerToolkit.common.output")} value={result.output} readOnly dir="ltr" />}
    </>
  );
}
