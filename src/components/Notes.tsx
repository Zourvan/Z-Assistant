import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import * as dateFns from 'date-fns';
import * as dateFnsJalali from 'date-fns-jalali';
import { useCalendar } from './Calendar';

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface NotesProps {
  calendarType: 'gregorian' | 'persian';
}

export function Notes({  }: NotesProps) {
    const { calendarType } = useCalendar();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['notes'], (result) => {
      if (result.notes) {
        setNotes(result.notes);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.sync.set({ notes });
  }, [notes]);

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNotes([
      {
        id: crypto.randomUUID(),
        text: newNote.trim(),
        createdAt: Date.now(),
      },
      ...notes,
    ]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (calendarType === 'persian') {
      return dateFnsJalali.format(date, 'dd MMMM yyyy');
    }
    return dateFns.format(date, 'dd MMMM yyyy');
  };

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4">
      <h2 className="text-white text-lg font-medium mb-4">Notes</h2>
      
      <form onSubmit={addNote} className="mb-4">
        <div className="flex gap-2 mb-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[80px] resize-none"
          />
          <button
            type="submit"
            className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 h-fit transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white/10 rounded-lg p-3 group relative"
            style={{ 
              fontFamily: calendarType === 'persian' ? 'Vazirmatn, sans-serif' : 'inherit'
            }}
          >
            <div className="text-white whitespace-pre-wrap break-words">
              {note.text}
            </div>
            <div className="text-white/50 text-sm mt-2">
              {formatDate(note.createdAt)}
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}