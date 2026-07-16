import { Corgi, createRandomCorgiOptions, rand } from "./Corgi";
import { prefersReducedMotion } from "./CorgiSettings";
import type { Pet } from "./types";

const MAX_ACTIVE = 3;
const SPAWN_MIN_MS = 15_000;
const SPAWN_MAX_MS = 40_000;
/** Respect OS reduce-motion by spawning far less often — never by hiding entirely. */
const REDUCED_SPAWN_MIN_MS = 60_000;
const REDUCED_SPAWN_MAX_MS = 120_000;

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

  start(container: HTMLElement): void {
    if (this.running) this.stop();
    this.container = container;
    this.running = true;
    this.visible = document.visibilityState !== "hidden";
    this.lastTs = 0;

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
    // Immediate feedback when the user turns the setting on
    this.trySpawn();
    this.scheduleSpawn();
  }

  stop(): void {
    this.running = false;
    this.clearSpawnTimer();
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
    const corgis = this.pets.filter((p): p is Corgi => p instanceof Corgi && p.isAlive());
    for (let i = 0; i < corgis.length; i++) {
      for (let j = i + 1; j < corgis.length; j++) {
        const a = corgis[i].getBounds();
        const b = corgis[j].getBounds();
        const overlap = a.x < b.x + b.width && a.x + a.width > b.x;
        if (overlap) {
          this.collisionCooldown = 1.25;
          if (Math.random() < 0.5) corgis[i].pauseBriefly(rand(0.4, 1.1));
          else corgis[j].pauseBriefly(rand(0.4, 1.1));
          return;
        }
      }
    }
  }

  private scheduleSpawn(overrideMs?: number): void {
    this.clearSpawnTimer();
    if (!this.running || !this.visible) return;

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
    this.pets = this.pets.filter((pet) => pet.isAlive());
    if (this.pets.length >= MAX_ACTIVE) return;

    const options = createRandomCorgiOptions();
    const pet = new Corgi(options);
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
