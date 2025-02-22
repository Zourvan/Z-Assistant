import React, { useState, useEffect } from "react";
import Select, { StylesConfig } from "react-select";
import { CheckCircle2, Circle, Plus, X, Edit2 } from "lucide-react";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import "./TodoList.css";

// تنظیمات IndexedDB برای مدیریت تسک‌ها
const todosDB = createDatabase({
  dbName: "todosManagerDB",
  storeName: "todos",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "completed", keyPath: "completed", unique: false }],
});

interface EmojiOption {
  value: string;
  label: string;
  color: string;
}

const emojiOptions: EmojiOption[] = [
  { value: "🚀", label: "🚀", color: "rgba(76, 175, 80, 0.7)" },
  { value: "🔥", label: "🔥", color: "rgba(244, 67, 54, 0.7)" },
  { value: "🧩", label: "🧩", color: "rgba(255, 193, 7, 0.7)" },
  { value: "✨", label: "✨", color: "rgba(33, 150, 243, 0.7)" },
  { value: "📅", label: "📅", color: "rgba(156, 39, 176, 0.7)" },
];

const customStyles: StylesConfig<EmojiOption, false> = {
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
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
};

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  emoji: string;
}

interface EditingTodo {
  id: string;
  text: string;
  emoji: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newEmoji, setNewEmoji] = useState("🚀");
  const [editingTodo, setEditingTodo] = useState<EditingTodo | null>(null);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await todosDB.getAllItems<Todo>();
        setTodos(storedTodos);
      } catch (error) {
        console.error("Failed to load todos:", error);
      }
    };

    loadTodos();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const newTodoObj: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      emoji: newEmoji,
    };

    try {
      await todosDB.saveItem(newTodoObj);
      setTodos([...todos, newTodoObj]);
      setNewTodo("");
      setNewEmoji("🚀");
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  };

  const toggleTodo = async (id: string) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));

    const updatedTodo = updatedTodos.find((todo) => todo.id === id);

    if (updatedTodo) {
      try {
        await todosDB.saveItem(updatedTodo);
        setTodos(updatedTodos);
      } catch (error) {
        console.error("Failed to update todo:", error);
      }
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await todosDB.deleteItem(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const isPersian = (text: string) => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
  };

  const startEditing = (todo: Todo) => {
    setEditingTodo({ id: todo.id, text: todo.text, emoji: todo.emoji });
  };

  const cancelEditing = () => {
    setEditingTodo(null);
  };

  const saveEditedTodo = async () => {
    if (!editingTodo) return;

    const updatedTodos = todos.map((todo) => (todo.id === editingTodo.id ? { ...todo, text: editingTodo.text, emoji: editingTodo.emoji } : todo));
    const updatedTodo = updatedTodos.find((todo) => todo.id === editingTodo.id);

    if (updatedTodo) {
      try {
        await todosDB.saveItem(updatedTodo);
        setTodos(updatedTodos);
        cancelEditing();
      } catch (error) {
        console.error("Failed to update todo:", error);
      }
    }
  };

  const updateEditingText = (text: string) => {
    if (editingTodo) {
      setEditingTodo({ ...editingTodo, text });
    }
  };

  const updateEditingEmoji = (emoji: string) => {
    if (editingTodo) {
      setEditingTodo({ ...editingTodo, emoji });
    }
  };

  return (
    <div className={` bg-black/20 backdrop-blur-md rounded-xl p-4 overflow-hidden`}>
      <h4 className="text-white text-lg font-medium mb-0.5">Tasks</h4>

      <form onSubmit={addTodo} className="flex flex-wrap gap-2 mb-4 items-center rounded-lg p-2 bg-black/10">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className={`flex-1 min-w-[80px] bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${
            isPersian(newTodo) ? "rtl" : "ltr"
          }`}
        />
        <Select
          className="basic-single"
          classNamePrefix="select"
          defaultValue={emojiOptions[0]}
          isDisabled={false}
          isLoading={false}
          isClearable={false}
          isRtl={false}
          isSearchable={false}
          name="emoji"
          options={emojiOptions}
          menuPortalTarget={document.body}
          menuPosition="absolute"
          menuShouldScrollIntoView={false}
          styles={customStyles}
          onChange={(selectedOption) => {
            if (selectedOption) {
              setNewEmoji(selectedOption.value);
            }
          }}
        />

        <button type="submit" className="bg-black/20 hover:bg-black/30 text-white rounded-lg p-1.5 transition-colors min-w-[30px]">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-2 max-h-[10vw] overflow-y-auto custom-scrollbar">
        {todos.map((todo) => (
          <div key={todo.id} className={`flex items-center gap-2 rounded-lg p-2 ${todo.completed ? "bg-green-500/10" : "bg-white/10"}`}>
            {editingTodo?.id !== todo.id && (
              <button onClick={() => toggleTodo(todo.id)} className="text-white hover:text-white/80 transition-colors">
                {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
            )}

            {editingTodo?.id === todo.id ? (
              <>
                <Select
                  className="basic-single"
                  classNamePrefix="select"
                  defaultValue={emojiOptions.find((option) => option.value === editingTodo.emoji)}
                  isDisabled={false}
                  isLoading={false}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={false}
                  name="emoji"
                  options={emojiOptions}
                  menuPortalTarget={document.body}
                  menuPosition="absolute"
                  menuShouldScrollIntoView={false}
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      updateEditingEmoji(selectedOption.value);
                    }
                  }}
                />
                <input
                  type="text"
                  value={editingTodo.text}
                  onChange={(e) => updateEditingText(e.target.value)}
                  className={`flex-1 bg-black/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    isPersian(editingTodo.text) ? "rtl" : "ltr"
                  }`}
                />
                <button onClick={saveEditedTodo} className="text-white hover:text-green-500 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button onClick={cancelEditing} className="text-white hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-white ${todo.completed ? "line-through opacity-50" : ""} ${isPersian(todo.text) ? "rtl" : "ltr"}`}>
                  {todo.emoji} {todo.text}
                </span>
                <button onClick={() => startEditing(todo)} className="text-white hover:text-blue-400 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button onClick={() => deleteTodo(todo.id)} className="text-white hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
