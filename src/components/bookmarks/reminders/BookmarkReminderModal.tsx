import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import { getReminderSettings } from "./reminderSettings";
import type { BookmarkReminder, QuickPreset, ReminderCategory, ReminderInput, ReminderPriority } from "./types";
import { applyQuickPreset, defaultRepeatRule } from "./reminderUtils";
import "./BookmarkReminderModal.css";

interface BookmarkReminderModalProps {
  bookmarkId: string;
  bookmarkTitle: string;
  bookmarkUrl?: string;
  existing?: BookmarkReminder;
  onSave: (input: ReminderInput) => Promise<void>;
  onClose: () => void;
}

const QUICK_PRESETS: QuickPreset[] = [
  "later_today",
  "tomorrow",
  "this_weekend",
  "next_week",
  "next_month",
  "custom",
];

const CATEGORIES: ReminderCategory[] = [
  "read_later",
  "documentation",
  "research",
  "ai",
  "programming",
  "shopping",
  "work",
  "personal",
];

const PRIORITIES: ReminderPriority[] = ["low", "medium", "high"];

export function BookmarkReminderModal({
  bookmarkId,
  bookmarkTitle,
  bookmarkUrl,
  existing,
  onSave,
  onClose,
}: BookmarkReminderModalProps) {
  const { t } = useI18n();
  const { textColor, backgroundColor } = useCalendar();
  const themeCssVars = buildThemeCssVars(textColor, backgroundColor);
  const settings = getReminderSettings();

  const [enabled, setEnabled] = useState(existing ? existing.enabled : true);
  const [dateOnly, setDateOnly] = useState(existing?.dateOnly ?? false);
  const [selectedPreset, setSelectedPreset] = useState<QuickPreset>(existing ? "custom" : "tomorrow");
  const [customDate, setCustomDate] = useState(() => {
    const base = existing?.reminderAt ?? applyQuickPreset("tomorrow");
    const d = new Date(base);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [customTime, setCustomTime] = useState(() => {
    const base = existing?.reminderAt ?? applyQuickPreset("tomorrow");
    const d = new Date(base);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [note, setNote] = useState(existing?.note ?? "");
  const [category, setCategory] = useState<ReminderCategory | "">(existing?.category ?? "");
  const [priority, setPriority] = useState<ReminderPriority>(existing?.priority ?? "medium");
  const [repeatType, setRepeatType] = useState(existing?.repeat.type ?? "none");
  const [saving, setSaving] = useState(false);

  const reminderAt = useMemo(() => {
    if (selectedPreset !== "custom") {
      return applyQuickPreset(selectedPreset);
    }
    const [year, month, day] = customDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!dateOnly) {
      const [h, m] = customTime.split(":").map(Number);
      date.setHours(h, m, 0, 0);
    } else {
      date.setHours(settings.defaultReminderHour, settings.defaultReminderMinute, 0, 0);
    }
    return date.getTime();
  }, [selectedPreset, customDate, customTime, dateOnly, settings]);

  const handlePresetClick = (preset: QuickPreset) => {
    setSelectedPreset(preset);
    if (preset === "custom") return;
    const at = applyQuickPreset(preset);
    const d = new Date(at);
    setCustomDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
    setCustomTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  };

  const handleSave = async () => {
    if (!enabled) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave({
        bookmarkId,
        bookmarkTitle,
        bookmarkUrl,
        note: note.trim() || undefined,
        reminderAt: selectedPreset === "custom" ? reminderAt : applyQuickPreset(selectedPreset),
        dateOnly,
        category: category || undefined,
        priority,
        repeat: repeatType === "none" ? defaultRepeatRule() : { type: repeatType as "daily" | "weekly" | "monthly" },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div
        className="bookmarks-modal reminder-modal"
        style={themeCssVars}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="reminder-modal-title"
      >
        <div className="reminder-modal__header">
          <h3 id="reminder-modal-title">{t("bookmarks.reminder.setReminder")}</h3>
          <button type="button" className="reminder-modal__close" onClick={onClose} aria-label={t("bookmarks.cancel")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="reminder-modal__bookmark-title">{bookmarkTitle}</p>

        <label className="reminder-modal__toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>{t("bookmarks.reminder.enableReminder")}</span>
        </label>

        {enabled && (
          <>
            <fieldset className="reminder-modal__section">
              <legend>{t("bookmarks.reminder.when")}</legend>
              <div className="reminder-modal__presets">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`reminder-modal__preset${selectedPreset === preset ? " reminder-modal__preset--active" : ""}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {t(`bookmarks.reminder.presets.${preset}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="reminder-modal__datetime">
              <label className="reminder-modal__field" style={{ marginBottom: 0, flex: 1 }}>
                <span>{t("bookmarks.reminder.date")}</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setSelectedPreset("custom");
                    setCustomDate(e.target.value);
                  }}
                />
              </label>
              {!dateOnly && (
                <label className="reminder-modal__field" style={{ marginBottom: 0, flex: 1 }}>
                  <span>{t("bookmarks.reminder.time")}</span>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => {
                      setSelectedPreset("custom");
                      setCustomTime(e.target.value);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="reminder-modal__row">
              <label className="reminder-modal__toggle">
                <input type="checkbox" checked={dateOnly} onChange={(e) => setDateOnly(e.target.checked)} />
                <span>{t("bookmarks.reminder.dateOnly")}</span>
              </label>
            </div>

            <label className="reminder-modal__field">
              <span>{t("bookmarks.reminder.note")}</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("bookmarks.reminder.notePlaceholder")}
                rows={2}
              />
            </label>

            <div className="reminder-modal__row reminder-modal__row--split">
              <label className="reminder-modal__field">
                <span>{t("bookmarks.reminder.category")}</span>
                <select value={category} onChange={(e) => setCategory(e.target.value as ReminderCategory | "")}>
                  <option value="">{t("bookmarks.reminder.noCategory")}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`bookmarks.reminder.categories.${cat}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="reminder-modal__field">
                <span>{t("bookmarks.reminder.priority")}</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value as ReminderPriority)}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`bookmarks.reminder.priorities.${p}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {settings.enableRecurring && (
              <label className="reminder-modal__field">
                <span>{t("bookmarks.reminder.repeat")}</span>
                <select value={repeatType} onChange={(e) => setRepeatType(e.target.value)}>
                  <option value="none">{t("bookmarks.reminder.repeatNone")}</option>
                  <option value="daily">{t("bookmarks.reminder.repeatDaily")}</option>
                  <option value="weekly">{t("bookmarks.reminder.repeatWeekly")}</option>
                  <option value="monthly">{t("bookmarks.reminder.repeatMonthly")}</option>
                </select>
              </label>
            )}
          </>
        )}

        <div className="reminder-modal__actions">
          <button type="button" className="reminder-modal__btn reminder-modal__btn--secondary" onClick={onClose}>
            {t("bookmarks.cancel")}
          </button>
          <button type="button" className="reminder-modal__btn reminder-modal__btn--primary" onClick={handleSave} disabled={saving}>
            {existing ? t("bookmarks.reminder.save") : t("bookmarks.reminder.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
