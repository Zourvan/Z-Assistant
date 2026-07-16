import { scheduleSyncPush } from "../../components/settings/settingsSync";

export const CORGI_MODE_KEY = "corgiMode";
export const CORGI_MODE_CHANGE_EVENT = "nexx:corgi-mode-change";

export const isCorgiModeEnabled = (): boolean => localStorage.getItem(CORGI_MODE_KEY) === "1";

export const setCorgiModeEnabled = (enabled: boolean): void => {
  localStorage.setItem(CORGI_MODE_KEY, enabled ? "1" : "0");
  scheduleSyncPush();
  window.dispatchEvent(
    new CustomEvent(CORGI_MODE_CHANGE_EVENT, {
      detail: { enabled },
    }),
  );
};

export const subscribeCorgiMode = (listener: (enabled: boolean) => void): (() => void) => {
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
    listener(detail?.enabled ?? isCorgiModeEnabled());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === CORGI_MODE_KEY) {
      listener(event.newValue === "1");
    }
  };

  window.addEventListener(CORGI_MODE_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CORGI_MODE_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const subscribeReducedMotion = (listener: (reduced: boolean) => void): (() => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => listener(mq.matches);

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }

  mq.addListener(handler);
  return () => mq.removeListener(handler);
};
