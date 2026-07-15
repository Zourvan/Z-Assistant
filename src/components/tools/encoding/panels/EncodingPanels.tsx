import { useState, useMemo, useRef } from "react";
import { Upload } from "lucide-react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolError } from "../../shared";

type Mode = "encode" | "decode";

/* ── Base64 ── */

const encodeBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const decodeBase64 = (text: string): string => {
  const binary = atob(text.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function Base64Panel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    if (!input) return { output: "", error: "" };
    try {
      const output = mode === "encode" ? encodeBase64(input) : decodeBase64(input);
      return { output, error: "" };
    } catch {
      return { output: "", error: t("tools.base64.errors.invalid") };
    }
  }, [input, mode, t]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setInput(base64);
      setMode("decode");
      if (file.type.startsWith("image/")) {
        setImagePreview(dataUrl);
      } else {
        setImagePreview("");
      }
    };
    reader.readAsDataURL(file);
  };

  const isImageBase64 = mode === "decode" && input && /^[A-Za-z0-9+/=]+$/.test(input.replace(/\s/g, ""));

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.base64.encode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.base64.decode")}
          </button>
        </div>
        <button type="button" className="tools-action-btn tools-action-btn--secondary" onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
          {t("tools.encodingToolkit.base64.fileUpload")}
        </button>
        <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          {result.error ? (
            <ToolError message={result.error} />
          ) : (
            <>
              <ToolTextarea label={t("tools.base64.output")} value={result.output} readOnly fill dir="ltr" />
              {(imagePreview || (isImageBase64 && input)) && (
                <div className="tools-base64-preview">
                  <span className="tools-field__label">{t("tools.encodingToolkit.base64.imagePreview")}</span>
                  <img
                    src={imagePreview || `data:image/png;base64,${input.replace(/\s/g, "")}`}
                    alt=""
                    className="tools-base64-preview__img"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </>
          )}
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── URL ── */

export function UrlPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    try {
      return mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
    } catch {
      return "";
    }
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.url.encode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.url.decode")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.url.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.url.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── HTML ── */

const htmlEncode = (text: string): string => {
  const el = document.createElement("textarea");
  el.textContent = text;
  return el.innerHTML;
};

const htmlDecode = (text: string): string => {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
};

export function HtmlPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encode" ? htmlEncode(input) : htmlDecode(input);
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.encodingToolkit.html.encode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.encodingToolkit.html.decode")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── Unicode ── */

const unicodeEncode = (text: string): string =>
  [...text].map((c) => {
    const code = c.codePointAt(0)!;
    return code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : c;
  }).join("");

const unicodeDecode = (text: string): string =>
  text.replace(/\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{8})/g, (_, u4, u8) =>
    String.fromCodePoint(parseInt(u8 ?? u4, 16))
  );

export function UnicodePanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    try {
      return mode === "encode" ? unicodeEncode(input) : unicodeDecode(input);
    } catch {
      return "";
    }
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.encodingToolkit.unicode.encode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.encodingToolkit.unicode.decode")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── ASCII ── */

export function AsciiPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"textToCodes" | "codesToText">("textToCodes");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "textToCodes") {
      return [...input].map((c) => c.codePointAt(0)).join(" ");
    }
    return input
      .trim()
      .split(/[\s,]+/)
      .map((n) => String.fromCodePoint(parseInt(n, 10)))
      .join("");
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "textToCodes" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("textToCodes")}>
            {t("tools.encodingToolkit.ascii.textToCodes")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "codesToText" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("codesToText")}>
            {t("tools.encodingToolkit.ascii.codesToText")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── Hex Text ── */

export function HexTextPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") {
      return [...new TextEncoder().encode(input)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
    }
    try {
      const bytes = input.trim().split(/[\s,]+/).map((h) => parseInt(h, 16));
      if (bytes.some((b) => isNaN(b))) return "";
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return "";
    }
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.encodingToolkit.hex.textToHex")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.encodingToolkit.hex.hexToText")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── Morse ── */

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
  K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export function MorsePanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") {
      return input
        .toUpperCase()
        .split("")
        .map((c) => (c === " " ? "/" : MORSE[c] ?? c))
        .join(" ");
    }
    return input
      .trim()
      .split(/\s+/)
      .map((code) => (code === "/" ? " " : MORSE_REV[code] ?? "?"))
      .join("");
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.base64.encode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.base64.decode")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* ── NATO ── */

const NATO: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel",
  I: "India", J: "Juliet", K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa",
  Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray",
  Y: "Yankee", Z: "Zulu", "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five",
  "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
};
const NATO_REV = Object.fromEntries(Object.entries(NATO).map(([k, v]) => [v.toLowerCase(), k]));

export function NatoPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    if (mode === "encode") {
      return input
        .toUpperCase()
        .split("")
        .map((c) => NATO[c] ?? c)
        .join(" ");
    }
    return input
      .split(/\s+/)
      .map((word) => NATO_REV[word.toLowerCase()] ?? word)
      .join("");
  }, [input, mode]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "encode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("encode")}>
            {t("tools.encodingToolkit.nato.textToNato")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.encodingToolkit.nato.natoToText")}
          </button>
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.base64.output")} value={output} readOnly fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}
