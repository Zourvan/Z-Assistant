import { useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import { useI18n } from "../../../i18n/LanguageProvider";
import { useCalendar } from "../../Settings";
import { buildThemeCssVars } from "../../settings/themeUtils";
import { BookmarkFavicon } from "../BookmarkFavicon";
import { BookmarkReminderModal } from "./BookmarkReminderModal";
import { BookmarkTreePicker, type PickedBookmark } from "./BookmarkTreePicker";
import { SnoozeModal } from "./SnoozeModal";
import { useReminders } from "./RemindersContext";
import { getReminderSettings } from "./reminderSettings";
import type { BookmarkReminder, ReminderFilter, ReminderManagerView, ReminderSort } from "./types";
import {
  computeReminderStatus,
  filterReminders,
  formatReminderDate,
  getEffectiveReminderAt,
  getTimelineBucket,
  searchReminders,
  sortReminders,
} from "./reminderUtils";
import "./ReminderManager.css";

interface ReminderManagerProps {
  onClose: () => void;
}

const TIMELINE_BUCKETS = ["overdue", "today", "tomorrow", "this_week", "next_week", "later"] as const;

export function ReminderManager({ onClose }: ReminderManagerProps) {
  const { t, language } = useI18n();
  const { calendarType, textColor, backgroundColor } = useCalendar();
  const themeCssVars = buildThemeCssVars(textColor, backgroundColor);
  const settings = getReminderSettings();
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    openReminderBookmark,
    getRemindersForDate,
  } = useReminders();

  const [view, setView] = useState<ReminderManagerView>("list");
  const [filter, setFilter] = useState<ReminderFilter>("all");
  const [sort, setSort] = useState<ReminderSort>("reminderDate");
  const [search, setSearch] = useState("");
  const [editingReminder, setEditingReminder] = useState<BookmarkReminder | null>(null);
  const [creatingFor, setCreatingFor] = useState<PickedBookmark | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const dateLib = calendarType === "gregorian" ? dateFns : dateFnsJalali;

  const filteredReminders = useMemo(() => {
    let result = filterReminders(reminders, filter);
    result = searchReminders(result, search);
    return sortReminders(result, sort);
  }, [reminders, filter, search, sort]);

  const renderStatusBadge = (reminder: BookmarkReminder) => {
    const status = computeReminderStatus(reminder);
    return <span className={`reminder-status reminder-status--${status}`}>{t(`bookmarks.reminder.status.${status}`)}</span>;
  };

  const renderReminderActions = (reminder: BookmarkReminder) => (
    <div className="reminder-item__actions">
      <button type="button" title={t("bookmarks.reminder.open")} onClick={() => openReminderBookmark(reminder.id)}>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      <button type="button" title={t("bookmarks.reminder.edit")} onClick={() => setEditingReminder(reminder)}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button type="button" title={t("bookmarks.reminder.snooze")} onClick={() => setSnoozingId(reminder.id)}>
        <Clock className="w-3.5 h-3.5" />
      </button>
      <button type="button" title={t("bookmarks.reminder.complete")} onClick={() => completeReminder(reminder.id)}>
        <Check className="w-3.5 h-3.5" />
      </button>
      <button type="button" title={t("bookmarks.reminder.delete")} onClick={() => deleteReminder(reminder.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderReminderRow = (reminder: BookmarkReminder) => (
    <div key={reminder.id} className="reminder-item">
      <BookmarkFavicon url={reminder.bookmarkUrl} size={24} className="reminder-item__favicon" />
      <div className="reminder-item__body">
        <div className="reminder-item__title-row">
          <span className="reminder-item__title">{reminder.bookmarkTitle}</span>
          {renderStatusBadge(reminder)}
          {reminder.priority !== "medium" && (
            <span className={`reminder-priority reminder-priority--${reminder.priority}`}>
              {t(`bookmarks.reminder.priorities.${reminder.priority}`)}
            </span>
          )}
        </div>
        {reminder.bookmarkUrl && <span className="reminder-item__url">{reminder.bookmarkUrl}</span>}
        {reminder.note && <p className="reminder-item__note">{reminder.note}</p>}
        <span className="reminder-item__date">
          {formatReminderDate(getEffectiveReminderAt(reminder), reminder.dateOnly, settings.timeFormat12h, language)}
        </span>
      </div>
      {renderReminderActions(reminder)}
    </div>
  );

  const renderListView = () => (
    <div className="reminder-manager__list">
      {filteredReminders.length === 0 ? (
        <p className="reminder-manager__empty">{t("bookmarks.reminder.empty")}</p>
      ) : (
        filteredReminders.map(renderReminderRow)
      )}
    </div>
  );

  const renderTimelineView = () => {
    const buckets = TIMELINE_BUCKETS.map((bucket) => ({
      bucket,
      items: sortReminders(
        filteredReminders.filter((r) => getTimelineBucket(r) === bucket),
        sort,
      ),
    })).filter((b) => b.items.length > 0);

    return (
      <div className="reminder-manager__timeline">
        {buckets.length === 0 ? (
          <p className="reminder-manager__empty">{t("bookmarks.reminder.empty")}</p>
        ) : (
          buckets.map(({ bucket, items }) => (
            <section key={bucket} className="reminder-timeline-section">
              <h4>{t(`bookmarks.reminder.timeline.${bucket}`)}</h4>
              {items.map(renderReminderRow)}
            </section>
          ))
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const daysInMonth = dateLib.getDaysInMonth(calendarDate);
    const firstDay = dateLib.startOfMonth(calendarDate);
    const startWeekday = dateLib.getDay(firstDay);
    const days: (number | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const monthLabel = dateLib.format(calendarDate, "MMMM yyyy");

    return (
      <div className="reminder-manager__calendar">
        <div className="reminder-calendar__nav">
          <button type="button" onClick={() => setCalendarDate(dateLib.subMonths(calendarDate, 1))}>‹</button>
          <span>{monthLabel}</span>
          <button type="button" onClick={() => setCalendarDate(dateLib.addMonths(calendarDate, 1))}>›</button>
        </div>
        <div className="reminder-calendar__grid">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="reminder-calendar__day reminder-calendar__day--empty" />;
            const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayReminders = getRemindersForDate(dateKey);
            const isSelected = selectedDateKey === dateKey;
            return (
              <button
                key={dateKey}
                type="button"
                className={`reminder-calendar__day${dayReminders.length ? " reminder-calendar__day--has" : ""}${isSelected ? " reminder-calendar__day--selected" : ""}`}
                onClick={() => setSelectedDateKey(isSelected ? null : dateKey)}
              >
                <span>{day}</span>
                {dayReminders.length > 0 && <span className="reminder-calendar__dot" />}
              </button>
            );
          })}
        </div>
        {selectedDateKey && (
          <div className="reminder-calendar__day-detail">
            <h4>{selectedDateKey}</h4>
            {getRemindersForDate(selectedDateKey).map(renderReminderRow)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div
        className="bookmarks-modal reminder-manager"
        style={themeCssVars}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="reminder-manager__header">
          <div className="reminder-manager__title-row">
            <Bell className="w-5 h-5" />
            <h3>{t("bookmarks.reminder.managerTitle")}</h3>
          </div>
          <button type="button" className="reminder-manager__add" onClick={() => setIsPickerOpen(true)}>
            <Plus className="w-4 h-4" />
            {t("bookmarks.reminder.addForAny")}
          </button>
          <button type="button" className="reminder-modal__close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="reminder-manager__toolbar">
          <div className="reminder-manager__search">
            <Search className="w-4 h-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("bookmarks.reminder.searchPlaceholder")}
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as ReminderFilter)}>
            <option value="all">{t("bookmarks.reminder.filters.all")}</option>
            <option value="today">{t("bookmarks.reminder.filters.today")}</option>
            <option value="upcoming">{t("bookmarks.reminder.filters.upcoming")}</option>
            <option value="overdue">{t("bookmarks.reminder.filters.overdue")}</option>
            <option value="completed">{t("bookmarks.reminder.filters.completed")}</option>
            <option value="snoozed">{t("bookmarks.reminder.filters.snoozed")}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as ReminderSort)}>
            <option value="reminderDate">{t("bookmarks.reminder.sort.reminderDate")}</option>
            <option value="createdAt">{t("bookmarks.reminder.sort.createdAt")}</option>
            <option value="title">{t("bookmarks.reminder.sort.title")}</option>
            <option value="updatedAt">{t("bookmarks.reminder.sort.updatedAt")}</option>
            <option value="priority">{t("bookmarks.reminder.sort.priority")}</option>
          </select>
        </div>

        <div className="reminder-manager__view-tabs">
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <List className="w-4 h-4" />
            {t("bookmarks.reminder.views.list")}
          </button>
          <button type="button" className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>
            <Calendar className="w-4 h-4" />
            {t("bookmarks.reminder.views.calendar")}
          </button>
          <button type="button" className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>
            <Clock className="w-4 h-4" />
            {t("bookmarks.reminder.views.timeline")}
          </button>
        </div>

        <div className="reminder-manager__content">
          {view === "list" && renderListView()}
          {view === "calendar" && renderCalendarView()}
          {view === "timeline" && renderTimelineView()}
        </div>

        {editingReminder && (
          <BookmarkReminderModal
            bookmarkId={editingReminder.bookmarkId}
            bookmarkTitle={editingReminder.bookmarkTitle}
            bookmarkUrl={editingReminder.bookmarkUrl}
            existing={editingReminder}
            onSave={async (input) => {
              await updateReminder(editingReminder.id, {
                ...input,
                updatedAt: Date.now(),
              });
            }}
            onClose={() => setEditingReminder(null)}
          />
        )}

        {creatingFor && (
          <BookmarkReminderModal
            bookmarkId={creatingFor.id}
            bookmarkTitle={creatingFor.title}
            bookmarkUrl={creatingFor.url}
            onSave={addReminder}
            onClose={() => setCreatingFor(null)}
          />
        )}

        {isPickerOpen && (
          <BookmarkTreePicker
            onPick={(item) => {
              setIsPickerOpen(false);
              setCreatingFor(item);
            }}
            onClose={() => setIsPickerOpen(false)}
          />
        )}

        {snoozingId && (
          <SnoozeModal
            onSnooze={(until) => snoozeReminder(snoozingId, until)}
            onClose={() => setSnoozingId(null)}
          />
        )}
      </div>
    </div>
  );
}
