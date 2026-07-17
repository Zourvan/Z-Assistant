/** Generic pet contract — add Kitty/Shiba/etc. by implementing this. */
export interface Pet {
  readonly id: string;
  spawn(container: HTMLElement): void;
  update(deltaTime: number): void;
  destroy(): void;
  isAlive(): boolean;
  getBounds(): { x: number; width: number };
  pauseBriefly(seconds?: number): void;
}

export type PetState = "Walking" | "Idle" | "Sitting" | "Sleeping" | "Barking" | "Leaving";

export type WalkDirection = 1 | -1;

export type PetVariantId = "charles" | "nano" | "husky-parmar" | "alex-husky";

export interface PetModeSettings {
  enabled: boolean;
  variants: PetVariantId[];
  /** Global size multiplier (0.5 – 2.0) */
  size: number;
  /** Global speed multiplier (0.5 – 2.0) */
  speed: number;
}

export interface PetSpawnOptions {
  variant: PetVariantId;
  direction: WalkDirection;
  speed: number;
  scale: number;
  verticalOffset: number;
}

export const MIN_PET_SIZE = 0.5;
export const MAX_PET_SIZE = 2;
export const PET_SIZE_STEP = 0.1;
export const DEFAULT_PET_SIZE = 1;

export const MIN_PET_SPEED = 0.5;
export const MAX_PET_SPEED = 2;
export const PET_SPEED_STEP = 0.1;
export const DEFAULT_PET_SPEED = 1;

export const BASE_WALK_SPEED_MIN = 48;
export const BASE_WALK_SPEED_MAX = 110;

/** @deprecated Use PetSpawnOptions */
export interface CorgiSpawnOptions extends PetSpawnOptions {
  spriteVariant: number;
}

export interface SpriteSheetDef {
  url: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  /** Seconds per frame */
  frameDuration: number;
}
