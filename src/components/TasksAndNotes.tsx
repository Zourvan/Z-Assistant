import React, { useState, useEffect } from "react";
import Select, { components, StylesConfig, OptionProps, SingleValueProps } from "react-select";
import { CheckCircle2, Circle, Plus, X, Edit2, BookOpen, ListTodo } from "lucide-react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import { useCalendar } from "./Settings";
import "./Notes.css";
import "./TodoList.css";

// Unified database for tasks (todos and notes)
const tasksDB = createDatabase({
  dbName: "unifiedTasksDB",
  storeName: "tasks",
  version: 1,
  keyPath: "id",
  indexes: [
    { name: "taskType", keyPath: "taskType", unique: false },
    { name: "completed", keyPath: "completed", unique: false },
    { name: "createdAt", keyPath: "createdAt", unique: false },
  ],
});

interface Task {
  id: string;
  text: string;
  taskType: "todo" | "note";
  createdAt: number;
  color: string;
  emoji: string;
  completed?: boolean;
}

interface EditingTask {
  id: string;
  text: string;
  color: string;
  emoji: string;
  taskType: "todo" | "note";
}

// Color options for notes
const colorOptions = [
  { value: "rgba(255, 255, 255, 0.2)", label: "White", color: "rgba(255, 255, 255, 0.2)" },
  { value: "rgba(34, 197, 94, 0.2)", label: "Green", color: "rgba(34, 197, 94, 0.2)" },
  { value: "rgba(59, 130, 246, 0.2)", label: "Blue", color: "rgba(59, 130, 246, 0.2)" },
  { value: "rgba(168, 85, 247, 0.2)", label: "Purple", color: "rgba(168, 85, 247, 0.2)" },
  { value: "rgba(251, 191, 36, 0.2)", label: "Yellow", color: "rgba(251, 191, 36, 0.2)" },
];

// Emoji options for todos
const emojiOptions = [
  { value: "🚀", label: "🚀", color: "rgba(76, 175, 80, 0.7)" },
  { value: "🔥", label: "🔥", color: "rgba(244, 67, 54, 0.7)" },
  { value: "🧩", label: "🧩", color: "rgba(255, 193, 7, 0.7)" },
  { value: "✨", label: "✨", color: "rgba(33, 150, 243, 0.7)" },
  { value: "📅", label: "📅", color: "rgba(156, 39, 176, 0.7)" },
];

// Task type options
const taskTypeOptions = [
  { value: "todo", label: "Todo", icon: ListTodo },
  { value: "note", label: "Note", icon: BookOpen },
];

// Custom component for color option
const ColourOption = (props: OptionProps<{ value: string; label: string; color: string }, false>) => {
  return (
    <components.Option {...props}>
      <div
        style={{
          backgroundColor: props.data.color,
          width: 20,
          height: 20,
          borderRadius: 4,
          margin: "0 auto",
        }}
      ></div>
    </components.Option>
  );
};

// Custom component for color value
const ColourValue = (props: SingleValueProps<{ value: string; label: string; color: string }, false>) => {
  return (
    <components.SingleValue {...props}>
      <div
        style={{
          backgroundColor: props.data.color,
          width: 25,
          height: 25,
          borderRadius: 4,
          margin: "0 auto",
        }}
      ></div>
    </components.SingleValue>
  );
};

// Custom component for task type option
const TaskTypeOption = (props: OptionProps<{ value: string; label: string; icon: any }, false>) => {
  const Icon = props.data.icon;
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{props.data.label}</span>
      </div>
    </components.Option>
  );
};

// Custom component for task type value
const TaskTypeValue = (props: SingleValueProps<{ value: string; label: string; icon: any }, false>) => {
  const Icon = props.data.icon;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{props.data.label}</span>
      </div>
    </components.SingleValue>
  );
};

// Color select styles
const colorSelectStyles: StylesConfig<{ value: string; label: string; color: string }, false> = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    minWidth: "20px",
    width: "20px",
    height: "32px",
    cursor: "pointer",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(0,0,0,0.95)",
    minWidth: "30px",
    width: "30px",
    borderRadius: "4px",
    zIndex: 9999,
    position: "absolute",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    display: "none",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    display: "none",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? state.data.color : "transparent",
    color: state.isFocused ? "#fff" : "#000",
    textAlign: "center",
    padding: "8px 0",
  }),
  input: (provided) => ({
    ...provided,
    opacity: 0,
    position: "absolute",
    width: 0,
    height: 0,
    padding: 0,
  }),
};

// Emoji select styles
const emojiSelectStyles: StylesConfig<{ value: string; label: string; color: string }, false> = {
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
  }),
  option: (provided, state) => ({
    ...provided,
    color: "white",
    backgroundColor: state.isFocused ? "rgba(255, 255, 255, 0.2)" : "transparent",
  }),
  control: (provided) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    color: "white",
    display: "flex",
    minWidth: "60px",
    width: "60px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
};

// Task type select styles
const taskTypeSelectStyles: StylesConfig<{ value: string; label: string; icon: any }, false> = {
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
  }),
  option: (provided, state) => ({
    ...provided,
    color: "white",
    backgroundColor: state.isFocused ? "rgba(255, 255, 255, 0.2)" : "transparent",
  }),
  control: (provided) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    color: "white",
    display: "flex",
    minWidth: "120px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
};

export function TasksAndNotes() {
  const { calendarType, textColor, backgroundColor } = useCalendar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(colorOptions[0]);
  const [newEmoji, setNewEmoji] = useState(emojiOptions[0]);
  const [newTaskType, setNewTaskType] = useState(taskTypeOptions[0]);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await tasksDB.getAllItems<Task>();
        setTasks(storedTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    };

    loadTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newTaskObj: Task = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      taskType: newTaskType.value as "todo" | "note",
      createdAt: Date.now(),
      color: newColor.value,
      emoji: newEmoji.value,
      completed: newTaskType.value === "todo" ? false : undefined,
    };

    try {
      await tasksDB.saveItem(newTaskObj);
      setTasks([newTaskObj, ...tasks]);
      setNewText("");
      setNewTaskType(taskTypeOptions[0]);
      setNewColor(colorOptions[0]);
      setNewEmoji(emojiOptions[0]);
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const toggleTodoStatus = async (id: string) => {
    const taskToUpdate = tasks.find((task) => task.id === id);
    if (!taskToUpdate || taskToUpdate.taskType !== "todo") return;

    const updatedTask = { ...taskToUpdate, completed: !taskToUpdate.completed };

    try {
      await tasksDB.saveItem(updatedTask);
      setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksDB.deleteItem(id);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask({
      id: task.id,
      text: task.text,
      color: task.color,
      emoji: task.emoji,
      taskType: task.taskType,
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
  };

  const saveEditedTask = async () => {
    if (!editingTask) return;

    const taskToUpdate = tasks.find((task) => task.id === editingTask.id);
    if (!taskToUpdate) return;

    const updatedTask = {
      ...taskToUpdate,
      text: editingTask.text,
      color: editingTask.color,
      emoji: editingTask.emoji,
      taskType: editingTask.taskType,
    };

    try {
      await tasksDB.saveItem(updatedTask);
      setTasks(tasks.map((task) => (task.id === editingTask.id ? updatedTask : task)));
      cancelEditing();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const isPersian = (text: string) => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (calendarType === "persian") {
      return convertToPersianNumbers(dateFnsJalali.format(date, "dd MMMM"));
    }
    return dateFns.format(date, "dd MMMM");
  };

  function convertToPersianNumbers(input: string): string {
    return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  }

  return (
    <div className="backdrop-blur-md rounded-xl p-4 shadow-lg overflow-hidden" style={{ backgroundColor, color: textColor }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Select
            className="basic-single"
            classNamePrefix="select"
            defaultValue={taskTypeOptions[0]}
            options={taskTypeOptions}
            components={{ Option: TaskTypeOption, SingleValue: TaskTypeValue }}
            menuPortalTarget={document.body}
            menuPosition="absolute"
            styles={taskTypeSelectStyles}
            onChange={(selected) => {
              if (selected) {
                setNewTaskType(selected);
              }
            }}
          />

          {newTaskType.value === "todo" && (
            <Select
              className="basic-single"
              classNamePrefix="select"
              defaultValue={emojiOptions[0]}
              options={emojiOptions}
              menuPortalTarget={document.body}
              menuPosition="absolute"
              menuShouldScrollIntoView={false}
              styles={emojiSelectStyles}
              onChange={(selected) => {
                if (selected) {
                  setNewEmoji(selected);
                }
              }}
            />
          )}

          {newTaskType.value === "note" && (
            <Select
              options={colorOptions}
              value={newColor}
              onChange={(option) => option && setNewColor(option)}
              components={{ Option: ColourOption, SingleValue: ColourValue }}
              styles={{
                ...colorSelectStyles,
                menu: (provided) => ({
                  ...provided,
                  zIndex: 50,
                  backgroundColor: "#121212",
                  width: "auto",
                  minWidth: "100%",
                  boxSizing: "content-box",
                }),
                menuList: (provided) => ({
                  ...provided,
                  backgroundColor: "#121212",
                }),
                menuPortal: (provided) => ({
                  ...provided,
                  zIndex: 9999,
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? "rgba(255, 255, 255, 0.1)" : state.isSelected ? "rgba(255, 255, 255, 0.2)" : "#121212",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                  },
                }),
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "0.5rem",
                  minHeight: "2rem",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                  },
                }),
              }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuPlacement="auto"
            />
          )}

          <button
            onClick={(e) => {
              if (newText.trim()) {
                addTask(e);
              }
            }}
            className="bg-black/20 hover:bg-black/30 text-white rounded-lg p-1.5 transition-colors min-w-[30px]"
            disabled={!newText.trim()}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex mb-4 items-center rounded-lg p-2 bg-black/10">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={newTaskType.value === "todo" ? "Add a new task..." : "Add a note..."}
          className={`flex-1 min-w-[80px] bg-white/20 placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${
            isPersian(newText) ? "rtl" : "ltr"
          }`}
          style={{ color: textColor }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newText.trim()) {
              e.preventDefault();
              addTask(e);
            }
          }}
        />
      </div>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`${
              task.taskType === "todo"
                ? `flex items-center gap-2 rounded-lg p-2 ${task.completed ? "bg-green-500/10" : "bg-white/10"}`
                : `p-3 rounded-lg ${isPersian(task.text) ? "rtl" : "ltr"}`
            }`}
            style={{
              backgroundColor: task.taskType === "note" ? task.color : undefined,
              color: textColor,
            }}
          >
            {editingTask?.id === task.id ? (
              // Editing mode
              <div className={task.taskType === "note" ? "flex flex-col w-full" : "flex items-center gap-2 w-full"}>
                {task.taskType === "todo" && (
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    defaultValue={emojiOptions.find((option) => option.value === editingTask.emoji) || emojiOptions[0]}
                    options={emojiOptions}
                    menuPortalTarget={document.body}
                    menuPosition="absolute"
                    menuShouldScrollIntoView={false}
                    styles={emojiSelectStyles}
                    onChange={(selected) => {
                      if (selected && editingTask) {
                        setEditingTask({ ...editingTask, emoji: selected.value });
                      }
                    }}
                  />
                )}

                {task.taskType === "note" ? (
                  <textarea
                    value={editingTask.text}
                    onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                    className="w-full px-2 py-1 bg-white/20 rounded-lg focus:outline-none resize-none"
                    rows={3}
                    style={{ color: textColor }}
                  />
                ) : (
                  <input
                    type="text"
                    value={editingTask.text}
                    onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                    className={`flex-1 bg-black/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      isPersian(editingTask.text) ? "rtl" : "ltr"
                    }`}
                    style={{ color: textColor }}
                  />
                )}

                {task.taskType === "note" && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <Select
                        options={colorOptions}
                        value={colorOptions.find((option) => option.value === editingTask.color) || colorOptions[0]}
                        onChange={(option) => option && setEditingTask({ ...editingTask, color: option.value })}
                        components={{ Option: ColourOption, SingleValue: ColourValue }}
                        styles={colorSelectStyles}
                        menuPortalTarget={document.body}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={cancelEditing} className="p-1 bg-white/20 hover:bg-white/30 rounded-md">
                        <X className="w-4 h-4" style={{ color: textColor }} />
                      </button>
                      <button onClick={saveEditedTask} className="p-1 bg-white/20 hover:bg-white/30 rounded-md">
                        <CheckCircle2 className="w-4 h-4" style={{ color: textColor }} />
                      </button>
                    </div>
                  </div>
                )}

                {task.taskType === "todo" && (
                  <>
                    <button onClick={saveEditedTask} className="text-white hover:text-green-500 transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEditing} className="text-white hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : // Display mode
            task.taskType === "todo" ? (
              // Todo display
              <>
                <button onClick={() => toggleTodoStatus(task.id)} className="text-white hover:text-white/80 transition-colors">
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span
                  className={`flex-1 text-white ${task.completed ? "line-through opacity-50" : ""} ${isPersian(task.text) ? "rtl" : "ltr"}`}
                  style={{ color: textColor }}
                >
                  {task.emoji} {task.text}
                </span>
                <button onClick={() => startEditing(task)} className="text-white hover:text-blue-400 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTask(task.id)} className="text-white hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              // Note display
              <div className="flex justify-between gap-2">
                <div className="flex flex-col flex-1">
                  <p className="break-words">{task.text}</p>
                  <span className="text-xs opacity-70 mt-1">{formatDate(task.createdAt)}</span>
                </div>
                <div className="flex flex-col gap-2 items-start shrink-0">
                  <button onClick={() => startEditing(task)} className="p-1 bg-white/20 hover:bg-white/30 rounded-md">
                    <Edit2 className="w-3.5 h-3.5" style={{ color: textColor }} />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="p-1 bg-white/20 hover:bg-white/30 rounded-md">
                    <X className="w-3.5 h-3.5" style={{ color: textColor }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
