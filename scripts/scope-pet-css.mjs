import fs from "fs";

function scopeCss(raw, classMap, kfMap) {
  let css = raw.replace(/@-webkit-/g, "");

  const classes = Object.keys(classMap).sort((a, b) => b.length - a.length);
  for (const cls of classes) {
    const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    css = css.replace(new RegExp("\\." + escaped + "(?=[\\s,{:#.>+~\\[])", "g"), "." + classMap[cls]);
  }

  for (const [oldKf, newKf] of Object.entries(kfMap)) {
    css = css.replace(new RegExp("@keyframes\\s+" + oldKf + "\\b", "g"), "@keyframes " + newKf);
    css = css.replace(
      new RegExp("animation(?:-name)?:\\s*([^;]*?)\\b" + oldKf + "\\b", "g"),
      (m) => m.replace(oldKf, newKf),
    );
  }

  return css;
}

function vminToPx(css, factor = 0.65) {
  return css.replace(/[\d.]+vmin/g, (m) => {
    const n = parseFloat(m);
    return `${Math.max(1, Math.round(n * factor))}px`;
  });
}

const parmarRaw = fs.readFileSync("src/features/corgi/variants/parmar-husky-raw.css", "utf8");
const parmarClasses = {
  husky: "parmar-husky",
  mane: "parmar-mane",
  coat: "parmar-coat",
  body: "parmar-body",
  head: "parmar-head",
  ear: "parmar-ear",
  face: "parmar-face",
  eye: "parmar-eye",
  nose: "parmar-nose",
  mouth: "parmar-mouth",
  lips: "parmar-lips",
  tongue: "parmar-tongue",
  torso: "parmar-torso",
  legs: "parmar-legs",
  "front-legs": "parmar-front-legs",
  leg: "parmar-leg",
  "hind-leg": "parmar-hind-leg",
  tail: "parmar-tail",
};
const parmarKf = [
  "head",
  "mouth",
  "nose",
  "face",
  "mane",
  "front-left",
  "front-right",
  "back-left",
  "back-right",
  "tail",
  "squiggly-anim",
  "none",
];
const parmarKfMap = Object.fromEntries(parmarKf.map((k) => [k, "parmar-" + k]));
let parmarCss = vminToPx(scopeCss(parmarRaw, parmarClasses, parmarKfMap), 0.7);

const alexRaw = fs.readFileSync("src/features/corgi/variants/alex-husky-raw.css", "utf8");
const alexClasses = {
  "husky-tail": "alex-husky-tail",
  "husky-hind-leg": "alex-husky-hind-leg",
  "husky-front-legs": "alex-husky-front-legs",
  "husky-leg": "alex-husky-leg",
  "husky-legs": "alex-husky-legs",
  "husky-torso": "alex-husky-torso",
  "husky-tongue": "alex-husky-tongue",
  "husky-lips": "alex-husky-lips",
  "husky-mouth": "alex-husky-mouth",
  "husky-nose": "alex-husky-nose",
  "husky-eye": "alex-husky-eye",
  "husky-face": "alex-husky-face",
  "husky-ear": "alex-husky-ear",
  "husky-head": "alex-husky-head",
  "husky-body": "alex-husky-body",
  "husky-coat": "alex-husky-coat",
  "husky-mane": "alex-husky-mane",
  husky: "alex-husky",
};
const alexKf = [
  "husky-head",
  "husky-mouth",
  "husky-nose",
  "husky-face",
  "husky-mane",
  "husky-front-left",
  "husky-front-right",
  "husky-back-left",
  "husky-back-right",
  "husky-tail",
  "husky-squiggly-anim",
  "husky-none",
];
const alexKfMap = Object.fromEntries(alexKf.map((k) => [k, "alex-" + k]));
let alexCss = vminToPx(scopeCss(alexRaw, alexClasses, alexKfMap), 0.65);

// Hide ground/shadow pseudo-elements in overlay mode
const overlayFixes = `
.parmar-husky:before, .parmar-husky:after,
.alex-husky:before, .alex-husky:after {
  display: none !important;
}
`;

fs.writeFileSync(
  "src/features/corgi/ParmarHusky.css",
  "/* github.com/harshalparmar/husky — scoped for NEXX Tab overlay */\n" +
    ".parmar-husky { position: relative; transform-origin: bottom center; }\n" +
    parmarCss +
    overlayFixes,
);
fs.writeFileSync(
  "src/features/corgi/AlexHusky.css",
  "/* github.com/codrops/AnimatedAnimals — scoped for NEXX Tab overlay */\n" +
    ".alex-husky { position: relative; transform-origin: bottom center; }\n" +
    alexCss +
    overlayFixes,
);

console.log("CSS scoped successfully");
