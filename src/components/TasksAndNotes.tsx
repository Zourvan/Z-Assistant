import { useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  ListTodo,
  Plus,
  StickyNote,
  X,
} from "lucide-react";
import { useCalendar } from "./Settings";
import { useI18n } from "../i18n/LanguageProvider";
import { useTasks } from "./tasks/TasksContext";
import type { Task, TaskFilter, TaskType } from "./tasks/types";
import {
  formatDueDate,
  formatTaskDate,
  isPersianText,
  NOTE_COLORS,
  TODO_EMOJIS,
} from "./tasks/taskUtils";
import "./TasksAndNotes.css";

const FILTERS: { id: TaskFilter; icon: typeof ListTodo }[] = [
  { id: "all", icon: StickyNote },
  { id: "todo", icon: ListTodo },
  { id: "note", icon: BookOpen },
  { id: "scheduled", icon: Calendar },
];

export function TasksAndNotes() {
  const { calendarType, textColor, backgroundColor } = useCalendar();
  const { t, dir } = useI18n();
  const { tasks, addTask, updateTask, deleteTask, toggleTodo } = useTasks();

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<TaskType>("todo");
  const [newEmoji, setNewEmoji] = useState<string>(TODO_EMOJIS[0]);
  const [newColor, setNewColor] = useState<string>(NOTE_COLORS[0].value);
  const [newDueDate, setNewDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ text: string; dueDate: string; emoji: string; color: string } | null>(
    null,
  );

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (filter === "todo") list = list.filter((t) => t.taskType === "todo");
    else if (filter === "note") list = list.filter((t) => t.taskType === "note");
    else if (filter === "scheduled") list = list.filter((t) => t.dueDate);

    return list.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.taskType === "todo").length,
      note: tasks.filter((t) => t.taskType === "note").length,
      scheduled: tasks.filter((t) => t.dueDate).length,
    }),
    [tasks],
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    await addTask({
      text: newText,
      taskType: newType,
      color: newColor,
      emoji: newEmoji,
      dueDate: newDueDate || undefined,
    });

    setNewText("");
    setNewDueDate("");
    setNewType("todo");
    setNewEmoji(TODO_EMOJIS[0]);
    setNewColor(NOTE_COLORS[0].value);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditDraft({
      text: task.text,
      dueDate: task.dueDate || "",
      emoji: task.emoji,
      color: task.color,
    });
  };

  const saveEdit = async (task: Task) => {
    if (!editDraft || !editDraft.text.trim()) return;
    await updateTask(task.id, {
      text: editDraft.text.trim(),
      dueDate: editDraft.dueDate || undefined,
      emoji: editDraft.emoji,
      color: editDraft.color,
    });
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <div
      className="tasks-notes backdrop-blur-md rounded-xl shadow-lg overflow-hidden w-full min-w-0"
      style={{ backgroundColor, color: textColor }}
      dir={dir}
    >
      <header className="tasks-notes__header">
        <div className="tasks-notes__title-row">
          <StickyNote className="w-5 h-5 shrink-0" />
          <h2 className="tasks-notes__title">{t("tasks.title")}</h2>
        </div>
        <p className="tasks-notes__hint">{t("tasks.hint")}</p>
      </header>

      <nav className="tasks-notes__filters" aria-label={t("tasks.filters.label")}>
        {FILTERS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tasks-notes__filter ${filter === id ? "active" : ""}`}
            onClick={() => setFilter(id)}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t(`tasks.filters.${id}`)}</span>
            {counts[id] > 0 && <span className="tasks-notes__filter-count">{counts[id]}</span>}
          </button>
        ))}
      </nav>

      <form className="tasks-notes__form" onSubmit={handleAdd}>
        <div className="tasks-notes__form-top">
          <div className="tasks-notes__type-toggle">
            <button
              type="button"
              className={newType === "todo" ? "active" : ""}
              onClick={() => setNewType("todo")}
            >
              <ListTodo className="w-4 h-4" />
              {t("tasks.types.todo")}
            </button>
            <button
              type="button"
              className={newType === "note" ? "active" : ""}
              onClick={() => setNewType("note")}
            >
              <BookOpen className="w-4 h-4" />
              {t("tasks.types.note")}
            </button>
          </div>

          <label className="tasks-notes__date-field">
            <Calendar className="w-4 h-4 shrink-0 opacity-70" />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              aria-label={t("tasks.dueDate")}
            />
          </label>
        </div>

        {newType === "todo" ? (
          <div className="tasks-notes__emoji-row">
            {TODO_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`tasks-notes__emoji-btn ${newEmoji === emoji ? "active" : ""}`}
                onClick={() => setNewEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="tasks-notes__color-row">
            {NOTE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`tasks-notes__color-btn ${newColor === color.value ? "active" : ""}`}
                style={{ backgroundColor: color.value }}
                onClick={() => setNewColor(color.value)}
                aria-label={color.label}
              />
            ))}
          </div>
        )}

        <div className="tasks-notes__input-row">
          {newType === "note" ? (
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={t("tasks.placeholders.note")}
              className={`tasks-notes__textarea ${isPersianText(newText) ? "rtl" : "ltr"}`}
              rows={2}
            />
          ) : (
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={t("tasks.placeholders.todo")}
              className={`tasks-notes__input ${isPersianText(newText) ? "rtl" : "ltr"}`}
            />
          )}
          <button type="submit" className="tasks-notes__add-btn" disabled={!newText.trim()} aria-label={t("tasks.add")}>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="tasks-notes__list custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <p className="tasks-notes__empty">{t("tasks.empty")}</p>
        ) : (
          filteredTasks.map((task) => (
            <article
              key={task.id}
              className={`tasks-notes__item tasks-notes__item--${task.taskType}`}
              style={task.taskType === "note" ? { backgroundColor: task.color } : undefined}
            >
              {editingId === task.id && editDraft ? (
                <div className="tasks-notes__edit">
                  {task.taskType === "todo" ? (
                    <input
                      type="text"
                      value={editDraft.text}
                      onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                      className={`tasks-notes__edit-input ${isPersianText(editDraft.text) ? "rtl" : "ltr"}`}
                      autoFocus
                    />
                  ) : (
                    <textarea
                      value={editDraft.text}
                      onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                      className={`tasks-notes__edit-textarea ${isPersianText(editDraft.text) ? "rtl" : "ltr"}`}
                      rows={3}
                      autoFocus
                    />
                  )}

                  <div className="tasks-notes__edit-meta">
                    <label className="tasks-notes__date-field tasks-notes__date-field--sm">
                      <Calendar className="w-3.5 h-3.5" />
                      <input
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(e) => setEditDraft({ ...editDraft, dueDate: e.target.value })}
                      />
                    </label>
                    {task.taskType === "todo" ? (
                      <div className="tasks-notes__emoji-row tasks-notes__emoji-row--sm">
                        {TODO_EMOJIS.slice(0, 5).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`tasks-notes__emoji-btn ${editDraft.emoji === emoji ? "active" : ""}`}
                            onClick={() => setEditDraft({ ...editDraft, emoji })}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="tasks-notes__color-row">
                        {NOTE_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`tasks-notes__color-btn ${editDraft.color === color.value ? "active" : ""}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setEditDraft({ ...editDraft, color: color.value })}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="tasks-notes__edit-actions">
                    <button type="button" onClick={() => setEditingId(null)}>
                      {t("tasks.cancel")}
                    </button>
                    <button type="button" className="primary" onClick={() => saveEdit(task)}>
                      {t("tasks.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="tasks-notes__item-body">
                    {task.taskType === "todo" ? (
                      <button
                        type="button"
                        className="tasks-notes__check"
                        onClick={() => toggleTodo(task.id)}
                        aria-label={task.completed ? t("tasks.markIncomplete") : t("tasks.markComplete")}
                      >
                        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                    ) : (
                      <BookOpen className="w-4 h-4 shrink-0 opacity-70 mt-0.5" />
                    )}

                    <div className="tasks-notes__item-content">
                      <p
                        className={`tasks-notes__text ${task.completed ? "completed" : ""} ${isPersianText(task.text) ? "rtl" : "ltr"}`}
                      >
                        {task.taskType === "todo" && <span className="tasks-notes__emoji">{task.emoji}</span>}
                        {task.text}
                      </p>
                      <div className="tasks-notes__meta">
                        {task.dueDate && (
                          <span className="tasks-notes__due-badge">
                            <Calendar className="w-3 h-3" />
                            {formatDueDate(task.dueDate, calendarType)}
                          </span>
                        )}
                        {task.taskType === "note" && (
                          <span className="tasks-notes__created">{formatTaskDate(task.createdAt, calendarType)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="tasks-notes__item-actions">
                    <button type="button" onClick={() => startEdit(task)} aria-label={t("tasks.edit")}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteTask(task.id)} aria-label={t("tasks.delete")}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
