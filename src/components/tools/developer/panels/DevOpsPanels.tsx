import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolOutputList, ToolWorkspace } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import { GITIGNORE_TEMPLATES, DOCKERIGNORE_TEMPLATES } from "../utils/staticData";

const PERM_BITS = ["r", "w", "x"] as const;

const octalToSymbolic = (octal: string): string => {
  const digits = octal.replace(/[^0-7]/g, "").slice(-3).padStart(3, "0");
  return digits
    .split("")
    .map((d) => {
      const n = Number(d);
      return PERM_BITS.map((b, i) => (n & (4 >> i) ? b : "-")).join("");
    })
    .join("");
};

const symbolicToOctal = (sym: string): string => {
  const groups = sym.match(/[rwx-]{3}/g);
  if (!groups || groups.length !== 3) return "";
  return groups
    .map((g) => {
      let n = 0;
      if (g[0] === "r") n += 4;
      if (g[1] === "w") n += 2;
      if (g[2] === "x") n += 1;
      return String(n);
    })
    .join("");
};

export function ChmodPanel() {
  const { t } = useI18n();
  const [octal, setOctal] = useState("755");
  const [symbolic, setSymbolic] = useState("rwxr-xr-x");

  const fromOctal = useMemo(() => octalToSymbolic(octal), [octal]);
  const fromSymbolic = useMemo(() => symbolicToOctal(symbolic), [symbolic]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolField label={t("tools.developerToolkit.chmod.octal")} value={octal} onChange={setOctal} dir="ltr" />
        <ToolField label={t("tools.developerToolkit.chmod.symbolicResult")} value={fromOctal} readOnly dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        <ToolField label={t("tools.developerToolkit.chmod.symbolic")} value={symbolic} onChange={setSymbolic} dir="ltr" placeholder="rwxr-xr-x" />
        <ToolField label={t("tools.developerToolkit.chmod.octalResult")} value={fromSymbolic} readOnly dir="ltr" />
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function SemverPanel() {
  const { t } = useI18n();
  const [version, setVersion] = useState("1.2.3");

  const bumps = useMemo(() => {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    const maj = Number(match[1]);
    const min = Number(match[2]);
    const pat = Number(match[3]);
    return {
      major: `${maj + 1}.0.0`,
      minor: `${maj}.${min + 1}.0`,
      patch: `${maj}.${min}.${pat + 1}`,
    };
  }, [version]);

  return (
    <>
      <ToolField label={t("tools.developerToolkit.semver.version")} value={version} onChange={setVersion} dir="ltr" placeholder="1.2.3" />
      {bumps && (
        <ToolOutputList
          items={[
            { label: "Major", value: bumps.major },
            { label: "Minor", value: bumps.minor },
            { label: "Patch", value: bumps.patch },
          ]}
        />
      )}
    </>
  );
}

export function GitignorePanel() {
  const { t } = useI18n();
  const [template, setTemplate] = useState("node");
  const output = GITIGNORE_TEMPLATES[template] ?? "";

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {Object.keys(GITIGNORE_TEMPLATES).map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${template === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setTemplate(k)}>
              {k}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolTextarea label=".gitignore" value={output} readOnly fill dir="ltr" />
    </>
  );
}

export function ConventionalCommitPanel() {
  const { t } = useI18n();
  const [type, setType] = useState("feat");
  const [scope, setScope] = useState("auth");
  const [message, setMessage] = useState("add login endpoint");
  const [breaking, setBreaking] = useState(false);

  const commit = useMemo(() => {
    const scopePart = scope.trim() ? `(${scope.trim()})` : "";
    const bang = breaking ? "!" : "";
    return `${type}${scopePart}${bang}: ${message.trim()}`;
  }, [type, scope, message, breaking]);

  const types = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"];

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {types.map((ty) => (
            <button key={ty} type="button" className={`tools-toggle__btn ${type === ty ? "tools-toggle__btn--active" : ""}`} onClick={() => setType(ty)}>
              {ty}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.conventional.scope")} value={scope} onChange={setScope} dir="ltr" compact />
        <label className="tools-field tools-field--compact">
          <span className="tools-field__label">{t("tools.developerToolkit.conventional.breaking")}</span>
          <input type="checkbox" checked={breaking} onChange={(e) => setBreaking(e.target.checked)} />
        </label>
      </ToolToolbar>
      <ToolField label={t("tools.developerToolkit.conventional.message")} value={message} onChange={setMessage} dir="ltr" />
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={commit} readOnly dir="ltr" />
    </>
  );
}

export function DockerIgnorePanel() {
  const { t } = useI18n();
  const [template, setTemplate] = useState("general");
  const output = DOCKERIGNORE_TEMPLATES[template] ?? "";

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle">
          {Object.keys(DOCKERIGNORE_TEMPLATES).map((k) => (
            <button key={k} type="button" className={`tools-toggle__btn ${template === k ? "tools-toggle__btn--active" : ""}`} onClick={() => setTemplate(k)}>
              {k}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolTextarea label=".dockerignore" value={output} readOnly fill dir="ltr" />
    </>
  );
}

export function DockerTagsPanel() {
  const { t } = useI18n();
  const [name, setName] = useState("app");
  const [version, setVersion] = useState("1.2.0");

  const tags = useMemo(() => {
    const n = name.trim() || "app";
    return [`${n}:latest`, `${n}:${version}`, `${n}:dev`].join("\n");
  }, [name, version]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.dockerTags.name")} value={name} onChange={setName} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.semver.version")} value={version} onChange={setVersion} dir="ltr" compact />
      </ToolToolbar>
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={tags} readOnly dir="ltr" />
    </>
  );
}

export function K8sConverterPanel() {
  const { t } = useI18n();
  const [cpu, setCpu] = useState("500m");
  const [memory, setMemory] = useState("2048Mi");

  const converted = useMemo(() => {
    const cpuMatch = cpu.match(/^(\d+(?:\.\d+)?)(m)?$/i);
    let cpuOut = "—";
    if (cpuMatch) {
      const val = Number(cpuMatch[1]);
      cpuOut = cpuMatch[2] ? `${val / 1000} CPU` : `${val} CPU`;
    }
    const memMatch = memory.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)?$/i);
    let memOut = "—";
    if (memMatch) {
      const val = Number(memMatch[1]);
      const unit = (memMatch[2] ?? "B").toUpperCase();
      const factors: Record<string, number> = { B: 1, KI: 1024, MI: 1024 ** 2, GI: 1024 ** 3, TI: 1024 ** 4 };
      const bytes = val * (factors[unit] ?? 1);
      if (bytes >= 1024 ** 3) memOut = `${(bytes / 1024 ** 3).toFixed(2)}Gi`;
      else if (bytes >= 1024 ** 2) memOut = `${(bytes / 1024 ** 2).toFixed(0)}Mi`;
      else memOut = `${bytes}B`;
    }
    return [
      { label: "CPU", value: cpuOut },
      { label: "Memory", value: memOut },
    ];
  }, [cpu, memory]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="CPU" value={cpu} onChange={setCpu} dir="ltr" placeholder="500m" compact />
        <ToolField label="Memory" value={memory} onChange={setMemory} dir="ltr" placeholder="2048Mi" compact />
      </ToolToolbar>
      <ToolOutputList items={converted} />
    </>
  );
}

type EnvMode = "parse" | "sort";

export function EnvEditorPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("API_KEY=secret\nDEBUG=true\n# comment");
  const [mode, setMode] = useState<EnvMode>("parse");

  const output = useMemo(() => {
    if (!input.trim()) return { text: "", error: "" };
    const lines = input.split("\n");
    const entries: { key: string; value: string; comment?: boolean }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        entries.push({ key: "", value: trimmed, comment: true });
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) return { text: "", error: t("tools.developerToolkit.env.invalidLine") };
      entries.push({ key: trimmed.slice(0, eq), value: trimmed.slice(eq + 1) });
    }
    if (mode === "sort") {
      const sorted = entries
        .filter((e) => !e.comment && e.key)
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((e) => `${e.key}=${e.value}`)
        .join("\n");
      return { text: sorted, error: "" };
    }
    const parsed = entries
      .filter((e) => !e.comment && e.key)
      .map((e) => `${e.key}: ${e.value}`)
      .join("\n");
    return { text: parsed, error: "" };
  }, [input, mode, t]);

  return (
    <SplitEditor
      inputLabel=".env"
      outputLabel={mode === "parse" ? t("tools.developerToolkit.env.parsed") : t("tools.developerToolkit.env.sorted")}
      input={input}
      onInputChange={setInput}
      output={output.text}
      error={output.error}
      toolbar={
        <ToolToolbar>
          <div className="tools-toggle">
            <button type="button" className={`tools-toggle__btn ${mode === "parse" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("parse")}>
              {t("tools.developerToolkit.env.parse")}
            </button>
            <button type="button" className={`tools-toggle__btn ${mode === "sort" ? "tools-toggle__btn--active" : ""}`} onClick={() => setMode("sort")}>
              {t("tools.developerToolkit.env.sort")}
            </button>
          </div>
        </ToolToolbar>
      }
    />
  );
}
