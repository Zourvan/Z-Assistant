import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, X } from 'lucide-react';
import './TodoList.css'

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  emoji: string; // اضافه کردن فیلد اموجی
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newEmoji, setNewEmoji] = useState('😊'); // اموجی پیش‌فرض

  useEffect(() => {
    chrome.storage.sync.get(['todos'], (result) => {
      if (result.todos) {
        setTodos(result.todos);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.sync.set({ todos });
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setTodos([
      ...todos,
      {
        id: crypto.randomUUID(),
        text: newTodo.trim(),
        completed: false,
        emoji: newEmoji, // ذخیره اموجی
      },
    ]);
    setNewTodo('');
    setNewEmoji('😊'); // بازنشانی اموجی
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const isPersian = (text) => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
  };

  return (
    <div className={` bg-white/20 backdrop-blur-md rounded-xl p-4 overflow-hidden`}>
  <h4 className="text-white text-lg font-medium mb-4">Tasks</h4>
  
  <form onSubmit={addTodo} className="flex flex-wrap gap-2 mb-4 items-center rounded-lg p-2 bg-white/10">
    <input
      type="text"
      value={newTodo}
      onChange={(e) => setNewTodo(e.target.value)}
      placeholder="Add a new task..."
      className={`flex-1 min-w-[80px] bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 ${isPersian(newTodo) ? 'rtl' : 'ltr'}`}
    />
    <select
      value={newEmoji}
      onChange={(e) => setNewEmoji(e.target.value)}
      className="bg-white/20 text-white rounded-lg px-3 py-1.5 min-w-[30px]"
    >
      <option value="😊">😊</option>
      <option value="😢">😢</option>
      <option value="😡">😡</option>
      <option value="🎉">🎉</option>
    </select>
    <button
      type="submit"
      className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 transition-colors min-w-[30px]"
    >
      <Plus className="w-5 h-5" />
    </button>
  </form>

  <div className="space-y-2 max-h-[10vw] overflow-y-auto">
    {todos.map((todo) => (
      <div
        key={todo.id}
        className={`flex items-center gap-2 rounded-lg p-2 ${todo.completed ? 'bg-green-500/10' : 'bg-white/10'}`}
      >
        <button
          onClick={() => toggleTodo(todo.id)}
          className="text-white hover:text-white/80 transition-colors"
        >
          {todo.completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
        <span
          className={`flex-1 text-white ${todo.completed ? 'line-through opacity-50' : ''} ${isPersian(todo.text) ? 'rtl' : 'ltr'}`}
        >
          {todo.emoji} {todo.text}
        </span>
        <button
          onClick={() => deleteTodo(todo.id)}
          className="text-white group-hover:opacity-50 hover:text-red-400 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
</div>
  );
}
