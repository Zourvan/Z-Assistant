import { useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { useI18n } from "../../i18n/LanguageProvider";

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export function CopyButton({ text, className = "", label }: { text: string; className?: string; label?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      className={`tools-copy-btn ${className}`}
      onClick={handleCopy}
      title={label ?? t("tools.copy")}
      aria-label={label ?? t("tools.copy")}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function ToolPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`tools-panel ${className}`.trim()}>{children}</div>;
}

export function ToolWorkspace({
  children,
  layout = "stack",
  className = "",
}: {
  children: ReactNode;
  layout?: "stack" | "split" | "split-3";
  className?: string;
}) {
  return <div className={`tools-workspace tools-workspace--${layout} ${className}`.trim()}>{children}</div>;
}

export function ToolToolbar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`tools-toolbar ${className}`.trim()}>{children}</div>;
}

export function ToolColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`tools-workspace__col ${className}`.trim()}>{children}</div>;
}

export function ToolSection({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`tools-section ${className}`.trim()}>
      {title && <h4 className="tools-section__title">{title}</h4>}
      {children}
    </section>
  );
}

export function ToolField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  dir,
  hint,
  compact,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  dir?: "ltr" | "rtl";
  hint?: string;
  compact?: boolean;
}) {
  return (
    <label className={`tools-field ${readOnly ? "tools-field--readonly" : ""} ${compact ? "tools-field--compact" : ""}`}>
      <span className="tools-field__label">{label}</span>
      <div className="tools-field__row">
        <input
          className="tools-field__input"
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          readOnly={readOnly}
          dir={dir}
        />
        {readOnly && value && <CopyButton text={value} />}
      </div>
      {hint && <span className="tools-field__hint">{hint}</span>}
    </label>
  );
}

export function ToolTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  readOnly,
  dir,
  hint,
  fill,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  dir?: "ltr" | "rtl";
  hint?: string;
  fill?: boolean;
}) {
  return (
    <label className={`tools-field ${readOnly ? "tools-field--readonly" : ""} ${fill ? "tools-field--fill" : ""}`}>
      <span className="tools-field__label">{label}</span>
      <div className="tools-field__row tools-field__row--textarea">
        <textarea
          className="tools-field__textarea"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          dir={dir}
        />
        {readOnly && value && <CopyButton text={value} className="tools-copy-btn--textarea" />}
      </div>
      {hint && <span className="tools-field__hint">{hint}</span>}
    </label>
  );
}

export function ToolOutputList({ items, columns = 1 }: { items: { label: string; value: string }[]; columns?: 1 | 2 }) {
  return (
    <div className={`tools-output-list ${columns === 2 ? "tools-output-list--2col" : ""}`}>
      {items.map((item) => (
        <div key={item.label} className="tools-output-row">
          <span className="tools-output-row__badge">{item.label}</span>
          <code className="tools-output-row__value" dir="ltr">
            {item.value || "—"}
          </code>
          {item.value && <CopyButton text={item.value} />}
        </div>
      ))}
    </div>
  );
}

export function ToolError({ message }: { message: string }) {
  return (
    <div className="tools-error" role="alert">
      {message}
    </div>
  );
}

export function ToolActionButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type="button" className={`tools-action-btn ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
