export type SearchSiteId = "google" | "digikala" | "divar";

export type PromptBarMode = "ai" | "search";

export interface SearchSite {
  id: SearchSiteId;
  /** i18n key under aiPromptBar.searchSites.* */
  nameKey: string;
  buildUrl: (query: string) => string;
}

const withQuery = (base: string, param: string, query: string): string => {
  const url = new URL(base);
  url.searchParams.set(param, query);
  return url.toString();
};

export const SEARCH_SITES: readonly SearchSite[] = [
  {
    id: "google",
    nameKey: "google",
    buildUrl: (query) => withQuery("https://www.google.com/search", "q", query),
  },
  {
    id: "digikala",
    nameKey: "digikala",
    buildUrl: (query) => withQuery("https://www.digikala.com/search/", "q", query),
  },
  {
    id: "divar",
    nameKey: "divar",
    buildUrl: (query) => withQuery("https://divar.ir/s/tehran", "q", query),
  },
] as const;

export const DEFAULT_SEARCH_SITE_ID: SearchSiteId = "google";
export const SEARCH_SITE_STORAGE_KEY = "aiPromptBarSearchSite";
export const PROMPT_BAR_MODE_STORAGE_KEY = "aiPromptBarMode";
export const DEFAULT_PROMPT_BAR_MODE: PromptBarMode = "ai";

export const isSearchSiteId = (value: unknown): value is SearchSiteId =>
  typeof value === "string" && SEARCH_SITES.some((site) => site.id === value);

export const isPromptBarMode = (value: unknown): value is PromptBarMode =>
  value === "ai" || value === "search";

export const getSearchSite = (id: SearchSiteId): SearchSite =>
  SEARCH_SITES.find((site) => site.id === id) ?? SEARCH_SITES[0];

export const loadSearchSiteId = (): SearchSiteId => {
  try {
    const saved = localStorage.getItem(SEARCH_SITE_STORAGE_KEY);
    return isSearchSiteId(saved) ? saved : DEFAULT_SEARCH_SITE_ID;
  } catch {
    return DEFAULT_SEARCH_SITE_ID;
  }
};

export const saveSearchSiteId = (id: SearchSiteId) => {
  try {
    localStorage.setItem(SEARCH_SITE_STORAGE_KEY, id);
  } catch {
    // Ignore quota / privacy-mode failures
  }
};

export const loadPromptBarMode = (): PromptBarMode => {
  try {
    const saved = localStorage.getItem(PROMPT_BAR_MODE_STORAGE_KEY);
    return isPromptBarMode(saved) ? saved : DEFAULT_PROMPT_BAR_MODE;
  } catch {
    return DEFAULT_PROMPT_BAR_MODE;
  }
};

export const savePromptBarMode = (mode: PromptBarMode) => {
  try {
    localStorage.setItem(PROMPT_BAR_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore quota / privacy-mode failures
  }
};
