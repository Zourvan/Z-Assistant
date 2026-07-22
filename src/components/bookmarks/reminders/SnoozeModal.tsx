import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import type { SnoozePreset } from "./types";
import { applySnoozePreset } from "./reminderUtils";
import "./BookmarkReminderModal.css";

interface SnoozeModalProps {
  onSnooze: (until: number) => Promise<void>;
  onClose: () => void;
}

const SNOOZE_PRESETS: SnoozePreset[] = ["10m", "30m", "1h", "tomorrow_morning", "next_week", "custom"];

export function SnoozeModal({ onSnooze, onClose }: SnoozeModalProps) {
  const { t } = useI18n();
  const { textColor, backgroundColor } = useCalendar();
  const themeCssVars = buildThemeCssVars(textColor, backgroundColor);
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);

  const handlePreset = async (preset: SnoozePreset) => {
    setSaving(true);
    try {
      const until =
        preset === "custom" ? new Date(customDate).getTime() : applySnoozePreset(preset);
      await onSnooze(until);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div
        className="bookmarks-modal reminder-modal reminder-modal--compact"
        style={themeCssVars}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="reminder-modal__header">
          <h3>{t("bookmarks.reminder.snooze")}</h3>
          <button type="button" className="reminder-modal__close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="reminder-modal__presets">
          {SNOOZE_PRESETS.filter((p) => p !== "custom").map((preset) => (
            <button
              key={preset}
              type="button"
              className="reminder-modal__preset"
              onClick={() => handlePreset(preset)}
              disabled={saving}
            >
              {t(`bookmarks.reminder.snoozePresets.${preset}`)}
            </button>
          ))}
        </div>

        <div className="reminder-modal__datetime">
          <input type="datetime-local" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          <button
            type="button"
            className="reminder-modal__btn reminder-modal__btn--primary"
            onClick={() => handlePreset("custom")}
            disabled={saving}
          >
            {t("bookmarks.reminder.snoozeCustom")}
          </button>
        </div>
      </div>
    </div>
  );
}
