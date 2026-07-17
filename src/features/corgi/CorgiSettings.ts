import { scheduleSyncPush } from "../../components/settings/settingsSync";
import { ALL_PET_VARIANT_IDS, DEFAULT_PET_VARIANTS } from "./petVariants";
import type { PetModeSettings, PetVariantId } from "./types";
import {
  DEFAULT_PET_SIZE,
  DEFAULT_PET_SPEED,
  MAX_PET_SIZE,
  MAX_PET_SPEED,
  MIN_PET_SIZE,
  MIN_PET_SPEED,
} from "./types";

export const CORGI_MODE_KEY = "corgiMode";
export const PET_SETTINGS_KEY = "petModeSettings";
export const CORGI_MODE_CHANGE_EVENT = "nexx:corgi-mode-change";
export const PET_SETTINGS_CHANGE_EVENT = "nexx:pet-settings-change";

const isPetVariantId = (value: unknown): value is PetVariantId =>
  typeof value === "string" && (ALL_PET_VARIANT_IDS as string[]).includes(value);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeVariants = (variants: unknown): PetVariantId[] => {
  if (!Array.isArray(variants)) return [...DEFAULT_PET_VARIANTS];
  const unique = variants.filter(isPetVariantId);
  return unique.length > 0 ? [...new Set(unique)] : [...DEFAULT_PET_VARIANTS];
};

export const normalizePetModeSettings = (raw: Partial<PetModeSettings> | null | undefined): PetModeSettings => {
  const enabled =
    typeof raw?.enabled === "boolean"
      ? raw.enabled
      : localStorage.getItem(CORGI_MODE_KEY) === "1";

  return {
    enabled,
    variants: normalizeVariants(raw?.variants),
    size:
      typeof raw?.size === "number" && Number.isFinite(raw.size)
        ? clamp(raw.size, MIN_PET_SIZE, MAX_PET_SIZE)
        : DEFAULT_PET_SIZE,
    speed:
      typeof raw?.speed === "number" && Number.isFinite(raw.speed)
        ? clamp(raw.speed, MIN_PET_SPEED, MAX_PET_SPEED)
        : DEFAULT_PET_SPEED,
  };
};

const readStoredPetSettings = (): PetModeSettings => {
  const legacyEnabled = localStorage.getItem(CORGI_MODE_KEY) === "1";
  const raw = localStorage.getItem(PET_SETTINGS_KEY);
  if (!raw) {
    return normalizePetModeSettings({ enabled: legacyEnabled });
  }
  try {
    return normalizePetModeSettings(JSON.parse(raw) as Partial<PetModeSettings>);
  } catch {
    return normalizePetModeSettings({ enabled: legacyEnabled });
  }
};

const writePetSettings = (settings: PetModeSettings): void => {
  localStorage.setItem(PET_SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(CORGI_MODE_KEY, settings.enabled ? "1" : "0");
  scheduleSyncPush();
  window.dispatchEvent(new CustomEvent(PET_SETTINGS_CHANGE_EVENT, { detail: settings }));
  window.dispatchEvent(
    new CustomEvent(CORGI_MODE_CHANGE_EVENT, {
      detail: { enabled: settings.enabled },
    }),
  );
};

export const getPetModeSettings = (): PetModeSettings => readStoredPetSettings();

export const setPetModeSettings = (settings: PetModeSettings): void => {
  writePetSettings(normalizePetModeSettings(settings));
};

export const isCorgiModeEnabled = (): boolean => getPetModeSettings().enabled;

export const setCorgiModeEnabled = (enabled: boolean): void => {
  setPetModeSettings({ ...getPetModeSettings(), enabled });
};

export const togglePetVariant = (variant: PetVariantId, selected: boolean): void => {
  const current = getPetModeSettings();
  const next = new Set(current.variants);
  if (selected) next.add(variant);
  else next.delete(variant);
  setPetModeSettings({
    ...current,
    variants: next.size > 0 ? [...next] : [...DEFAULT_PET_VARIANTS],
  });
};

export const subscribePetModeSettings = (listener: (settings: PetModeSettings) => void): (() => void) => {
  const emit = (raw?: Partial<PetModeSettings> | null) => {
    listener(normalizePetModeSettings(raw ?? getPetModeSettings()));
  };

  const onPetSettings = (event: Event) => {
    const detail = (event as CustomEvent<PetModeSettings>).detail;
    emit(detail);
  };

  // Legacy on/off event only carries `{ enabled }` — always re-read full settings.
  const onLegacyMode = () => {
    emit(getPetModeSettings());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === PET_SETTINGS_KEY || event.key === CORGI_MODE_KEY) {
      emit(getPetModeSettings());
    }
  };

  window.addEventListener(PET_SETTINGS_CHANGE_EVENT, onPetSettings);
  window.addEventListener(CORGI_MODE_CHANGE_EVENT, onLegacyMode);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(PET_SETTINGS_CHANGE_EVENT, onPetSettings);
    window.removeEventListener(CORGI_MODE_CHANGE_EVENT, onLegacyMode);
    window.removeEventListener("storage", onStorage);
  };
};

/** @deprecated Use subscribePetModeSettings */
export const subscribeCorgiMode = (listener: (enabled: boolean) => void): (() => void) =>
  subscribePetModeSettings((settings) => listener(settings.enabled));

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
