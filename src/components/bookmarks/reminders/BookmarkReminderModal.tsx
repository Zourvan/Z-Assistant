import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import { getReminderSettings } from "./reminderSettings";
import type { BookmarkReminder, QuickPreset, ReminderCategory, ReminderInput, ReminderPriority } from "./types";
import { applyQuickPreset, defaultRepeatRule } from "./reminderUtils";
import { ThemedDateTimeFields } from "./ThemedDateTimeFields";
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
  const [selectedAt, setSelectedAt] = useState(() => new Date(existing?.reminderAt ?? applyQuickPreset("tomorrow")));
  const [note, setNote] = useState(existing?.note ?? "");
  const [category, setCategory] = useState<ReminderCategory | "">(existing?.category ?? "");
  const [priority, setPriority] = useState<ReminderPriority>(existing?.priority ?? "medium");
  const [repeatType, setRepeatType] = useState(existing?.repeat.type ?? "none");
  const [saving, setSaving] = useState(false);

  const reminderAt = useMemo(() => {
    if (selectedPreset !== "custom") return applyQuickPreset(selectedPreset);
    const next = new Date(selectedAt.getTime());
    if (dateOnly) {
      next.setHours(settings.defaultReminderHour, settings.defaultReminderMinute, 0, 0);
    }
    return next.getTime();
  }, [selectedPreset, selectedAt, dateOnly, settings]);

  const handlePresetClick = (preset: QuickPreset) => {
    setSelectedPreset(preset);
    if (preset === "custom") return;
    setSelectedAt(new Date(applyQuickPreset(preset)));
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
        reminderAt,
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

            <ThemedDateTimeFields
              value={selectedAt}
              dateOnly={dateOnly}
              onChange={(next) => {
                setSelectedPreset("custom");
                setSelectedAt(next);
              }}
            />

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
