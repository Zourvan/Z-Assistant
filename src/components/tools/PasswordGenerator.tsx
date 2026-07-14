import { useState, useCallback } from "react";
import { RefreshCw, KeyRound } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, CopyButton } from "./shared";

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

export function PasswordGenerator() {
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
    <ToolPanel className="tools-panel--password">
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
    </ToolPanel>
  );
}
