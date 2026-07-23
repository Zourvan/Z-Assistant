import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolError, ToolOutputList, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import { formatGraphql } from "../utils/text";

function decodeJwtPart(part: string): Record<string, unknown> | null {
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function JwtDecoderPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return { header: "", payload: "", error: "" };
    const parts = input.trim().split(".");
    if (parts.length < 2) return { header: "", payload: "", error: t("tools.jwt.errors.invalid") };
    const header = decodeJwtPart(parts[0]);
    const payload = decodeJwtPart(parts[1]);
    if (!header || !payload) return { header: "", payload: "", error: t("tools.jwt.errors.invalid") };
    return {
      header: JSON.stringify(header, null, 2),
      payload: JSON.stringify(payload, null, 2),
      error: "",
    };
  }, [input, t]);

  return (
    <>
      <ToolTextarea label={t("tools.jwt.input")} value={input} onChange={setInput} placeholder={t("tools.jwt.placeholder")} fill dir="ltr" />
      {result.error ? (
        <ToolError message={result.error} />
      ) : (
        <ToolWorkspace layout="split">
          <ToolColumn>
            <ToolTextarea label={t("tools.jwt.header")} value={result.header} readOnly fill dir="ltr" />
          </ToolColumn>
          <ToolColumn>
            <ToolTextarea label={t("tools.jwt.payload")} value={result.payload} readOnly fill dir="ltr" />
          </ToolColumn>
        </ToolWorkspace>
      )}
    </>
  );
}

export function CurlParserPanel() {
  const [input, setInput] = useState('curl -X POST "https://api.example.com/users" -H "Authorization: Bearer token" -d \'{"name":"Nima"}\'');

  const parsed = useMemo(() => {
    if (!input.trim()) return [];
    const method = input.match(/-X\s+(\w+)/i)?.[1] ?? (input.includes("-d ") || input.includes("--data") ? "POST" : "GET");
    const url = input.match(/curl\s+(?:[^"']+\s+)?["']?(https?:\/\/[^\s"']+)["']?/i)?.[1] ?? input.match(/["'](https?:\/\/[^"']+)["']/)?.[1] ?? "";
    const headers = [...input.matchAll(/-H\s+["']([^"']+)["']/gi)].map((m) => m[1]);
    const body = input.match(/(?:-d|--data(?:-raw)?)\s+['"]([^'"]*)['"]/i)?.[1] ?? "";
    return [
      { label: "Method", value: method.toUpperCase() },
      { label: "URL", value: url },
      { label: "Headers", value: headers.join("\n") || "—" },
      { label: "Body", value: body || "—" },
    ];
  }, [input]);

  return (
    <>
      <ToolTextarea label="cURL" value={input} onChange={setInput} fill dir="ltr" />
      <ToolOutputList items={parsed} />
    </>
  );
}

export function CurlGeneratorPanel() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://api.example.com/users");
  const [headers, setHeaders] = useState("Content-Type: application/json");
  const [body, setBody] = useState("");

  const curl = useMemo(() => {
    if (!url.trim()) return "";
    let cmd = `curl -X ${method.toUpperCase()} "${url.trim()}"`;
    for (const h of headers.split("\n").filter(Boolean)) {
      cmd += ` \\\n  -H "${h.trim()}"`;
    }
    if (body.trim() && method.toUpperCase() !== "GET") {
      cmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
    }
    return cmd;
  }, [method, url, headers, body]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="Method" value={method} onChange={setMethod} dir="ltr" compact />
        <ToolField label="URL" value={url} onChange={setUrl} dir="ltr" compact />
      </ToolToolbar>
      <ToolTextarea label="Headers" value={headers} onChange={setHeaders} dir="ltr" hint="One header per line" />
      <ToolTextarea label="Body" value={body} onChange={setBody} dir="ltr" />
      <ToolTextarea label="cURL" value={curl} readOnly fill dir="ltr" />
    </>
  );
}

export function GraphqlPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const output = useMemo(() => (input.trim() ? formatGraphql(input) : ""), [input]);

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

export function OpenApiPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const parsed = JSON.parse(input);
      const info = parsed.info ?? {};
      const paths = Object.keys(parsed.paths ?? {});
      const summary = {
        title: info.title,
        version: info.version,
        description: info.description,
        paths: paths.length,
        pathList: paths.slice(0, 20),
      };
      return { output: JSON.stringify(summary, null, 2), error: "" };
    } catch {
      return { output: "", error: t("tools.developerToolkit.errors.invalidJson") };
    }
  }, [input, t]);

  return (
    <SplitEditor
      inputLabel="OpenAPI JSON"
      outputLabel={t("tools.developerToolkit.openapi.summary")}
      input={input}
      onInputChange={setInput}
      output={result.output}
      error={result.error}
    />
  );
}
