import { AnimatedPet, rand } from "./AnimatedPet";
import {
  getPetModeSettings,
  prefersReducedMotion,
  subscribePetModeSettings,
} from "./CorgiSettings";
import { pickRandomVariant } from "./petVariants";
import type { Pet, PetModeSettings, PetSpawnOptions } from "./types";
import { BASE_WALK_SPEED_MAX, BASE_WALK_SPEED_MIN } from "./types";

const MAX_ACTIVE = 3;
const SPAWN_MIN_MS = 15_000;
const SPAWN_MAX_MS = 40_000;
/** Respect OS reduce-motion by spawning far less often — never by hiding entirely. */
const REDUCED_SPAWN_MIN_MS = 60_000;
const REDUCED_SPAWN_MAX_MS = 120_000;

export const createRandomPetOptions = (settings: PetModeSettings): PetSpawnOptions => {
  const variant = pickRandomVariant(settings.variants);
  const sizeJitter = rand(0.9, 1.15);
  const speedJitter = rand(0.9, 1.1);
  return {
    variant,
    direction: Math.random() < 0.5 ? 1 : -1,
    speed: rand(BASE_WALK_SPEED_MIN, BASE_WALK_SPEED_MAX) * settings.speed * speedJitter,
    scale: sizeJitter * settings.size,
    verticalOffset: rand(-6, 6),
  };
};

export class CorgiManager {
  private container: HTMLElement | null = null;
  private pets: Pet[] = [];
  private rafId = 0;
  private spawnTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTs = 0;
  private running = false;
  private visible = true;
  private collisionCooldown = 0;
  private onVisibility: (() => void) | null = null;
  private settings: PetModeSettings = getPetModeSettings();
  private unsubscribeSettings: (() => void) | null = null;

  start(container: HTMLElement): void {
    if (this.running) this.stop();
    this.container = container;
    this.running = true;
    this.visible = document.visibilityState !== "hidden";
    this.lastTs = 0;
    this.settings = getPetModeSettings();

    this.unsubscribeSettings = subscribePetModeSettings((next) => {
      this.settings = next;
      if (!next.enabled) {
        for (const pet of this.pets) pet.destroy();
        this.pets = [];
      }
    });

    this.onVisibility = () => {
      this.visible = document.visibilityState !== "hidden";
      if (this.visible) {
        this.lastTs = 0;
        this.ensureLoop();
        this.scheduleSpawn();
      } else {
        this.clearSpawnTimer();
      }
    };
    document.addEventListener("visibilitychange", this.onVisibility);

    this.ensureLoop();
    this.trySpawn();
    this.scheduleSpawn();
  }

  stop(): void {
    this.running = false;
    this.clearSpawnTimer();
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.onVisibility) {
      document.removeEventListener("visibilitychange", this.onVisibility);
      this.onVisibility = null;
    }
    for (const pet of this.pets) pet.destroy();
    this.pets = [];
    this.container = null;
    this.lastTs = 0;
  }

  getActiveCount(): number {
    return this.pets.length;
  }

  private ensureLoop(): void {
    if (!this.running || this.rafId) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    this.rafId = 0;
    if (!this.running) return;

    if (!this.visible) {
      this.lastTs = 0;
      return;
    }

    if (!this.lastTs) this.lastTs = now;
    const delta = Math.min(0.05, (now - this.lastTs) / 1000);
    this.lastTs = now;

    for (const pet of this.pets) {
      pet.update(delta);
    }

    this.collisionCooldown = Math.max(0, this.collisionCooldown - delta);
    this.resolveSoftCollisions();
    this.pets = this.pets.filter((pet) => pet.isAlive());

    if (this.running && this.visible) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private resolveSoftCollisions(): void {
    if (this.collisionCooldown > 0) return;
    const alive = this.pets.filter((p) => p.isAlive());
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i]!.getBounds();
        const b = alive[j]!.getBounds();
        const overlap = a.x < b.x + b.width && a.x + a.width > b.x;
        if (overlap) {
          this.collisionCooldown = 1.25;
          if (Math.random() < 0.5) alive[i]!.pauseBriefly(rand(0.4, 1.1));
          else alive[j]!.pauseBriefly(rand(0.4, 1.1));
          return;
        }
      }
    }
  }

  private scheduleSpawn(overrideMs?: number): void {
    this.clearSpawnTimer();
    if (!this.running || !this.visible || !this.settings.enabled) return;
    if (this.settings.variants.length === 0) return;

    const reduced = prefersReducedMotion();
    const min = reduced ? REDUCED_SPAWN_MIN_MS : SPAWN_MIN_MS;
    const max = reduced ? REDUCED_SPAWN_MAX_MS : SPAWN_MAX_MS;
    const delay = overrideMs ?? rand(min, max);

    this.spawnTimer = setTimeout(() => {
      this.spawnTimer = null;
      this.trySpawn();
      this.scheduleSpawn();
    }, delay);
  }

  private trySpawn(): void {
    if (!this.container || !this.running || !this.visible) return;
    if (!this.settings.enabled || this.settings.variants.length === 0) return;

    this.pets = this.pets.filter((pet) => pet.isAlive());
    if (this.pets.length >= MAX_ACTIVE) return;

    const options = createRandomPetOptions(this.settings);
    const pet = new AnimatedPet(options);
    pet.spawn(this.container);
    this.pets.push(pet);
    this.ensureLoop();
  }

  private clearSpawnTimer(): void {
    if (this.spawnTimer !== null) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
  }
}
