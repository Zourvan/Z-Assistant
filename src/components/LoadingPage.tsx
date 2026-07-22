import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./LoadingPage.css";

type GearConfig = {
  x: number;
  y: number;
  r: number;
  teeth: number;
  color: string;
  dir: "cw" | "ccw";
  speed: number;
};

const GEARS: GearConfig[] = [
  { x: 90, y: 100, r: 50, teeth: 12, color: "#e94560", dir: "cw", speed: 3 },
  { x: 175, y: 75, r: 35, teeth: 9, color: "#ffb830", dir: "ccw", speed: 2.1 },
  { x: 240, y: 110, r: 45, teeth: 11, color: "#00d2ff", dir: "cw", speed: 2.65 },
  { x: 155, y: 145, r: 25, teeth: 7, color: "#ff6b9d", dir: "ccw", speed: 1.5 },
];

const BASE_W = 350;
const BASE_H = 320;

function createGearSVG(config: GearConfig): { svg: string; size: number } {
  const { r, teeth, color } = config;
  const toothHeight = r * 0.2;
  const innerR = r - toothHeight;
  const outerR = r + toothHeight;
  const svgSize = (outerR + 4) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  let pathData = "";
  const angleStep = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a1 = i * angleStep;
    const a2 = a1 + angleStep * 0.15;
    const a3 = a1 + angleStep * 0.35;
    const a4 = a1 + angleStep * 0.5;
    const a5 = a1 + angleStep * 0.65;
    const a6 = a1 + angleStep * 0.85;

    const points = [
      [cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR],
      [cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR],
      [cx + Math.cos(a3) * outerR, cy + Math.sin(a3) * outerR],
      [cx + Math.cos(a4) * outerR, cy + Math.sin(a4) * outerR],
      [cx + Math.cos(a5) * outerR, cy + Math.sin(a5) * outerR],
      [cx + Math.cos(a6) * innerR, cy + Math.sin(a6) * innerR],
    ];

    if (i === 0) {
      pathData += `M ${points[0][0]} ${points[0][1]} `;
    }
    points.slice(1).forEach((p) => {
      pathData += `L ${p[0]} ${p[1]} `;
    });
  }
  pathData += "Z";

  const holeR = r * 0.25;

  const svg = `
    <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" aria-hidden="true">
      <g>
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9"/>
        <circle cx="${cx}" cy="${cy}" r="${holeR}" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.08}" fill="${color}" opacity="0.8"/>
        <line x1="${cx}" y1="${cy - holeR}" x2="${cx}" y2="${cy - r * 0.6}" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
        <line x1="${cx}" y1="${cy + holeR}" x2="${cx}" y2="${cy + r * 0.6}" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
        <line x1="${cx - holeR}" y1="${cy}" x2="${cx - r * 0.6}" y2="${cy}" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
        <line x1="${cx + holeR}" y1="${cy}" x2="${cx + r * 0.6}" y2="${cy}" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
      </g>
    </svg>
  `;

  return { svg, size: svgSize };
}

/* Dark-only blobs — no blue tones that flash before gears mount */
const BLOB_COLORS = [
  { r: 233, g: 69, b: 96, a: 0.18 },
  { r: 80, g: 24, b: 36, a: 0.35 },
  { r: 28, g: 28, b: 28, a: 0.45 },
  { r: 48, g: 48, b: 48, a: 0.35 },
] as const;

const GRADIENT_FADE_RGB = "0, 0, 0";

type BlobPoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

function createBlobLayer(width: number, height: number, color: (typeof BLOB_COLORS)[number]): {
  points: BlobPoint[];
  color: (typeof BLOB_COLORS)[number];
} {
  return {
    color,
    points: Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0.1 * Math.random() - 0.05,
      vy: 0.1 * Math.random() - 0.05,
      radius: 200 * Math.random() + 100,
    })),
  };
}

export function LoadingPage() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.getElementById("boot-splash")?.remove();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;

    const fillBlack = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      fillBlack();
    };

    let layers = BLOB_COLORS.map((color) =>
      createBlobLayer(canvas.width, canvas.height, color),
    );

    const handleResize = () => {
      resizeCanvas();
      layers = BLOB_COLORS.map((color) =>
        createBlobLayer(canvas.width, canvas.height, color),
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const drawFrame = () => {
      fillBlack();

      layers.forEach((layer) => {
        layer.points.forEach((point) => {
          point.x += point.vx;
          point.y += point.vy;

          if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
          if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
        });

        layer.points.forEach((point) => {
          const gradient = ctx.createRadialGradient(
            point.x,
            point.y,
            0,
            point.x,
            point.y,
            point.radius,
          );
          const { r, g, b, a } = layer.color;
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a})`);
          gradient.addColorStop(1, `rgba(${GRADIENT_FADE_RGB}, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
      });

      animationFrameId = window.requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const system = systemRef.current;
    if (!system) return;

    const created: HTMLElement[] = [];

    GEARS.forEach((config) => {
      const { svg, size } = createGearSVG(config);

      const wrapper = document.createElement("div");
      wrapper.className = "loading-page__gear-wrapper";
      wrapper.style.cssText = `
        left: ${config.x - size / 2}px;
        top: ${config.y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        --gear-color: ${config.color};
      `;

      const gearEl = document.createElement("div");
      gearEl.className = `loading-page__gear loading-page__gear--${config.dir} loading-page__gear--glow`;
      gearEl.style.animationDuration = `${config.speed}s`;
      gearEl.innerHTML = svg;

      wrapper.appendChild(gearEl);
      system.appendChild(wrapper);
      created.push(wrapper);
    });

    const createSteam = () => {
      if (!system.isConnected) return;
      const gear = GEARS[Math.floor(Math.random() * GEARS.length)];
      const steam = document.createElement("div");
      steam.className = "loading-page__steam";

      const angle = Math.random() * Math.PI * 2;
      const dist = gear.r * 0.6;
      steam.style.left = `${gear.x + Math.cos(angle) * dist}px`;
      steam.style.top = `${gear.y + Math.sin(angle) * dist}px`;
      steam.style.setProperty("--drift", `${Math.random() * 30 - 15}px`);
      steam.style.animationDuration = `${1.5 + Math.random()}s`;
      const size = 2 + Math.random() * 3;
      steam.style.width = steam.style.height = `${size}px`;

      system.appendChild(steam);
      window.setTimeout(() => steam.remove(), 2500);
    };

    const steamInterval = window.setInterval(createSteam, 200);

    const fitToWindow = () => {
      const scaleX = window.innerWidth / BASE_W;
      const scaleY = window.innerHeight / BASE_H;
      const scale = Math.min(scaleX, scaleY, 3) * 0.85;
      system.style.transform = `scale(${scale})`;
    };

    fitToWindow();
    window.addEventListener("resize", fitToWindow);

    return () => {
      window.clearInterval(steamInterval);
      window.removeEventListener("resize", fitToWindow);
      created.forEach((el) => el.remove());
      system.querySelectorAll(".loading-page__steam").forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="loading-page" role="status" aria-live="polite" aria-busy="true">
      <canvas
        ref={canvasRef}
        className="loading-page__canvas"
        aria-hidden="true"
      />
      <div className="loading-page__overlay" aria-hidden="true" />
      <div className="loading-page__system" ref={systemRef}>
        <div className="loading-page__bar-container">
          <div className="loading-page__bar" />
        </div>
        <div className="loading-page__text">{t("app.loading")}</div>
      </div>
    </div>
  );
}
