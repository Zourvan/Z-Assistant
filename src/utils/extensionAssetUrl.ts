/** Resolve bundled extension assets (static/, icons/) to a loadable URL. */
export const resolveExtensionAssetUrl = (url: string): string => {
  if (!url) return url;
  if (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("linear-gradient") ||
    url.startsWith("#")
  ) {
    return url;
  }

  const relative = url.replace(/^\.\//, "").replace(/^\//, "");
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(relative);
  }

  return `./${relative}`;
};
