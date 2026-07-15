import { useState, useMemo, useEffect, useRef } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolField } from "../../shared";

/* ── Escape ── */

type EscapeKind = "json" | "regex" | "xml" | "sql" | "csv" | "shell";
type Mode = "escape" | "unescape";

const escapeFns: Record<EscapeKind, (s: string) => string> = {
  json: (s) =>
    s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"),
  regex: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  xml: (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"),
  sql: (s) => s.replace(/'/g, "''"),
  csv: (s) => {
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  },
  shell: (s) => `'${s.replace(/'/g, `'\\''`)}'`,
};

const unescapeFns: Record<EscapeKind, (s: string) => string> = {
  json: (s) => {
    try {
      return JSON.parse(`"${s.replace(/"/g, '\\"')}"`);
    } catch {
      return s
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
  },
  regex: (s) => s.replace(/\\(.)/g, "$1"),
  xml: (s) =>
    s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&"),
  sql: (s) => s.replace(/''/g, "'"),
  csv: (s) => {
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/""/g, '"');
    return s;
  },
  shell: (s) => {
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/'\\''/g, "'");
    return s;
  },
};

export function EscapePanel() {
  const { t } = useI18n();
  const [kind, setKind] = useState<EscapeKind>("json");
  const [mode, setMode] = useState<Mode>("escape");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "escape" ? escapeFns[kind](input) : unescapeFns[kind](input);
  }, [input, mode, kind]);

  const kinds: EscapeKind[] = ["json", "regex", "xml", "sql", "csv", "shell"];

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {kinds.map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${kind === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setKind(k)}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "escape" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("escape")}>
            {t("tools.escape.escape")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "unescape" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("unescape")}>
            {t("tools.escape.unescape")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.escape.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.escape.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── Slug ── */

export function SlugPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [input]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
      </ToolColumn>
    </ToolWorkspace>
  );
}

/* ── Case Converter ── */

type CaseStyle = "camel" | "pascal" | "snake" | "kebab" | "constant" | "title";

const toWords = (text: string): string[] =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

const applyCase = (words: string[], style: CaseStyle): string => {
  switch (style) {
    case "camel":
      return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join("");
    case "pascal":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    case "snake":
      return words.join("_");
    case "kebab":
      return words.join("-");
    case "constant":
      return words.map((w) => w.toUpperCase()).join("_");
    case "title":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
};

export function CasePanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const words = useMemo(() => toWords(input), [input]);
  const styles: CaseStyle[] = ["camel", "pascal", "snake", "kebab", "constant", "title"];

  return (
    <ToolWorkspace layout="stack">
      <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} rows={2} dir="ltr" />
      {styles.map((style) => (
        <ToolField
          key={style}
          label={t(`tools.encodingToolkit.case.${style}`)}
          value={input ? applyCase(words, style) : ""}
          readOnly
          dir="ltr"
        />
      ))}
    </ToolWorkspace>
  );
}

/* ── QR Code ── */

export function QrPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"text" | "url" | "wifi" | "email">("text");
  const [text, setText] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  const payload = useMemo(() => {
    switch (mode) {
      case "url":
        return text;
      case "wifi":
        return `WIFI:T:WPA;S:${ssid};P:${password};;`;
      case "email":
        return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
      default:
        return text;
    }
  }, [mode, text, ssid, password, email, subject]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!payload) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setError("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(canvas, payload, { width: 180, margin: 1 });
        if (!cancelled) setError("");
      } catch {
        if (!cancelled) setError(t("tools.encodingToolkit.qr.error"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {(["text", "url", "wifi", "email"] as const).map((m) => (
            <button key={m} type="button" className={`tools-toggle__btn ${mode === m ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode(m)}>
              {t(`tools.encodingToolkit.qr.${m}`)}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          {mode === "wifi" ? (
            <>
              <ToolField label="SSID" value={ssid} onChange={setSsid} dir="ltr" />
              <ToolField label={t("tools.password.result")} value={password} onChange={setPassword} dir="ltr" />
            </>
          ) : mode === "email" ? (
            <>
              <ToolField label="Email" value={email} onChange={setEmail} dir="ltr" />
              <ToolField label="Subject" value={subject} onChange={setSubject} dir="ltr" />
            </>
          ) : (
            <ToolTextarea label={t("tools.base64.input")} value={text} onChange={setText} fill dir="ltr" />
          )}
          {payload && <ToolTextarea label={t("tools.encodingToolkit.qr.payload")} value={payload} readOnly rows={2} dir="ltr" />}
        </ToolColumn>
        <ToolColumn>
          <div className="tools-qr-preview">
            <canvas ref={canvasRef} className="tools-qr-preview__canvas" />
            {error && <p className="tools-field__hint">{error}</p>}
          </div>
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── AES Encryption (Web Crypto) ── */

type AesBits = 128 | 192 | 256;
type AesMode = "encrypt" | "decrypt";

const bytesToB64 = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const b64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

async function deriveAesKey(passphrase: string, bits: AesBits): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passphrase));
  const keyBytes = new Uint8Array(raw).slice(0, bits / 8);
  return crypto.subtle.importKey("raw", keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function AesPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AesMode>("encrypt");
  const [bits, setBits] = useState<AesBits>(256);
  const [passphrase, setPassphrase] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!input || !passphrase) {
      setOutput("");
      setError("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const key = await deriveAesKey(passphrase, bits);
        if (mode === "encrypt") {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(input));
          const packed = new Uint8Array(iv.length + cipher.byteLength);
          packed.set(iv, 0);
          packed.set(new Uint8Array(cipher), iv.length);
          if (!cancelled) {
            setOutput(bytesToB64(packed));
            setError("");
          }
        } else {
          const packed = b64ToBytes(input.replace(/\s/g, ""));
          const iv = packed.slice(0, 12);
          const data = packed.slice(12);
          const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
          if (!cancelled) {
            setOutput(new TextDecoder().decode(plain));
            setError("");
          }
        }
      } catch {
        if (!cancelled) {
          setOutput("");
          setError(t("tools.encodingToolkit.aes.error"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, passphrase, bits, mode, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encrypt" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encrypt")}>
            {t("tools.encodingToolkit.aes.encrypt")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decrypt" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decrypt")}>
            {t("tools.encodingToolkit.aes.decrypt")}
          </button>
        </div>
        <div className="tools-toggle">
          {([128, 192, 256] as AesBits[]).map((b) => (
            <button key={b} type="button" className={`tools-toggle__btn ${bits === b ? "tools-toggle__btn--active" : ""}`} onClick={() => setBits(b)}>
              AES-{b}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.encodingToolkit.aes.passphrase")} value={passphrase} onChange={setPassphrase} type="password" dir="ltr" />
        <ToolWorkspace layout="split">
          <ToolColumn>
            <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
          </ToolColumn>
          <ToolColumn>
            {error ? <p className="tools-error">{error}</p> : <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />}
          </ToolColumn>
        </ToolWorkspace>
      </ToolWorkspace>
    </>
  );
}
