import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolWorkspace, ToolOutputList, ToolField } from "../../shared";
import { SplitEditor } from "../SplitEditor";
import {
  computeDiff,
  textStats,
  sortLines,
  removeDuplicateLines,
  generateLorem,
  toWords,
  applyCase,
  toSlug,
  type CaseStyle,
} from "../utils/text";
import { LOREM_WORDS } from "../utils/staticData";

export function DiffPanel() {
  const { t } = useI18n();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const output = useMemo(() => (left || right ? computeDiff(left, right) : ""), [left, right]);

  return (
    <>
      <ToolWorkspace layout="split">
        <ToolColumn>
          <ToolTextarea label={t("tools.developerToolkit.diff.original")} value={left} onChange={setLeft} fill dir="ltr" />
        </ToolColumn>
        <ToolColumn>
          <ToolTextarea label={t("tools.developerToolkit.diff.modified")} value={right} onChange={setRight} fill dir="ltr" />
        </ToolColumn>
      </ToolWorkspace>
      <ToolTextarea label={t("tools.developerToolkit.diff.result")} value={output} readOnly fill dir="ltr" />
    </>
  );
}

export function CasePanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const styles: CaseStyle[] = ["camel", "pascal", "snake", "kebab", "constant", "title"];

  const outputs = useMemo(() => {
    const words = toWords(input);
    if (!words.length) return [];
    return styles.map((s) => ({ label: t(`tools.encodingToolkit.case.${s === "constant" ? "constant" : s}`), value: applyCase(words, s) }));
  }, [input, t]);

  return (
    <>
      <ToolTextarea label={t("tools.developerToolkit.common.input")} value={input} onChange={setInput} fill dir="ltr" />
      {outputs.length > 0 && <ToolOutputList items={outputs} columns={2} />}
    </>
  );
}

export function SlugPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const output = useMemo(() => (input ? toSlug(input) : ""), [input]);

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
    />
  );
}

export function LoremPanel() {
  const { t } = useI18n();
  const [paragraphs, setParagraphs] = useState("3");
  const [words, setWords] = useState("50");

  const output = useMemo(() => {
    const p = Math.min(10, Math.max(1, Number(paragraphs) || 1));
    const w = Math.min(200, Math.max(5, Number(words) || 50));
    return generateLorem(p, w, LOREM_WORDS);
  }, [paragraphs, words]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.lorem.paragraphs")} value={paragraphs} onChange={setParagraphs} type="number" dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.lorem.words")} value={words} onChange={setWords} type="number" dir="ltr" compact />
      </ToolToolbar>
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={output} readOnly fill dir="ltr" />
    </>
  );
}

export function TextStatsPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const stats = useMemo(() => textStats(input), [input]);

  return (
    <>
      <ToolTextarea label={t("tools.developerToolkit.common.input")} value={input} onChange={setInput} fill dir="ltr" />
      <ToolOutputList
        items={[
          { label: t("tools.developerToolkit.textStats.words"), value: String(stats.words) },
          { label: t("tools.developerToolkit.textStats.characters"), value: String(stats.characters) },
          { label: t("tools.developerToolkit.textStats.lines"), value: String(stats.lines) },
          { label: t("tools.developerToolkit.textStats.bytes"), value: String(stats.bytes) },
        ]}
        columns={2}
      />
    </>
  );
}

export function LineSorterPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [desc, setDesc] = useState(false);
  const output = useMemo(() => (input ? sortLines(input, desc) : ""), [input, desc]);

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
      toolbar={
        <ToolToolbar>
          <div className="tools-toggle">
            <button type="button" className={`tools-toggle__btn ${!desc ? "tools-toggle__btn--active" : ""}`} onClick={() => setDesc(false)}>
              A → Z
            </button>
            <button type="button" className={`tools-toggle__btn ${desc ? "tools-toggle__btn--active" : ""}`} onClick={() => setDesc(true)}>
              Z → A
            </button>
          </div>
        </ToolToolbar>
      }
    />
  );
}

export function RemoveDuplicatesPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const output = useMemo(() => (input ? removeDuplicateLines(input) : ""), [input]);

  return (
    <SplitEditor
      inputLabel={t("tools.developerToolkit.common.input")}
      outputLabel={t("tools.developerToolkit.common.output")}
      input={input}
      onInputChange={setInput}
      output={output}
    />
  );
}
