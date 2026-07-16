import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAME_W = 120;
const FRAME_H = 90;

/**
 * Polished sticker-style corgi (Colab-inspired): soft shapes, cream head,
 * fox-orange body, fluffy cream rump, white outline, stubby legs.
 */
function corgi(opts = {}) {
  const {
    ox = 8,
    oy = 8,
    bob = 0,
    legs = [0, 2, 1, -1],
    tailAngle = -28,
    blink = false,
    mouthOpen = false,
    sitting = false,
    sleeping = false,
    zzz = false,
  } = opts;

  const y = oy + bob;
  const outline = "#FFF8F0";
  const fur = "#E8913A";
  const furDark = "#D47828";
  const cream = "#FFE8D2";
  const creamDeep = "#FFD4B0";
  const pink = "#F4B4A0";
  const ink = "#3A2418";

  const leg = (lx, ly, lift, front = false) => {
    const top = y + 52 + lift;
    const fill = front ? fur : furDark;
    return `
      <rect x="${ox + lx}" y="${top}" width="11" height="${sitting ? 8 : 16}" rx="5.5"
        fill="${outline}" stroke="none"/>
      <rect x="${ox + lx + 1.2}" y="${top + 1}" width="8.6" height="${sitting ? 6 : 14}" rx="4.3" fill="${fill}"/>
      <ellipse cx="${ox + lx + 5.5}" cy="${top + (sitting ? 8 : 16)}" rx="6.5" ry="3.8" fill="${outline}"/>
      <ellipse cx="${ox + lx + 5.5}" cy="${top + (sitting ? 8 : 16)}" rx="5" ry="2.6" fill="${cream}"/>
    `;
  };

  const eye = (ex, ey) => {
    if (blink || sleeping) {
      return `<path d="M${ex - 4.5} ${ey} Q${ex} ${ey + 2} ${ex + 4.5} ${ey}"
        stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    return `
      <circle cx="${ex}" cy="${ey}" r="3.2" fill="${ink}"/>
      <circle cx="${ex - 0.9}" cy="${ey - 1}" r="1.1" fill="#fff"/>
      <circle cx="${ex + 1}" cy="${ey + 0.6}" r="0.45" fill="#fff" opacity="0.7"/>
    `;
  };

  const mouth = mouthOpen
    ? `<ellipse cx="${ox + 22}" cy="${y + 36}" rx="4.5" ry="4" fill="${ink}"/>
       <ellipse cx="${ox + 22}" cy="${y + 37.5}" rx="2.4" ry="1.6" fill="#E85A6A"/>`
    : `<path d="M${ox + 17} ${y + 35.5} Q${ox + 22} ${y + 38.5} ${ox + 27} ${y + 35.5}"
        stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

  const zzzMarks = zzz
    ? `
      <g fill="${outline}" opacity="0.95" font-family="Segoe UI, system-ui, sans-serif" font-weight="700">
        <text x="${ox + 78}" y="${y + 14}" font-size="11">z</text>
        <text x="${ox + 88}" y="${y + 6}" font-size="14" opacity="0.75">z</text>
      </g>`
    : "";

  const bodyY = sitting ? y + 6 : y;
  const headY = sitting ? y + 4 : y;

  return `
  <g>
    <!-- soft ground shadow -->
    <ellipse cx="${ox + 54}" cy="${y + 78}" rx="34" ry="5" fill="#000" opacity="0.12"/>

    <!-- tail -->
    <g transform="rotate(${tailAngle} ${ox + 86} ${bodyY + 40})">
      <ellipse cx="${ox + 96}" cy="${bodyY + 40}" rx="14" ry="8" fill="${outline}"/>
      <ellipse cx="${ox + 96}" cy="${bodyY + 40}" rx="11.5" ry="6" fill="${fur}"/>
      <ellipse cx="${ox + 104}" cy="${bodyY + 40}" rx="5" ry="4.2" fill="${cream}"/>
    </g>

    <!-- fluffy rump (back) -->
    <ellipse cx="${ox + 78}" cy="${bodyY + 40}" rx="22" ry="20" fill="${outline}"/>
    <ellipse cx="${ox + 78}" cy="${bodyY + 40}" rx="19" ry="17" fill="${cream}"/>
    <ellipse cx="${ox + 74}" cy="${bodyY + 36}" rx="10" ry="9" fill="#FFF6EC" opacity="0.85"/>

    <!-- torso -->
    <ellipse cx="${ox + 52}" cy="${bodyY + 42}" rx="30" ry="${sitting ? 24 : 20}" fill="${outline}"/>
    <ellipse cx="${ox + 52}" cy="${bodyY + 42}" rx="27" ry="${sitting ? 21 : 17}" fill="${fur}"/>
    <ellipse cx="${ox + 48}" cy="${bodyY + 46}" rx="16" ry="10" fill="${furDark}" opacity="0.35"/>
    <!-- belly -->
    <ellipse cx="${ox + 48}" cy="${bodyY + 50}" rx="18" ry="9" fill="${cream}"/>

    <!-- legs -->
    ${
      sitting
        ? `${leg(30, 0, 6, true)}${leg(46, 0, 7)}${leg(62, 0, 6, true)}${leg(74, 0, 7)}`
        : `${leg(28, 0, legs[0], true)}${leg(42, 0, legs[1])}${leg(58, 0, legs[2], true)}${leg(72, 0, legs[3])}`
    }

    <!-- neck fluff -->
    <ellipse cx="${ox + 30}" cy="${headY + 40}" rx="12" ry="9" fill="${outline}"/>
    <ellipse cx="${ox + 30}" cy="${headY + 40}" rx="10" ry="7" fill="${cream}"/>

    <!-- head -->
    <ellipse cx="${ox + 26}" cy="${headY + 26}" rx="20" ry="18" fill="${outline}"/>
    <ellipse cx="${ox + 26}" cy="${headY + 26}" rx="17.5" ry="15.5" fill="${cream}"/>
    <ellipse cx="${ox + 24}" cy="${headY + 22}" rx="10" ry="7" fill="#FFF6EC" opacity="0.7"/>

    <!-- ears -->
    <g transform="rotate(-16 ${ox + 14} ${headY + 12})">
      <ellipse cx="${ox + 14}" cy="${headY + 10}" rx="8" ry="14" fill="${outline}"/>
      <ellipse cx="${ox + 14}" cy="${headY + 10}" rx="6.2" ry="11.5" fill="${fur}"/>
      <ellipse cx="${ox + 14}" cy="${headY + 12}" rx="3.2" ry="7" fill="${pink}"/>
    </g>
    <g transform="rotate(16 ${ox + 38} ${headY + 12})">
      <ellipse cx="${ox + 38}" cy="${headY + 10}" rx="8" ry="14" fill="${outline}"/>
      <ellipse cx="${ox + 38}" cy="${headY + 10}" rx="6.2" ry="11.5" fill="${fur}"/>
      <ellipse cx="${ox + 38}" cy="${headY + 12}" rx="3.2" ry="7" fill="${pink}"/>
    </g>

    <!-- cheeks -->
    <ellipse cx="${ox + 14}" cy="${headY + 32}" rx="5" ry="3.5" fill="${pink}" opacity="0.45"/>
    <ellipse cx="${ox + 36}" cy="${headY + 32}" rx="5" ry="3.5" fill="${pink}" opacity="0.45"/>

    <!-- snout -->
    <ellipse cx="${ox + 22}" cy="${headY + 32}" rx="10" ry="7.5" fill="${outline}"/>
    <ellipse cx="${ox + 22}" cy="${headY + 32}" rx="8.5" ry="6" fill="${creamDeep}"/>
    <ellipse cx="${ox + 22}" cy="${headY + 29.5}" rx="2.6" ry="2" fill="${ink}"/>
    ${mouth}

    <!-- eyes -->
    ${eye(ox + 18, headY + 24)}
    ${eye(ox + 30, headY + 24)}

    ${zzzMarks}
  </g>`;
}

function sheet(frames) {
  const w = FRAME_W * frames.length;
  const parts = frames
    .map((fn, i) => `<g transform="translate(${i * FRAME_W},0)">${fn(i)}</g>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${FRAME_H}" viewBox="0 0 ${w} ${FRAME_H}">
${parts}
</svg>`;
}

const walkLegs = [
  [0, 4, 2, -2],
  [3, 1, -2, 3],
  [4, -2, -3, 2],
  [2, -3, 0, 4],
  [-1, 0, 3, 1],
  [-2, 3, 4, -1],
];

const out = path.join(__dirname, "../src/features/corgi/assets");
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(
  path.join(out, "walk.svg"),
  sheet(
    walkLegs.map((legs, i) => () =>
      corgi({
        bob: i % 2 === 0 ? 0 : -1.5,
        legs,
        tailAngle: -22 - (i % 2) * 16,
      }),
    ),
  ),
);

fs.writeFileSync(
  path.join(out, "idle.svg"),
  sheet([
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -20 }),
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -38 }),
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -20, blink: true }),
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -42 }),
  ]),
);

fs.writeFileSync(
  path.join(out, "sit.svg"),
  sheet([
    () => corgi({ sitting: true, tailAngle: -18 }),
    () => corgi({ sitting: true, tailAngle: -32 }),
  ]),
);

fs.writeFileSync(
  path.join(out, "bark.svg"),
  sheet([
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -24 }),
    () => corgi({ legs: [0, 1, 0, 1], tailAngle: -40, mouthOpen: true, bob: -2 }),
  ]),
);

fs.writeFileSync(
  path.join(out, "sleep.svg"),
  sheet([
    () => corgi({ sitting: true, sleeping: true, zzz: true, tailAngle: -12 }),
    () => corgi({ sitting: true, sleeping: true, zzz: true, tailAngle: -20, bob: 1 }),
  ]),
);

console.log("Polished corgi sprites written to", out);
console.log(`Frame size: ${FRAME_W}x${FRAME_H}`);
