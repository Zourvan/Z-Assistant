import { useState, useCallback, useMemo, useEffect } from "react";
import { RefreshCw, KeyRound } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useI18n } from "../../../../i18n/LanguageProvider";
import {
  ToolWorkspace,
  ToolToolbar,
  ToolColumn,
  ToolTextarea,
  ToolField,
  ToolActionButton,
  ToolError,
  CopyButton,
} from "../../shared";

/* ── Password Generator ── */

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}",
};

type CharsetKey = keyof typeof CHARSETS;

const generatePassword = (length: number, charset: string): string => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => charset[n % charset.length]).join("");
};

const CHARSET_OPTIONS: { key: CharsetKey; labelKey: string }[] = [
  { key: "lower", labelKey: "lowercase" },
  { key: "upper", labelKey: "uppercase" },
  { key: "digits", labelKey: "digits" },
  { key: "symbols", labelKey: "symbols" },
];

export function PasswordPanel() {
  const { t } = useI18n();
  const [length, setLength] = useState(16);
  const [charset, setCharset] = useState<Record<CharsetKey, boolean>>({
    lower: true,
    upper: true,
    digits: true,
    symbols: false,
  });
  const [password, setPassword] = useState("");

  const clampLength = (value: number) => Math.min(64, Math.max(4, value));

  const toggleCharset = (key: CharsetKey) => {
    setCharset((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const regenerate = useCallback(() => {
    let chars = "";
    if (charset.lower) chars += CHARSETS.lower;
    if (charset.upper) chars += CHARSETS.upper;
    if (charset.digits) chars += CHARSETS.digits;
    if (charset.symbols) chars += CHARSETS.symbols;
    if (!chars) {
      setPassword("");
      return;
    }
    setPassword(generatePassword(clampLength(length), chars));
  }, [length, charset]);

  const hasCharset = charset.lower || charset.upper || charset.digits || charset.symbols;

  return (
    <div className="tools-panel--password tools-panel--nested">
      <div className={`tools-password-result ${password ? "tools-password-result--filled" : ""}`}>
        <KeyRound size={16} className="tools-password-result__icon" aria-hidden />
        <code className="tools-password-result__value" dir="ltr">
          {password || t("tools.password.empty")}
        </code>
        {password && <CopyButton text={password} />}
      </div>

      <div className="tools-password-controls">
        <div className="tools-password-length">
          <span className="tools-password-length__label">{t("tools.password.length")}</span>
          <input
            className="tools-password-length__range"
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(clampLength(parseInt(e.target.value, 10)))}
            aria-label={t("tools.password.length")}
          />
          <input
            className="tools-password-length__input"
            type="number"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(clampLength(parseInt(e.target.value, 10) || 4))}
            dir="ltr"
            aria-label={t("tools.password.length")}
          />
        </div>

        <div className="tools-password-charset">
          {CHARSET_OPTIONS.map(({ key, labelKey }) => {
            const active = charset[key];
            return (
              <button
                key={key}
                type="button"
                className={`tools-password-charset__item ${active ? "tools-password-charset__item--active" : ""}`}
                onClick={() => toggleCharset(key)}
                aria-pressed={active}
              >
                {t(`tools.password.${labelKey}`)}
              </button>
            );
          })}
        </div>

        <button type="button" className="tools-password-generate" onClick={regenerate} disabled={!hasCharset}>
          <RefreshCw size={15} />
          {t("tools.password.generate")}
        </button>
      </div>

      {!hasCharset && <p className="tools-password-hint">{t("tools.password.selectCharset")}</p>}
    </div>
  );
}

/* ── Password Strength ── */

function estimateStrength(pw: string): { score: number; label: string; crackTime: string } {
  if (!pw) return { score: 0, label: "none", crackTime: "—" };
  let charset = 0;
  if (/[a-z]/.test(pw)) charset += 26;
  if (/[A-Z]/.test(pw)) charset += 26;
  if (/\d/.test(pw)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) charset += 32;
  const entropy = pw.length * Math.log2(Math.max(charset, 1));
  const seconds = Math.pow(2, entropy) / 1e10; // 10B guesses/sec
  let crackTime: string;
  if (seconds < 1) crackTime = "< 1s";
  else if (seconds < 60) crackTime = `${Math.round(seconds)}s`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)}m`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)}h`;
  else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)}d`;
  else if (seconds < 31536000 * 100) crackTime = `${Math.round(seconds / 31536000)}y`;
  else crackTime = "centuries+";

  if (entropy < 28) return { score: 1, label: "weak", crackTime };
  if (entropy < 50) return { score: 2, label: "medium", crackTime };
  return { score: 3, label: "strong", crackTime };
}

export function PasswordStrengthPanel() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const result = useMemo(() => estimateStrength(password), [password]);

  return (
    <ToolWorkspace layout="stack">
      <ToolField
        label={t("tools.password.result")}
        value={password}
        onChange={setPassword}
        type="password"
        dir="ltr"
      />
      {password && (
        <div className={`tools-strength tools-strength--${result.label}`}>
          <div className="tools-strength__bar">
            <div className="tools-strength__fill" style={{ width: `${(result.score / 3) * 100}%` }} />
          </div>
          <div className="tools-strength__meta">
            <span>{t(`tools.encodingToolkit.strength.${result.label}`)}</span>
            <span dir="ltr">
              {t("tools.encodingToolkit.strength.crackTime")}: {result.crackTime}
            </span>
          </div>
        </div>
      )}
    </ToolWorkspace>
  );
}

/* ── Passphrase ── */

const WORDS = [
  "apple", "river", "cloud", "coffee", "forest", "ocean", "mountain", "silver", "thunder", "willow",
  "coral", "ember", "falcon", "garden", "harbor", "island", "jungle", "kitten", "lemon", "meadow",
  "nebula", "orchid", "pebble", "quartz", "ranger", "sunset", "tiger", "umbra", "violet", "walnut",
  "xenon", "yellow", "zephyr", "anchor", "breeze", "canyon", "delta", "echo", "flint", "glacier",
];

export function PassphrasePanel() {
  const { t } = useI18n();
  const [count, setCount] = useState(4);
  const [phrase, setPhrase] = useState("");

  const generate = () => {
    const arr = new Uint32Array(count);
    crypto.getRandomValues(arr);
    setPhrase(Array.from(arr, (n) => WORDS[n % WORDS.length]).join("-"));
  };

  return (
    <ToolWorkspace layout="stack">
      <ToolToolbar>
        <ToolField
          label={t("tools.encodingToolkit.passphrase.words")}
          value={String(count)}
          onChange={(v) => setCount(Math.min(12, Math.max(3, parseInt(v, 10) || 4)))}
          type="number"
          dir="ltr"
          compact
        />
        <ToolActionButton onClick={generate}>
          <RefreshCw size={14} />
          {t("tools.password.generate")}
        </ToolActionButton>
      </ToolToolbar>
      <ToolField label={t("tools.password.result")} value={phrase} readOnly dir="ltr" />
    </ToolWorkspace>
  );
}

/* ── UUID ── */

export function UuidPanel() {
  const { t } = useI18n();
  const [version, setVersion] = useState<"v4" | "nil">("v4");
  const [uuid, setUuid] = useState(() => uuidv4());
  const [count, setCount] = useState(1);

  const generate = () => {
    if (version === "nil") {
      setUuid("00000000-0000-0000-0000-000000000000");
      return;
    }
    const n = Math.min(10, count);
    setUuid(Array.from({ length: n }, () => uuidv4()).join("\n"));
  };

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${version === "v4" ? "tools-toggle__btn--active" : ""}`} onClick={() => setVersion("v4")}>
            UUID v4
          </button>
          <button type="button" className={`tools-toggle__btn ${version === "nil" ? "tools-toggle__btn--active" : ""}`} onClick={() => setVersion("nil")}>
            NIL
          </button>
        </div>
        {version === "v4" && (
          <ToolField
            label={t("tools.uuid.count")}
            value={String(count)}
            onChange={(v) => setCount(Math.min(10, Math.max(1, parseInt(v, 10) || 1)))}
            type="number"
            dir="ltr"
            compact
          />
        )}
        <ToolActionButton onClick={generate}>
          <RefreshCw size={14} />
          {t("tools.uuid.generate")}
        </ToolActionButton>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.uuid.result")} value={uuid} readOnly dir="ltr" />
      </ToolWorkspace>
    </>
  );
}

/* ── JWT ── */

const decodePart = (part: string): string => {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded);
  return JSON.stringify(JSON.parse(json), null, 2);
};

const encodePart = (obj: unknown): string => {
  const json = JSON.stringify(obj);
  const b64 = btoa(json);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export function JwtPanel() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"decode" | "create">("decode");
  const [token, setToken] = useState("");
  const [header, setHeader] = useState('{\n  "alg": "none",\n  "typ": "JWT"\n}');
  const [payload, setPayload] = useState('{\n  "sub": "user",\n  "iat": 0\n}');

  const decodeResult = useMemo(() => {
    if (mode !== "decode") return { header: "", payload: "", signature: "", error: "" };
    const trimmed = token.trim();
    if (!trimmed) return { header: "", payload: "", signature: "", error: "" };
    const parts = trimmed.split(".");
    if (parts.length < 2) {
      return { header: "", payload: "", signature: "", error: t("tools.jwt.errors.invalid") };
    }
    try {
      return {
        header: decodePart(parts[0]),
        payload: decodePart(parts[1]),
        signature: parts[2] ?? "",
        error: "",
      };
    } catch {
      return { header: "", payload: "", signature: "", error: t("tools.jwt.errors.invalid") };
    }
  }, [token, mode, t]);

  const created = useMemo(() => {
    if (mode !== "create") return { token: "", error: "" };
    try {
      const h = JSON.parse(header);
      const p = JSON.parse(payload);
      return { token: `${encodePart(h)}.${encodePart(p)}.`, error: "" };
    } catch {
      return { token: "", error: t("tools.jwt.errors.invalid") };
    }
  }, [header, payload, mode, t]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          <button type="button" className={`tools-toggle__btn ${mode === "decode" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("decode")}>
            {t("tools.encodingToolkit.jwt.decode")}
          </button>
          <button type="button" className={`tools-toggle__btn ${mode === "create" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("create")}>
            {t("tools.encodingToolkit.jwt.create")}
          </button>
        </div>
      </ToolToolbar>

      {mode === "decode" ? (
        <ToolWorkspace layout="stack">
          <ToolTextarea
            label={t("tools.jwt.input")}
            value={token}
            onChange={setToken}
            placeholder={t("tools.jwt.placeholder")}
            rows={2}
            dir="ltr"
          />
          {decodeResult.error ? (
            <ToolError message={decodeResult.error} />
          ) : (
            <ToolWorkspace layout="split-3">
              <ToolColumn>
                <ToolTextarea label={t("tools.jwt.header")} value={decodeResult.header} readOnly fill dir="ltr" />
              </ToolColumn>
              <ToolColumn>
                <ToolTextarea label={t("tools.jwt.payload")} value={decodeResult.payload} readOnly fill dir="ltr" />
              </ToolColumn>
              <ToolColumn>
                <ToolTextarea label={t("tools.encodingToolkit.jwt.signature")} value={decodeResult.signature} readOnly fill dir="ltr" />
              </ToolColumn>
            </ToolWorkspace>
          )}
        </ToolWorkspace>
      ) : (
        <ToolWorkspace layout="stack">
          <ToolWorkspace layout="split">
            <ToolColumn>
              <ToolTextarea label={t("tools.jwt.header")} value={header} onChange={setHeader} fill dir="ltr" />
            </ToolColumn>
            <ToolColumn>
              <ToolTextarea label={t("tools.jwt.payload")} value={payload} onChange={setPayload} fill dir="ltr" />
            </ToolColumn>
          </ToolWorkspace>
          {created.error ? <ToolError message={created.error} /> : <ToolTextarea label={t("tools.jwt.input")} value={created.token} readOnly rows={2} dir="ltr" />}
        </ToolWorkspace>
      )}
    </>
  );
}

/* ── TOTP (simplified HMAC-SHA1 based) ── */

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const keyBuf = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength);
  const dataBuf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  return new Uint8Array(sig);
}

function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function generateTotp(secret: string, period = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / period);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const hmac = await hmacSha1(key, new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function TotpPanel() {
  const { t } = useI18n();
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);

  const refresh = useCallback(async () => {
    if (!secret.trim()) {
      setCode("");
      return;
    }
    try {
      setCode(await generateTotp(secret.trim()));
      setRemaining(30 - (Math.floor(Date.now() / 1000) % 30));
    } catch {
      setCode("");
    }
  }, [secret]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <ToolWorkspace layout="stack">
      <ToolField label={t("tools.encodingToolkit.totp.secret")} value={secret} onChange={setSecret} dir="ltr" placeholder="JBSWY3DPEHPK3PXP" />
      <ToolField label={t("tools.encodingToolkit.totp.code")} value={code} readOnly dir="ltr" />
      {code && (
        <p className="tools-totp-remaining" dir="ltr">
          {t("tools.encodingToolkit.totp.remaining")}: {remaining}s
        </p>
      )}
    </ToolWorkspace>
  );
}

/* ── Random / Secret ── */

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export function RandomPanel() {
  const { t } = useI18n();
  const [kind, setKind] = useState<"number" | "bytes" | "hex" | "string">("hex");
  const [size, setSize] = useState(16);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState("");

  const generate = () => {
    if (kind === "number") {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      setResult(String(lo + (arr[0] % (hi - lo + 1))));
    } else if (kind === "bytes" || kind === "hex") {
      setResult(randomHex(Math.min(128, Math.max(1, size))));
    } else {
      setResult(randomString(Math.min(256, Math.max(1, size))));
    }
  };

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {(["number", "bytes", "hex", "string"] as const).map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${kind === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setKind(k)}>
              {t(`tools.encodingToolkit.random.${k}`)}
            </button>
          ))}
        </div>
        <ToolActionButton onClick={generate}>
          <RefreshCw size={14} />
          {t("tools.password.generate")}
        </ToolActionButton>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        {kind === "number" ? (
          <div className="tools-inline-fields">
            <ToolField label="Min" value={String(min)} onChange={(v) => setMin(parseInt(v, 10) || 0)} type="number" dir="ltr" compact />
            <ToolField label="Max" value={String(max)} onChange={(v) => setMax(parseInt(v, 10) || 100)} type="number" dir="ltr" compact />
          </div>
        ) : (
          <ToolField
            label={t("tools.encodingToolkit.random.size")}
            value={String(size)}
            onChange={(v) => setSize(parseInt(v, 10) || 16)}
            type="number"
            dir="ltr"
            compact
          />
        )}
        <ToolTextarea label={t("tools.uuid.result")} value={result} readOnly rows={3} dir="ltr" />
      </ToolWorkspace>
    </>
  );
}

export function SecretPanel() {
  const { t } = useI18n();
  const [kind, setKind] = useState<"api" | "jwt" | "cookie" | "webhook">("api");
  const [result, setResult] = useState("");

  const lengths = { api: 32, jwt: 64, cookie: 32, webhook: 40 };

  const generate = () => setResult(randomHex(lengths[kind]));

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {(["api", "jwt", "cookie", "webhook"] as const).map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${kind === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setKind(k)}>
              {t(`tools.encodingToolkit.secret.${k}`)}
            </button>
          ))}
        </div>
        <ToolActionButton onClick={generate}>
          <RefreshCw size={14} />
          {t("tools.password.generate")}
        </ToolActionButton>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolTextarea label={t("tools.uuid.result")} value={result} readOnly rows={2} dir="ltr" />
      </ToolWorkspace>
    </>
  );
}
