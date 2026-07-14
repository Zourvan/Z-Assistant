import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BookOpen, CalendarDays, CheckCircle2, Circle, Edit2, ListTodo, Plus, X } from "lucide-react";
import { useCalendar } from "../Settings";
import { useI18n } from "../../i18n/LanguageProvider";
import { useTasks } from "./TasksContext";
import type { Task, TaskType } from "./types";
import {
  formatDueDate,
  getDayTaskSummary,
  isPersianText,
  NOTE_COLORS,
  TODO_EMOJIS,
  toDateKey,
} from "./taskUtils";
import "./DayDetailModal.css";

interface DayDetailModalProps {
  date: Date;
  onClose: () => void;
}

export function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const { textColor, backgroundColor, calendarType } = useCalendar();
  const { t, dir } = useI18n();
  const { tasks, addTask, updateTask, deleteTask, toggleTodo } = useTasks();

  const dateKey = toDateKey(date);
  const { dayTasks, pendingTodos, notes } = getDayTaskSummary(tasks, dateKey);
  const formattedDate = formatDueDate(dateKey, calendarType);

  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<TaskType>("todo");
  const [newEmoji, setNewEmoji] = useState<string>(TODO_EMOJIS[0]);
  const [newColor, setNewColor] = useState<string>(NOTE_COLORS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    await addTask({
      text: newText,
      taskType: newType,
      color: newColor,
      emoji: newEmoji,
      dueDate: dateKey,
    });
    setNewText("");
    setNewType("todo");
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async (task: Task) => {
    if (!editText.trim()) return;
    await updateTask(task.id, { text: editText.trim() });
    setEditingId(null);
    setEditText("");
  };

  return ReactDOM.createPortal(
    <div className="day-detail-overlay" onClick={onClose}>
      <div
        className="day-detail-modal backdrop-blur-md"
        style={{ backgroundColor, color: textColor }}
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("tasks.dayDetail.title", { date: formattedDate })}
      >
        <header className="day-detail-modal__header">
          <div className="day-detail-modal__title-wrap">
            <CalendarDays className="w-5 h-5 shrink-0 opacity-80" />
            <div>
              <h2 className="day-detail-modal__title">{formattedDate}</h2>
              <p className="day-detail-modal__subtitle">
                {dayTasks.length === 0
                  ? t("tasks.dayDetail.empty")
                  : t("tasks.dayDetail.summary", {
                      todos: pendingTodos.length,
                      notes: notes.length,
                    })}
              </p>
            </div>
          </div>
          <button type="button" className="day-detail-modal__close" onClick={onClose} aria-label={t("tasks.cancel")}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="day-detail-modal__body custom-scrollbar">
          {dayTasks.length === 0 ? (
            <p className="day-detail-modal__empty-hint">{t("tasks.dayDetail.noItems")}</p>
          ) : (
            <ul className="day-detail-modal__list">
              {dayTasks.map((task) => (
                <li
                  key={task.id}
                  className={`day-detail-modal__item day-detail-modal__item--${task.taskType}`}
                  style={task.taskType === "note" ? { backgroundColor: task.color } : undefined}
                >
                  {editingId === task.id ? (
                    <div className="day-detail-modal__edit">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`day-detail-modal__edit-input ${isPersianText(editText) ? "rtl" : "ltr"}`}
                        rows={task.taskType === "note" ? 3 : 1}
                        autoFocus
                      />
                      <div className="day-detail-modal__edit-actions">
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
                      <div className="day-detail-modal__item-main">
                        {task.taskType === "todo" ? (
                          <button
                            type="button"
                            className="day-detail-modal__check"
                            onClick={() => toggleTodo(task.id)}
                            aria-label={task.completed ? t("tasks.markIncomplete") : t("tasks.markComplete")}
                          >
                            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                        ) : (
                          <BookOpen className="w-4 h-4 shrink-0 opacity-70" />
                        )}
                        <span
                          className={`day-detail-modal__text ${task.completed ? "completed" : ""} ${isPersianText(task.text) ? "rtl" : "ltr"}`}
                        >
                          {task.taskType === "todo" && <span className="day-detail-modal__emoji">{task.emoji}</span>}
                          {task.text}
                        </span>
                      </div>
                      <div className="day-detail-modal__item-actions">
                        <button type="button" onClick={() => startEdit(task)} aria-label={t("tasks.edit")}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deleteTask(task.id)} aria-label={t("tasks.delete")}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="day-detail-modal__add" onSubmit={handleAdd}>
          <div className="day-detail-modal__type-toggle">
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

          {newType === "todo" ? (
            <div className="day-detail-modal__emoji-row">
              {TODO_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`day-detail-modal__emoji-btn ${newEmoji === emoji ? "active" : ""}`}
                  onClick={() => setNewEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="day-detail-modal__color-row">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`day-detail-modal__color-btn ${newColor === color.value ? "active" : ""}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setNewColor(color.value)}
                  aria-label={color.label}
                />
              ))}
            </div>
          )}

          <div className="day-detail-modal__add-row">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={newType === "todo" ? t("tasks.placeholders.todoForDay") : t("tasks.placeholders.noteForDay")}
              className={`day-detail-modal__add-input ${isPersianText(newText) ? "rtl" : "ltr"}`}
            />
            <button type="submit" className="day-detail-modal__add-btn" disabled={!newText.trim()}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
