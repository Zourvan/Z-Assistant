import React, { useState, useEffect } from "react";
import { Plus, X, Edit2, CheckCircle2 } from "lucide-react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import Select, { components, StylesConfig, OptionProps, SingleValueProps } from "react-select";
import { useCalendar } from "./Settings";
import createDatabase from "./IndexedDatabase/IndexedDatabase";
import "./Notes.css";

const notesDB = createDatabase({
  dbName: "notesManagerDB",
  storeName: "notes",
  version: 1,
  keyPath: "id",
  indexes: [{ name: "createdAt", keyPath: "createdAt", unique: false }],
});

interface Note {
  id: string;
  text: string;
  createdAt: number;
  color: string;
}

interface NotesProps {
  calendarType: "gregorian" | "persian";
}

const colorOptions = [
  { value: "rgba(255, 255, 255, 0.2)", label: "Red", color: "rgba(255, 255, 255, 0.2)" },
  { value: "rgba(34, 197, 94, 0.2)", label: "Green", color: "rgba(34, 197, 94, 0.2)" },
  { value: "rgba(59, 130, 246, 0.2)", label: "Blue", color: "rgba(59, 130, 246, 0.2)" },
  { value: "rgba(168, 85, 247, 0.2)", label: "Purple", color: "rgba(168, 85, 247, 0.2)" },
  { value: "rgba(251, 191, 36, 0.2)", label: "Yellow", color: "rgba(251, 191, 36, 0.2)" },
];

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

const customStyles: StylesConfig<{ value: string; label: string; color: string }, false> = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    minWidth: "30px",
    width: "30px",
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
};

export function Notes({}: NotesProps) {
  const { calendarType, textColor, backgroundColor } = useCalendar();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingColor, setEditingColor] = useState(colorOptions[0]); // New state for editing color
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  useEffect(() => {
    const loadNotes = async () => {
      const storedNotes = await notesDB.getAllItems<Note>();
      setNotes(storedNotes);
    };

    loadNotes();
  }, []);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newNoteObj: Note = {
      id: crypto.randomUUID(),
      text: newNote.trim(),
      createdAt: Date.now(),
      color: selectedColor.value,
    };

    await notesDB.saveItem(newNoteObj);
    setNotes([newNoteObj, ...notes]);
    setNewNote("");
    setSelectedColor(colorOptions[0]);
  };

  const deleteNote = async (id: string) => {
    await notesDB.deleteItem(id);
    setNotes(notes.filter((note) => note.id !== id));
  };

  function convertToPersianNumbers(input: string): string {
    return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (calendarType === "persian") {
      return convertToPersianNumbers(dateFnsJalali.format(date, "dd MMMM"));
    }
    return dateFns.format(date, "dd MMMM");
  };

  const isPersian = (text: string) => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text);
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
    // Set the initial editing color based on the note's current color
    setEditingColor(colorOptions.find((option) => option.value === note.color) || colorOptions[0]);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText("");
    setEditingColor(colorOptions[0]);
  };

  const saveEditedNote = async () => {
    if (!editingNoteId) return;

    const updatedNotes = notes.map((note) => (note.id === editingNoteId ? { ...note, text: editingText, color: editingColor.value } : note));

    const updatedNote = updatedNotes.find((note) => note.id === editingNoteId);

    if (updatedNote) {
      await notesDB.saveItem(updatedNote);
      setNotes(updatedNotes);
      cancelEditing();
    }
  };

  return (
    <div className="backdrop-blur-md rounded-xl p-4 shadow-lg" style={{ backgroundColor, color: textColor }}>
      <h2 className="text-[3.5vh] font-light mb-4" style={{ color: textColor }}>Notes</h2>
      
      <form onSubmit={addNote} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 bg-white/10 rounded-lg placeholder-white/40 focus:outline-none"
            style={{ color: textColor }}
          />
        </div>
        <Select
          options={colorOptions}
          value={selectedColor}
          onChange={(option) => option && setSelectedColor(option)}
          components={{ Option: ColourOption, SingleValue: ColourValue }}
          styles={customStyles}
          menuPortalTarget={document.body}
        />
        <button type="submit" className="px-3 py-2 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
          <Plus className="w-5 h-5" style={{ color: textColor }} />
        </button>
      </form>

      <div className="space-y-3 overflow-auto max-h-[calc(100vh-15rem)] custom-scrollbar">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-3 rounded-lg ${
              isPersian(note.text) ? "rtl" : "ltr"
            }`}
            style={{
              backgroundColor: note.color,
              color: textColor
            }}
          >
            {editingNoteId === note.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="w-full px-2 py-1 bg-white/20 rounded-lg focus:outline-none resize-none"
                  rows={3}
                  style={{ color: textColor }}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 items-center">
                    <Select
                      options={colorOptions}
                      value={editingColor}
                      onChange={(option) => option && setEditingColor(option)}
                      components={{ Option: ColourOption, SingleValue: ColourValue }}
                      styles={customStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEditing}
                      className="p-1 bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      <X className="w-4 h-4" style={{ color: textColor }} />
                    </button>
                    <button
                      onClick={saveEditedNote}
                      className="p-1 bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: textColor }} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between gap-2">
                <div className="flex flex-col flex-1">
                  <p className="break-words">{note.text}</p>
                  <span className="text-xs opacity-70 mt-1">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2 items-start shrink-0">
                  <button
                    onClick={() => startEditing(note)}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded-md"
                  >
                    <Edit2 className="w-3.5 h-3.5" style={{ color: textColor }} />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded-md"
                  >
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
