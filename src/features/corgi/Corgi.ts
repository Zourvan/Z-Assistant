import { CHARLES_CORGI_HEIGHT, CHARLES_CORGI_HTML, CHARLES_CORGI_WIDTH } from "./charlesMarkup";
import type { CorgiSpawnOptions, Pet, PetState, WalkDirection } from "./types";
import "./CharlesCorgi.css";

let nextId = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class Corgi implements Pet {
  readonly id: string;
  private el: HTMLDivElement | null = null;
  private visual: HTMLElement | null = null;
  private state: PetState = "Walking";
  private direction: WalkDirection = 1;
  private speed = 80;
  private scale = 1;
  private y = 0;
  private x = 0;
  private alive = false;
  private stateTimer = 0;
  private nextBehaviorAt = 0;
  private walkTime = 0;
  private pausedForPeer = 0;

  constructor(private readonly options: CorgiSpawnOptions) {
    this.id = `corgi-${++nextId}`;
    this.direction = options.direction;
    this.speed = options.speed;
    this.scale = options.scale;
  }

  spawn(container: HTMLElement): void {
    const el = document.createElement("div");
    el.className = "corgi-pet";
    el.setAttribute("aria-hidden", "true");
    el.dataset.petId = this.id;
    el.innerHTML = CHARLES_CORGI_HTML;

    const visual = el.querySelector<HTMLElement>(".charles-corgi");
    if (!visual) return;

    // Desync CSS loops slightly between pets
    visual.style.setProperty("--charles-duration", `${(1.7 + Math.random() * 0.8).toFixed(2)}s`);
    const delay = `-${(Math.random() * 1.8).toFixed(2)}s`;
    visual.querySelectorAll<HTMLElement>(".ear, .eye, .tongue, .tail, .body, .head, .mouth, .neck__back, .foot").forEach((node) => {
      node.style.animationDelay = delay;
    });

    container.appendChild(el);

    const viewportW = window.innerWidth;
    this.y = this.options.verticalOffset;
    this.x =
      this.direction === 1
        ? -CHARLES_CORGI_WIDTH * this.scale - 8
        : viewportW + 8;

    this.el = el;
    this.visual = visual;
    this.alive = true;
    this.state = "Walking";
    this.walkTime = 0;
    this.nextBehaviorAt = rand(3, 7);
    this.syncWalkClass();
    this.applyTransform();
  }

  update(deltaTime: number): void {
    if (!this.alive || !this.el || !this.visual) return;

    if (this.pausedForPeer > 0) {
      this.pausedForPeer = Math.max(0, this.pausedForPeer - deltaTime);
      this.visual.classList.add("is-paused");
      return;
    }

    this.visual.classList.remove("is-paused");
    this.stateTimer += deltaTime;

    switch (this.state) {
      case "Walking":
      case "Leaving":
        this.walkTime += deltaTime;
        this.x += this.direction * this.speed * deltaTime;
        this.applyTransform();

        if (this.state === "Walking" && this.walkTime >= this.nextBehaviorAt) {
          this.maybeStartBehavior();
        }

        if (this.hasExited()) {
          this.destroy();
        }
        break;

      case "Idle":
      case "Sitting":
      case "Sleeping":
      case "Barking":
        // Stay put; Charles CSS animations (blink / tail / tongue) keep running.
        if (this.stateTimer >= this.nextBehaviorAt) {
          this.state = "Walking";
          this.stateTimer = 0;
          this.walkTime = 0;
          this.nextBehaviorAt = rand(4, 9);
          this.syncWalkClass();
        }
        break;
    }
  }

  pauseBriefly(seconds = 0.6): void {
    if (this.state !== "Walking" || this.pausedForPeer > 0) return;
    if (Math.random() > 0.45) return;
    this.pausedForPeer = seconds;
  }

  getBounds(): { x: number; width: number } {
    return {
      x: this.x,
      width: CHARLES_CORGI_WIDTH * this.scale,
    };
  }

  isAlive(): boolean {
    return this.alive;
  }

  destroy(): void {
    this.alive = false;
    this.el?.remove();
    this.el = null;
    this.visual = null;
  }

  private maybeStartBehavior(): void {
    if (Math.random() < 0.55) {
      this.state = "Idle";
      this.stateTimer = 0;
      this.nextBehaviorAt = rand(2, 5);
      this.syncWalkClass();
    } else {
      this.walkTime = 0;
      this.nextBehaviorAt = rand(4, 8);
    }
  }

  private syncWalkClass(): void {
    if (!this.visual) return;
    const walking = this.state === "Walking" || this.state === "Leaving";
    this.visual.classList.toggle("is-walking", walking);
    // Faster travel → faster gait
    const duration = Math.max(0.28, Math.min(0.55, 42 / this.speed));
    this.visual.style.setProperty("--walk-duration", `${duration.toFixed(2)}s`);
  }

  private hasExited(): boolean {
    const w = CHARLES_CORGI_WIDTH * this.scale;
    if (this.direction === 1) return this.x > window.innerWidth + 4;
    return this.x + w < -4;
  }

  private applyTransform(): void {
    if (!this.el || !this.visual) return;
    // Charles faces right by default; mirror when walking left.
    const face = this.direction === 1 ? 1 : -1;
    this.el.style.transform = `translate3d(${this.x}px, ${-this.y}px, 0) scale(${this.scale})`;
    this.visual.style.transform = `scaleX(${face})`;
  }
}

export const createRandomCorgiOptions = (): CorgiSpawnOptions => ({
  direction: Math.random() < 0.5 ? 1 : -1,
  speed: rand(48, 110),
  scale: rand(0.85, 1.25),
  verticalOffset: rand(-8, 8),
  spriteVariant: 0,
});

export { rand };
export { CHARLES_CORGI_WIDTH as BASE_FRAME_WIDTH, CHARLES_CORGI_HEIGHT as BASE_FRAME_HEIGHT };
