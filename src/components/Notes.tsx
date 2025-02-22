import React, { useState, useEffect } from "react";
import { Plus, X, Edit2, CheckCircle2 } from "lucide-react";
import * as dateFns from "date-fns";
import * as dateFnsJalali from "date-fns-jalali";
import Select, { components, StylesConfig, OptionProps, SingleValueProps } from "react-select";
import { useCalendar } from "./BackgroundSelector";
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
  const { calendarType } = useCalendar();
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
    <div className="bg-black/20 backdrop-blur-md rounded-xl p-4">
      <h2 className="text-white text-lg font-medium mb-2">Notes</h2>

      <form onSubmit={addNote} className="mb-2">
        <div className="flex gap-1 mb-1 items-start">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className={`w-64 bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[80px] resize-none ${
              isPersian(newNote) ? "rtl" : "ltr"
            }`}
          />
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="flex items-center justify-center w-8 h-8 bg-black/20 hover:bg-black/30 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <Select
              value={selectedColor}
              onChange={(option) => {
                if (option) setSelectedColor(option);
              }}
              options={colorOptions}
              components={{ Option: ColourOption, SingleValue: ColourValue }}
              styles={customStyles}
              isSearchable={false}
              menuPlacement="auto"
            />
          </div>
        </div>
      </form>

      <div className="space-y-3 max-h-[20vh] overflow-y-auto custom-scrollbar">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-black/10 rounded-lg p-3 group relative"
            style={{
              fontFamily: calendarType === "persian" ? "Vazirmatn, sans-serif" : "inherit",
              backgroundColor: note.color,
            }}
          >
            {editingNoteId === note.id ? (
              <>
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className={`w-full bg-black/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    isPersian(editingText) ? "rtl" : "ltr"
                  }`}
                />
                <div className="mt-2 flex justify-center gap-2 items-center">
                  <Select
                    value={editingColor}
                    onChange={(option) => {
                      if (option) setEditingColor(option);
                    }}
                    options={colorOptions}
                    components={{ Option: ColourOption, SingleValue: ColourValue }}
                    styles={customStyles}
                    isSearchable={false}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                  />
                  <button
                    onClick={saveEditedNote}
                    className="flex items-center justify-center w-8 h-8 bg-black/20 hover:bg-black/30 text-white rounded transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center justify-center w-8 h-8 bg-black/20 hover:bg-black/30 text-white rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`text-white whitespace-pre-wrap break-words mb-1 ${isPersian(note.text) ? "rtl" : "ltr"}`}>{note.text}</div>
                <div className="flex justify-between items-center">
                  {isPersian(note.text) ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing(note)}
                          className="text-white opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-white/50 text-sm">{formatDate(note.createdAt)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white/50 text-sm">{formatDate(note.createdAt)}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(note)}
                          className="text-white opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-white opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
