/** Generic pet contract — add Kitty/Shiba/etc. by implementing this. */
export interface Pet {
  readonly id: string;
  spawn(container: HTMLElement): void;
  update(deltaTime: number): void;
  destroy(): void;
  isAlive(): boolean;
}

export type PetState = "Walking" | "Idle" | "Sitting" | "Sleeping" | "Barking" | "Leaving";

export type WalkDirection = 1 | -1;

export interface SpriteSheetDef {
  url: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  /** Seconds per frame */
  frameDuration: number;
}

export interface CorgiSpawnOptions {
  direction: WalkDirection;
  speed: number;
  scale: number;
  verticalOffset: number;
  spriteVariant: number;
}
