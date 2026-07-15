export const computeDiff = (a: string, b: string): string => {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const max = Math.max(linesA.length, linesB.length);
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    const la = linesA[i] ?? "";
    const lb = linesB[i] ?? "";
    if (la === lb) out.push(`  ${la}`);
    else {
      if (la) out.push(`- ${la}`);
      if (lb) out.push(`+ ${lb}`);
    }
  }
  return out.join("\n");
};

export const textStats = (text: string) => ({
  words: text.trim() ? text.trim().split(/\s+/).length : 0,
  characters: text.length,
  lines: text ? text.split("\n").length : 0,
  bytes: new TextEncoder().encode(text).length,
});

export const sortLines = (text: string, desc = false): string =>
  text
    .split("\n")
    .sort((a, b) => (desc ? b.localeCompare(a) : a.localeCompare(b)))
    .join("\n");

export const removeDuplicateLines = (text: string): string => {
  const seen = new Set<string>();
  return text
    .split("\n")
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join("\n");
};

export const generateLorem = (paragraphs: number, wordsPerParagraph: number, words: string[]): string => {
  const result: string[] = [];
  let idx = 0;
  for (let p = 0; p < paragraphs; p++) {
    const para: string[] = [];
    for (let w = 0; w < wordsPerParagraph; w++) {
      para.push(words[idx % words.length]);
      idx++;
    }
    para[0] = para[0].charAt(0).toUpperCase() + para[0].slice(1);
    result.push(`${para.join(" ")}.`);
  }
  return result.join("\n\n");
};

export const toWords = (text: string): string[] =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

export type CaseStyle = "camel" | "pascal" | "snake" | "kebab" | "constant" | "title";

export const applyCase = (words: string[], style: CaseStyle): string => {
  switch (style) {
    case "camel":
      return words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join("");
    case "pascal":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    case "snake":
      return words.join("_");
    case "kebab":
      return words.join("-");
    case "constant":
      return words.join("_").toUpperCase();
    case "title":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    default:
      return words.join("");
  }
};

export const toSlug = (input: string): string =>
  input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatGraphql = (query: string): string => {
  let depth = 0;
  let out = "";
  const trimmed = query.replace(/\s+/g, " ").trim();
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "{" || ch === "(") {
      out += ch + "\n" + "  ".repeat(++depth);
    } else if (ch === "}" || ch === ")") {
      out = out.trimEnd() + "\n" + "  ".repeat(--depth) + ch;
    } else if (ch === " ") {
      out += ch;
    } else {
      out += ch;
    }
  }
  return out.trim();
};

export const minifyCode = (code: string): string => code.replace(/\s+/g, " ").replace(/\s*([{}();,:])\s*/g, "$1").trim();

export const optimizeSvg = (svg: string): string =>
  svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
