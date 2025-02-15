import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, X } from "lucide-react";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import "./TodoList.css";

// تنظیمات IndexedDB برای مدیریت تسک‌ها
const todosDB = createDatabase({
  dbName: "todosManagerDB",
  storeName: "todos",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "completed", keyPath: "completed", unique: false }] // ایندکس برای حالت کامل یا ناتمام
});

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  emoji: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]); // ذخیره لیست تسک‌ها
  const [newTodo, setNewTodo] = useState(""); // تسک جدید
  const [newEmoji, setNewEmoji] = useState("😊"); // اموجی پیش‌فرض

  // بارگذاری تسک‌ها از IndexedDB هنگام بارگذاری کامپوننت
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await todosDB.getAllItems<Todo>(); // دریافت لیست تسک‌ها
        setTodos(storedTodos);
      } catch (error) {
        console.error("Failed to load todos:", error);
      }
    };

    loadTodos();
  }, []);

  // افزودن تسک جدید
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault(); // جلوگیری از پیش‌فرض فرم
    if (!newTodo.trim()) return;

    const newTodoObj: Todo = {
      id: crypto.randomUUID(),
      text: newTodo.trim(),
      completed: false,
      emoji: newEmoji
    };

    try {
      await todosDB.saveItem(newTodoObj); // ذخیره تسک در IndexedDB
      setTodos([...todos, newTodoObj]); // افزودن به لیست محلی
      setNewTodo(""); // پاک کردن ورودی
      setNewEmoji("😊"); // بازنشانی اموجی
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  };

  // تغییر وضعیت یک تسک (کامل یا ناتمام)
  const toggleTodo = async (id: string) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));

    const updatedTodo = updatedTodos.find((todo) => todo.id === id);

    if (updatedTodo) {
      try {
        await todosDB.saveItem(updatedTodo); // به‌روزرسانی تسک در IndexedDB
        setTodos(updatedTodos); // به‌روزرسانی لیست محلی
      } catch (error) {
        console.error("Failed to update todo:", error);
      }
    }
  };

  // حذف تسک
  const deleteTodo = async (id: string) => {
    try {
      await todosDB.deleteItem(id); // حذف تسک از IndexedDB
      setTodos(todos.filter((todo) => todo.id !== id)); // حذف از لیست محلی
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // تشخیص متن فارسی
  const isPersian = (text: string) => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
  };

  return (
    <div className={` bg-white/20 backdrop-blur-md rounded-xl p-4 overflow-hidden`}>
      <h4 className="text-white text-lg font-medium mb-4">Tasks</h4>

      {/* فرم افزودن تسک */}
      <form onSubmit={addTodo} className="flex flex-wrap gap-2 mb-4 items-center rounded-lg p-2 bg-white/10">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className={`flex-1 min-w-[80px] bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${
            isPersian(newTodo) ? "rtl" : "ltr"
          }`}
        />
        <select value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="bg-white/20 text-white rounded-lg px-3 py-1.5 min-w-[30px]">
          <option value="😊">😊</option>
          <option value="😢">😢</option>
          <option value="😡">😡</option>
          <option value="🎉">🎉</option>
        </select>
        <button type="submit" className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 transition-colors min-w-[30px]">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* لیست تسک‌ها */}
      <div className="space-y-2 max-h-[10vw] overflow-y-auto">
        {todos.map((todo) => (
          <div key={todo.id} className={`flex items-center gap-2 rounded-lg p-2 ${todo.completed ? "bg-green-500/10" : "bg-white/10"}`}>
            <button onClick={() => toggleTodo(todo.id)} className="text-white hover:text-white/80 transition-colors">
              {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>
            <span className={`flex-1 text-white ${todo.completed ? "line-through opacity-50" : ""} ${isPersian(todo.text) ? "rtl" : "ltr"}`}>
              {todo.emoji} {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="text-white group-hover:opacity-50 hover:text-red-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
