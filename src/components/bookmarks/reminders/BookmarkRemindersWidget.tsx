import { useMemo, useState } from "react";
import { Bell, Check, Clock, ExternalLink } from "lucide-react";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import { BookmarkFavicon } from "../BookmarkFavicon";
import { SnoozeModal } from "./SnoozeModal";
import { useReminders } from "./RemindersContext";
import { getReminderSettings } from "./reminderSettings";
import {
  computeReminderStatus,
  formatReminderDate,
  getEffectiveReminderAt,
} from "./reminderUtils";
import "./BookmarkRemindersWidget.css";

export function BookmarkRemindersWidget() {
  const { t, language } = useI18n();
  const { textColor, backgroundColor } = useCalendar();
  const themeCssVars = buildThemeCssVars(textColor, backgroundColor);
  const settings = getReminderSettings();
  const { activeReminders, openReminderBookmark, completeReminder, snoozeReminder } = useReminders();
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  const { today, upcoming, overdue } = useMemo(() => {
    const todayList: typeof activeReminders = [];
    const upcomingList: typeof activeReminders = [];
    const overdueList: typeof activeReminders = [];

    for (const reminder of activeReminders) {
      const status = computeReminderStatus(reminder);
      if (status === "overdue") overdueList.push(reminder);
      else if (status === "today") todayList.push(reminder);
      else if (status === "upcoming" || status === "pending" || status === "snoozed") upcomingList.push(reminder);
    }

    return {
      today: todayList.slice(0, 3),
      upcoming: upcomingList.slice(0, 3),
      overdue: overdueList.slice(0, 3),
    };
  }, [activeReminders]);

  const total = today.length + upcoming.length + overdue.length;
  if (total === 0) return null;

  const renderSection = (
    title: string,
    items: typeof activeReminders,
    className: string,
  ) => {
    if (!items.length) return null;
    return (
      <div className={`reminder-widget__section ${className}`}>
        <h4>{title}</h4>
        {items.map((reminder) => (
          <div key={reminder.id} className="reminder-widget__item">
            <BookmarkFavicon url={reminder.bookmarkUrl} size={18} className="reminder-widget__favicon" />
            <div className="reminder-widget__info">
              <span className="reminder-widget__title">{reminder.bookmarkTitle}</span>
              <span className="reminder-widget__time">
                {formatReminderDate(
                  getEffectiveReminderAt(reminder),
                  reminder.dateOnly,
                  settings.timeFormat12h,
                  language,
                )}
              </span>
            </div>
            <div className="reminder-widget__actions">
              <button type="button" title={t("bookmarks.reminder.open")} onClick={() => openReminderBookmark(reminder.id)}>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button type="button" title={t("bookmarks.reminder.snooze")} onClick={() => setSnoozingId(reminder.id)}>
                <Clock className="w-3 h-3" />
              </button>
              <button type="button" title={t("bookmarks.reminder.complete")} onClick={() => completeReminder(reminder.id)}>
                <Check className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="reminder-widget" style={themeCssVars}>
      <div className="reminder-widget__header">
        <Bell className="w-4 h-4" />
        <span>{t("bookmarks.reminder.widgetTitle")}</span>
      </div>
      {renderSection(t("bookmarks.reminder.filters.overdue"), overdue, "reminder-widget__section--overdue")}
      {renderSection(t("bookmarks.reminder.filters.today"), today, "reminder-widget__section--today")}
      {renderSection(t("bookmarks.reminder.filters.upcoming"), upcoming, "reminder-widget__section--upcoming")}

      {snoozingId && (
        <SnoozeModal
          onSnooze={(until) => snoozeReminder(snoozingId, until)}
          onClose={() => setSnoozingId(null)}
        />
      )}
    </div>
  );
}
