import type { IconType } from "react-icons";
import { SiAnthropic, SiGithubcopilot, SiGoogle, SiGooglegemini, SiOpenai, SiPerplexity, SiX } from "react-icons/si";
import type { AiProviderId } from "./providers";
import type { SearchSiteId } from "./searchSites";

/** Minimal DeepSeek mark (whale silhouette) — not in react-icons. */
export const DeepSeekIcon: IconType = ({ size = "1em", color = "currentColor", className, style, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    aria-hidden
    {...rest}
  >
    <path d="M3.2 12.4c.4-3.8 3.6-6.8 7.6-7.2 2.1-.2 4.1.4 5.7 1.6.5-.7 1.2-1.2 2.1-1.5.4-.1.8.2.8.6v.2c0 1.3-.6 2.4-1.5 3.2 1.2 1.5 1.9 3.4 1.8 5.4-.2 4.2-3.7 7.5-7.9 7.5-3.4 0-6.3-2.1-7.4-5.1-.4.1-.8.2-1.2.2-1.5 0-2.7-1.2-2.7-2.7 0-.9.4-1.7 1.1-2.2zm4.3-.9c.7 0 1.2.6 1.2 1.3s-.5 1.3-1.2 1.3-1.2-.6-1.2-1.3.5-1.3 1.2-1.3zm5.2 0c.7 0 1.2.6 1.2 1.3s-.5 1.3-1.2 1.3-1.2-.6-1.2-1.3.5-1.3 1.2-1.3z" />
  </svg>
);

/** Digikala bag mark — not in react-icons. */
export const DigikalaIcon: IconType = ({ size = "1em", color = "currentColor", className, style, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    aria-hidden
    {...rest}
  >
    <path d="M7.2 7.5h9.6l.9 12.2c.05.7-.5 1.3-1.2 1.3H7.5c-.7 0-1.25-.6-1.2-1.3L7.2 7.5z" />
    <path d="M9 7.5V6.2a3 3 0 0 1 6 0v1.3" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Divar pin mark — not in react-icons. */
export const DivarIcon: IconType = ({ size = "1em", color = "currentColor", className, style, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    aria-hidden
    {...rest}
  >
    <path d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 4.4 6.5 12.5 6.5 12.5s6.5-8.1 6.5-12.5c0-3.6-2.9-6.5-6.5-6.5zm0 8.8a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z" />
  </svg>
);

export const AI_PROVIDER_ICONS: Record<AiProviderId, IconType> = {
  chatgpt: SiOpenai,
  claude: SiAnthropic,
  gemini: SiGooglegemini,
  grok: SiX,
  perplexity: SiPerplexity,
  deepseek: DeepSeekIcon,
  copilot: SiGithubcopilot,
};

export const SEARCH_SITE_ICONS: Record<SearchSiteId, IconType> = {
  google: SiGoogle,
  digikala: DigikalaIcon,
  divar: DivarIcon,
};
