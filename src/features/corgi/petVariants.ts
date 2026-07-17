import { ALEX_HUSKY_HEIGHT, ALEX_HUSKY_HTML, ALEX_HUSKY_WIDTH } from "./alexHuskyMarkup";
import { CHARLES_CORGI_HEIGHT, CHARLES_CORGI_HTML, CHARLES_CORGI_WIDTH } from "./charlesMarkup";
import { PARMAR_HUSKY_HEIGHT, PARMAR_HUSKY_HTML, PARMAR_HUSKY_WIDTH } from "./huskyMarkup";
import { NANO_CORGI_HEIGHT, NANO_CORGI_HTML, NANO_CORGI_WIDTH } from "./nanoCorgiMarkup";
import type { PetVariantId } from "./types";

export interface PetVariantDef {
  id: PetVariantId;
  html: string;
  width: number;
  height: number;
  /** Root visual element selector for pose classes & CSS vars */
  visualSelector: string;
}

export const PET_VARIANTS: Record<PetVariantId, PetVariantDef> = {
  charles: {
    id: "charles",
    html: CHARLES_CORGI_HTML,
    width: CHARLES_CORGI_WIDTH,
    height: CHARLES_CORGI_HEIGHT,
    visualSelector: ".charles-corgi",
  },
  nano: {
    id: "nano",
    html: NANO_CORGI_HTML,
    width: NANO_CORGI_WIDTH,
    height: NANO_CORGI_HEIGHT,
    visualSelector: ".nano-corgi",
  },
  "husky-parmar": {
    id: "husky-parmar",
    html: PARMAR_HUSKY_HTML,
    width: PARMAR_HUSKY_WIDTH,
    height: PARMAR_HUSKY_HEIGHT,
    visualSelector: ".parmar-husky",
  },
  "alex-husky": {
    id: "alex-husky",
    html: ALEX_HUSKY_HTML,
    width: ALEX_HUSKY_WIDTH,
    height: ALEX_HUSKY_HEIGHT,
    visualSelector: ".alex-husky",
  },
};

export const ALL_PET_VARIANT_IDS: PetVariantId[] = Object.keys(PET_VARIANTS) as PetVariantId[];

export const DEFAULT_PET_VARIANTS: PetVariantId[] = ["charles"];

export const getPetVariant = (id: PetVariantId): PetVariantDef => PET_VARIANTS[id];

export const pickRandomVariant = (enabled: PetVariantId[]): PetVariantId => {
  if (enabled.length === 0) return "charles";
  return enabled[Math.floor(Math.random() * enabled.length)]!;
};
