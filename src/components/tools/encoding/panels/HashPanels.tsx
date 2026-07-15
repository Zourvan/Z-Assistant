import { useState, useEffect, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolField } from "../../shared";

type ShaAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const digestHex = async (text: string, algo: ShaAlgo): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export function HashPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<ShaAlgo>("SHA-256");
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (!input) {
      setHash("");
      return;
    }
    let cancelled = false;
    digestHex(input, algo).then((result) => {
      if (!cancelled) setHash(result);
    });
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

  const algos: ShaAlgo[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {algos.map((a) => (
            <button
              key={a}
              type="button"
              className={`tools-toggle__btn ${algo === a ? "tools-toggle__btn--active" : ""}`}
              onClick={() => setAlgo(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </ToolToolbar>

      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.hash.input")} value={input} onChange={setInput} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolField label={t("tools.hash.output")} value={hash} readOnly dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
    </>
  );
}

/* CRC32 (table-based) */

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

const crc32 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let crc = 0xffffffff;
  for (const b of bytes) crc = CRC32_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
};

const adler32 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a).toString(16).padStart(8, "0");
};

export function CrcPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const results = useMemo(() => {
    if (!input) return { crc32: "", adler32: "" };
    return { crc32: crc32(input), adler32: adler32(input) };
  }, [input]);

  return (
    <ToolWorkspace layout="stack">
      <ToolTextarea label={t("tools.hash.input")} value={input} onChange={setInput} rows={4} dir="ltr" />
      <ToolField label="CRC32" value={results.crc32} readOnly dir="ltr" />
      <ToolField label="Adler-32" value={results.adler32} readOnly dir="ltr" />
    </ToolWorkspace>
  );
}

/* HMAC SHA-256 / SHA-512 */

type HmacAlgo = "SHA-256" | "SHA-512";

export function HmacPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [algo, setAlgo] = useState<HmacAlgo>("SHA-256");
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (!input || !secret) {
      setHash("");
      return;
    }
    let cancelled = false;
    (async () => {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: algo },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (!cancelled) setHash(hex);
    })();
    return () => {
      cancelled = true;
    };
  }, [input, secret, algo]);

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {(["SHA-256", "SHA-512"] as HmacAlgo[]).map((a) => (
            <button
              key={a}
              type="button"
              className={`tools-toggle__btn ${algo === a ? "tools-toggle__btn--active" : ""}`}
              onClick={() => setAlgo(a)}
            >
              HMAC {a}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.encodingToolkit.hmac.secret")} value={secret} onChange={setSecret} dir="ltr" />
        <ToolTextarea label={t("tools.hash.input")} value={input} onChange={setInput} rows={3} dir="ltr" />
        <ToolField label={t("tools.hash.output")} value={hash} readOnly dir="ltr" />
      </ToolWorkspace>
    </>
  );
}
