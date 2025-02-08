import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

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
      },
    ]);
    setNewTodo('');
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

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4">
      <h2 className="text-white text-lg font-medium mb-4">Tasks</h2>
      
      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="submit"
          className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2 bg-white/10 rounded-lg p-2 group"
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
              className={`flex-1 text-white ${
                todo.completed ? 'line-through opacity-50' : ''
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}