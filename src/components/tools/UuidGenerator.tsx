import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useI18n } from "../../i18n/LanguageProvider";
import { ToolPanel, ToolWorkspace, ToolToolbar, ToolField, ToolActionButton } from "./shared";

export function UuidGenerator() {
  const { t } = useI18n();
  const [uuid, setUuid] = useState(() => uuidv4());
  const [count, setCount] = useState(1);

  const generate = () => {
    if (count <= 1) {
      setUuid(uuidv4());
    } else {
      setUuid(Array.from({ length: Math.min(10, count) }, () => uuidv4()).join("\n"));
    }
  };

  return (
    <ToolPanel className="tools-panel--uuid">
      <ToolToolbar>
        <ToolField
          label={t("tools.uuid.count")}
          value={String(count)}
          onChange={(v) => setCount(Math.min(10, Math.max(1, parseInt(v, 10) || 1)))}
          type="number"
          dir="ltr"
          compact
        />
        <ToolActionButton onClick={generate}>
          <RefreshCw size={14} />
          {t("tools.uuid.generate")}
        </ToolActionButton>
      </ToolToolbar>

      <ToolWorkspace layout="stack">
        <ToolField label={t("tools.uuid.result")} value={uuid} readOnly dir="ltr" />
      </ToolWorkspace>
    </ToolPanel>
  );
}
