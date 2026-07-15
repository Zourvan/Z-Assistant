import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolOutputList, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import { HTTP_STATUS_CODES, MIME_TYPES } from "../utils/staticData";

export function UrlParserPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("https://site.com/api?a=1&b=2#section");

  const items = useMemo(() => {
    if (!input.trim()) return [];
    try {
      const url = new URL(input.startsWith("http") ? input : `https://${input}`);
      return [
        { label: "Protocol", value: url.protocol.replace(":", "") },
        { label: "Host", value: url.hostname },
        { label: "Port", value: url.port || (url.protocol === "https:" ? "443" : "80") },
        { label: "Path", value: url.pathname },
        { label: "Query", value: url.search.replace(/^\?/, "") || "—" },
        { label: "Fragment", value: url.hash.replace(/^#/, "") || "—" },
      ];
    } catch {
      return [];
    }
  }, [input]);

  return (
    <>
      <ToolField label="URL" value={input} onChange={setInput} dir="ltr" />
      {items.length > 0 && <ToolOutputList items={items} columns={2} />}
    </>
  );
}

export function QueryParamsPanel() {
  const { t } = useI18n();
  const [params, setParams] = useState("a=1\nb=2\nc=hello world");

  const queryString = useMemo(() => {
    const pairs = params
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const eq = line.indexOf("=");
        if (eq === -1) return [line, ""];
        return [line.slice(0, eq), line.slice(eq + 1)];
      });
    return new URLSearchParams(pairs).toString();
  }, [params]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolTextarea label={t("tools.developerToolkit.queryParams.pairs")} value={params} onChange={setParams} fill dir="ltr" hint="key=value (one per line)" />
      </ToolColumn>
      <ToolColumn>
        <ToolTextarea label={t("tools.developerToolkit.queryParams.result")} value={queryString} readOnly fill dir="ltr" />
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function HttpStatusPanel() {
  const { t } = useI18n();
  const [code, setCode] = useState("404");

  const result = useMemo(() => {
    const n = Number(code);
    if (!Number.isInteger(n)) return "";
    const exact = HTTP_STATUS_CODES[n];
    if (exact) return exact;
    const matches = Object.entries(HTTP_STATUS_CODES)
      .filter(([k]) => k.startsWith(code))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return matches || t("tools.developerToolkit.httpStatus.notFound");
  }, [code, t]);

  return (
    <>
      <ToolField label={t("tools.developerToolkit.httpStatus.code")} value={code} onChange={setCode} dir="ltr" />
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={result} readOnly dir="ltr" />
    </>
  );
}

export function MimeTypePanel() {
  const { t } = useI18n();
  const [ext, setExt] = useState("png");

  const mime = useMemo(() => {
    const key = ext.replace(/^\./, "").toLowerCase();
    return MIME_TYPES[key] ?? t("tools.developerToolkit.mime.unknown");
  }, [ext, t]);

  return (
    <>
      <ToolField label={t("tools.developerToolkit.mime.extension")} value={ext} onChange={setExt} dir="ltr" placeholder="png" />
      <ToolOutputList items={[{ label: "MIME", value: mime }]} />
    </>
  );
}

export function UserAgentPanel() {
  const { t } = useI18n();
  const [ua, setUa] = useState(typeof navigator !== "undefined" ? navigator.userAgent : "");

  const parsed = useMemo(() => {
    if (!ua.trim()) return [];
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE)[/\s]([\d.]+)/i);
    const os = ua.match(/(Windows NT [\d.]+|Mac OS X [\d_]+|Linux|Android [\d.]+|iPhone OS [\d_]+)/i);
    const mobile = /Mobile|Android|iPhone/i.test(ua);
    return [
      { label: "Browser", value: browser ? `${browser[1]} ${browser[2]}` : "—" },
      { label: "OS", value: os ? os[1].replace(/_/g, ".") : "—" },
      { label: "Mobile", value: mobile ? "Yes" : "No" },
    ];
  }, [ua]);

  return (
    <>
      <ToolTextarea label="User-Agent" value={ua} onChange={setUa} fill dir="ltr" />
      <ToolOutputList items={parsed} columns={2} />
    </>
  );
}
