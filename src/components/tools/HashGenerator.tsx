import { useState, useEffect } from "react";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolColumn, ToolTextarea, ToolField } from "./shared";

type HashAlgo = "SHA-256" | "SHA-384" | "SHA-512";

const hashText = async (text: string, algo: HashAlgo): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export function HashGenerator() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState<HashAlgo>("SHA-256");
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (!input) {
      setHash("");
      return;
    }
    let cancelled = false;
    hashText(input, algo).then((result) => {
      if (!cancelled) setHash(result);
    });
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

  const algos: HashAlgo[] = ["SHA-256", "SHA-384", "SHA-512"];

  return (
    <ToolPanel>
      <ToolToolbar>
        <div className="tools-toggle">
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
    </ToolPanel>
  );
}
