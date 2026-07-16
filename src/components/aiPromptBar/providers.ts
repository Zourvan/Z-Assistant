export type AiProviderId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "perplexity"
  | "deepseek"
  | "copilot";

export interface AiProvider {
  id: AiProviderId;
  /** i18n key under aiPromptBar.providers.* */
  nameKey: string;
  /** Build a URL that opens a new conversation with the prompt when supported. */
  buildUrl: (prompt: string) => string;
}

const withQuery = (base: string, param: string, prompt: string): string => {
  const url = new URL(base);
  url.searchParams.set(param, prompt);
  return url.toString();
};

export const AI_PROVIDERS: readonly AiProvider[] = [
  {
    id: "chatgpt",
    nameKey: "chatgpt",
    // ?q= starts a new chat and submits the prompt (same as browser search-engine URLs).
    buildUrl: (prompt) => withQuery("https://chatgpt.com/", "q", prompt),
  },
  {
    id: "claude",
    nameKey: "claude",
    buildUrl: (prompt) => withQuery("https://claude.ai/new", "q", prompt),
  },
  {
    id: "gemini",
    nameKey: "gemini",
    buildUrl: (prompt) => withQuery("https://gemini.google.com/app", "q", prompt),
  },
  {
    id: "grok",
    nameKey: "grok",
    buildUrl: (prompt) => withQuery("https://grok.com/", "q", prompt),
  },
  {
    id: "perplexity",
    nameKey: "perplexity",
    // /search?q= runs the query immediately.
    buildUrl: (prompt) => withQuery("https://www.perplexity.ai/search", "q", prompt),
  },
  {
    id: "deepseek",
    nameKey: "deepseek",
    buildUrl: (prompt) => withQuery("https://chat.deepseek.com/", "q", prompt),
  },
  {
    id: "copilot",
    nameKey: "copilot",
    buildUrl: (prompt) => withQuery("https://copilot.microsoft.com/", "q", prompt),
  },
] as const;

export const DEFAULT_AI_PROVIDER_ID: AiProviderId = "chatgpt";
export const AI_PROVIDER_STORAGE_KEY = "aiPromptBarProvider";

export const isAiProviderId = (value: unknown): value is AiProviderId =>
  typeof value === "string" && AI_PROVIDERS.some((provider) => provider.id === value);

export const getAiProvider = (id: AiProviderId): AiProvider =>
  AI_PROVIDERS.find((provider) => provider.id === id) ?? AI_PROVIDERS[0];

export const loadAiProviderId = (): AiProviderId => {
  try {
    const saved = localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    return isAiProviderId(saved) ? saved : DEFAULT_AI_PROVIDER_ID;
  } catch {
    return DEFAULT_AI_PROVIDER_ID;
  }
};

export const saveAiProviderId = (id: AiProviderId) => {
  try {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, id);
  } catch {
    // Ignore quota / privacy-mode failures
  }
};
