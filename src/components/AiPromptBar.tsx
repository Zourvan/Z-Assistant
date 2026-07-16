import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Send } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { buildThemeVars } from "./settings/themeUtils";
import {
  AI_PROVIDERS,
  getAiProvider,
  loadAiProviderId,
  saveAiProviderId,
  type AiProviderId,
} from "./aiPromptBar/providers";
import { AI_PROVIDER_ICONS } from "./aiPromptBar/icons";
import "./AiPromptBar.css";

const MIN_TEXTAREA_HEIGHT = 24;
const MAX_TEXTAREA_HEIGHT = 160;

export function AiPromptBar() {
  const { textColor, backgroundColor } = useTheme();
  const { t, dir } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [providerId, setProviderId] = useState<AiProviderId>(() => loadAiProviderId());
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);

  const themeStyle = buildThemeVars(textColor, backgroundColor);
  const provider = getAiProvider(providerId);
  const ProviderIcon = AI_PROVIDER_ICONS[provider.id];
  const trimmed = prompt.trim();
  const canSend = trimmed.length > 0;

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, MIN_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [prompt, resizeTextarea]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const selectProvider = (id: AiProviderId) => {
    setProviderId(id);
    saveAiProviderId(id);
    setMenuOpen(false);
    textareaRef.current?.focus();
  };

  const sendPrompt = () => {
    if (!canSend) return;
    const url = provider.buildUrl(trimmed);
    // Navigate the current New Tab into the AI chat so the prompt can auto-start.
    window.location.assign(url);
  };

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendPrompt();
    }
  };

  const onProviderKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!menuOpen) {
        const index = AI_PROVIDERS.findIndex((p) => p.id === providerId);
        setMenuOpen(true);
        setActiveOption(index >= 0 ? index : 0);
        return;
      }
      setActiveOption((prev) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (prev + delta + AI_PROVIDERS.length) % AI_PROVIDERS.length;
      });
      return;
    }

    if (menuOpen && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const next = AI_PROVIDERS[activeOption];
      if (next) selectProvider(next.id);
    }
  };

  const openMenu = () => {
    const index = AI_PROVIDERS.findIndex((p) => p.id === providerId);
    setActiveOption(index >= 0 ? index : 0);
    setMenuOpen((open) => !open);
  };

  return (
    <div className="ai-prompt-bar-wrap" dir={dir}>
      <div
        ref={rootRef}
        className="ai-prompt-bar backdrop-blur-md shadow-lg"
        style={themeStyle}
        role="search"
        aria-label={t("aiPromptBar.label")}
      >
        <div className="ai-prompt-bar__provider">
          <button
            type="button"
            className={`ai-prompt-bar__provider-btn${menuOpen ? " is-open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={listboxId}
            aria-label={t("aiPromptBar.selectProvider")}
            onClick={openMenu}
            onKeyDown={onProviderKeyDown}
          >
            <ProviderIcon className="ai-prompt-bar__provider-icon" size={14} aria-hidden />
            <span className="ai-prompt-bar__provider-name">{t(`aiPromptBar.providers.${provider.nameKey}`)}</span>
            <ChevronDown size={14} className="ai-prompt-bar__provider-chevron" aria-hidden />
          </button>

          {menuOpen && (
            <ul
              id={listboxId}
              className="ai-prompt-bar__menu"
              role="listbox"
              aria-label={t("aiPromptBar.selectProvider")}
            >
              {AI_PROVIDERS.map((item, index) => {
                const selected = item.id === providerId;
                const active = index === activeOption;
                const ItemIcon = AI_PROVIDER_ICONS[item.id];
                return (
                  <li key={item.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`ai-prompt-bar__menu-item${selected ? " is-selected" : ""}${active ? " is-active" : ""}`}
                      onClick={() => selectProvider(item.id)}
                      onMouseEnter={() => setActiveOption(index)}
                    >
                      <ItemIcon className="ai-prompt-bar__provider-icon" size={14} aria-hidden />
                      <span>{t(`aiPromptBar.providers.${item.nameKey}`)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className="ai-prompt-bar__input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onTextareaKeyDown}
          placeholder={t("aiPromptBar.placeholder")}
          rows={1}
          aria-label={t("aiPromptBar.placeholder")}
        />

        <button
          type="button"
          className="ai-prompt-bar__send"
          onClick={sendPrompt}
          disabled={!canSend}
          aria-label={t("aiPromptBar.send")}
          title={t("aiPromptBar.send")}
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
