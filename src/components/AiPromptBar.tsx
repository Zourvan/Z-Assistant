import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Send } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "../i18n/LanguageProvider";
import { buildThemeCssVars } from "./settings/themeUtils";
import { isPersianText } from "./tasks/taskUtils";
import {
  AI_PROVIDERS,
  getAiProvider,
  loadAiProviderId,
  saveAiProviderId,
  type AiProviderId,
} from "./aiPromptBar/providers";
import {
  SEARCH_SITES,
  getSearchSite,
  loadPromptBarMode,
  loadSearchSiteId,
  savePromptBarMode,
  saveSearchSiteId,
  type PromptBarMode,
  type SearchSiteId,
} from "./aiPromptBar/searchSites";
import { AI_PROVIDER_ICONS, SEARCH_SITE_ICONS } from "./aiPromptBar/icons";
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
  const [mode, setMode] = useState<PromptBarMode>(() => loadPromptBarMode());
  const [providerId, setProviderId] = useState<AiProviderId>(() => loadAiProviderId());
  const [searchSiteId, setSearchSiteId] = useState<SearchSiteId>(() => loadSearchSiteId());
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);

  const themeStyle = buildThemeCssVars(textColor, backgroundColor);
  const isAiMode = mode === "ai";
  const provider = getAiProvider(providerId);
  const searchSite = getSearchSite(searchSiteId);
  const ProviderIcon = AI_PROVIDER_ICONS[provider.id];
  const SearchIcon = SEARCH_SITE_ICONS[searchSite.id];
  const ActiveIcon = isAiMode ? ProviderIcon : SearchIcon;
  const activeName = isAiMode
    ? t(`aiPromptBar.providers.${provider.nameKey}`)
    : t(`aiPromptBar.searchSites.${searchSite.nameKey}`);
  const selectLabel = isAiMode ? t("aiPromptBar.selectProvider") : t("aiPromptBar.selectSearchSite");
  const placeholder = isAiMode ? t("aiPromptBar.placeholder") : t("aiPromptBar.searchPlaceholder");
  const sendLabel = isAiMode ? t("aiPromptBar.send") : t("aiPromptBar.search");
  const barLabel = isAiMode ? t("aiPromptBar.label") : t("aiPromptBar.searchLabel");
  const menuItems = isAiMode ? AI_PROVIDERS : SEARCH_SITES;
  const trimmed = prompt.trim();
  const canSend = trimmed.length > 0;
  const inputDir = trimmed ? (isPersianText(prompt) ? "rtl" : "ltr") : dir;

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

  const selectMode = (next: PromptBarMode) => {
    if (next === mode) return;
    setMode(next);
    savePromptBarMode(next);
    setMenuOpen(false);
    textareaRef.current?.focus();
  };

  const selectProvider = (id: AiProviderId) => {
    setProviderId(id);
    saveAiProviderId(id);
    setMenuOpen(false);
    textareaRef.current?.focus();
  };

  const selectSearchSite = (id: SearchSiteId) => {
    setSearchSiteId(id);
    saveSearchSiteId(id);
    setMenuOpen(false);
    textareaRef.current?.focus();
  };

  const sendPrompt = () => {
    if (!canSend) return;
    const url = isAiMode ? provider.buildUrl(trimmed) : searchSite.buildUrl(trimmed);
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
        const index = isAiMode
          ? AI_PROVIDERS.findIndex((p) => p.id === providerId)
          : SEARCH_SITES.findIndex((s) => s.id === searchSiteId);
        setMenuOpen(true);
        setActiveOption(index >= 0 ? index : 0);
        return;
      }
      setActiveOption((prev) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (prev + delta + menuItems.length) % menuItems.length;
      });
      return;
    }

    if (menuOpen && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      if (isAiMode) {
        const next = AI_PROVIDERS[activeOption];
        if (next) selectProvider(next.id);
      } else {
        const next = SEARCH_SITES[activeOption];
        if (next) selectSearchSite(next.id);
      }
    }
  };

  const openMenu = () => {
    const index = isAiMode
      ? AI_PROVIDERS.findIndex((p) => p.id === providerId)
      : SEARCH_SITES.findIndex((s) => s.id === searchSiteId);
    setActiveOption(index >= 0 ? index : 0);
    setMenuOpen((open) => !open);
  };

  return (
    <div className="ai-prompt-bar-wrap" dir={dir} style={themeStyle}>
      <div
        className="ai-prompt-bar__tabs"
        role="tablist"
        aria-label={t("aiPromptBar.modesLabel")}
        data-mode={mode}
      >
        <button
          type="button"
          role="tab"
          id="ai-prompt-tab-ai"
          aria-selected={isAiMode}
          className={`ai-prompt-bar__tab${isAiMode ? " is-active" : ""}`}
          onClick={() => selectMode("ai")}
        >
          {t("aiPromptBar.tabs.ai")}
        </button>
        <button
          type="button"
          role="tab"
          id="ai-prompt-tab-search"
          aria-selected={!isAiMode}
          className={`ai-prompt-bar__tab${!isAiMode ? " is-active" : ""}`}
          onClick={() => selectMode("search")}
        >
          {t("aiPromptBar.tabs.search")}
        </button>
      </div>

      <div
        ref={rootRef}
        className="ai-prompt-bar"
        data-mode={mode}
        role="search"
        aria-label={barLabel}
        aria-labelledby={isAiMode ? "ai-prompt-tab-ai" : "ai-prompt-tab-search"}
      >
        <div className="ai-prompt-bar__provider">
          <button
            type="button"
            className={`ai-prompt-bar__provider-btn${menuOpen ? " is-open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={listboxId}
            aria-label={selectLabel}
            onClick={openMenu}
            onKeyDown={onProviderKeyDown}
          >
            <ActiveIcon className="ai-prompt-bar__provider-icon" size={14} aria-hidden />
            <span className="ai-prompt-bar__provider-name">{activeName}</span>
            <ChevronDown size={14} className="ai-prompt-bar__provider-chevron" aria-hidden />
          </button>

          {menuOpen && (
            <ul id={listboxId} className="ai-prompt-bar__menu" role="listbox" aria-label={selectLabel}>
              {isAiMode
                ? AI_PROVIDERS.map((item, index) => {
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
                  })
                : SEARCH_SITES.map((item, index) => {
                    const selected = item.id === searchSiteId;
                    const active = index === activeOption;
                    const ItemIcon = SEARCH_SITE_ICONS[item.id];
                    return (
                      <li key={item.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          className={`ai-prompt-bar__menu-item${selected ? " is-selected" : ""}${active ? " is-active" : ""}`}
                          onClick={() => selectSearchSite(item.id)}
                          onMouseEnter={() => setActiveOption(index)}
                        >
                          <ItemIcon className="ai-prompt-bar__provider-icon" size={14} aria-hidden />
                          <span>{t(`aiPromptBar.searchSites.${item.nameKey}`)}</span>
                        </button>
                      </li>
                    );
                  })}
            </ul>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className={`ai-prompt-bar__input ${inputDir === "rtl" ? "rtl" : "ltr"}`}
          dir={inputDir}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onTextareaKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-label={placeholder}
        />

        <button
          type="button"
          className="ai-prompt-bar__send"
          onClick={sendPrompt}
          disabled={!canSend}
          aria-label={sendLabel}
          title={sendLabel}
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
