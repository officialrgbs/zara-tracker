import { useState } from "react";
import {
    Plus,
    Pin,
    PinOff,
    Trash2,
    Edit3,
    X,
    Check,
    StickyNote,
    Palette
} from "lucide-react";
import { Note, NoteColor } from "@/types";
import { clsx } from "clsx";

interface NotesViewProps {
    notes: Note[];
    onAddNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
    onUpdateNote?: (noteId: string, updates: Partial<Omit<Note, "id">>) => void;
    onDeleteNote?: (noteId: string) => void;
    onTogglePin?: (noteId: string, currentPinned: boolean) => void;
}

const COLOR_OPTIONS: { value: NoteColor; label: string; bg: string; border: string }[] = [
    { value: "default", label: "Default", bg: "bg-white", border: "border-gray-200" },
    { value: "yellow", label: "Yellow", bg: "bg-yellow-50", border: "border-yellow-200" },
    { value: "green", label: "Green", bg: "bg-green-50", border: "border-green-200" },
    { value: "blue", label: "Blue", bg: "bg-blue-50", border: "border-blue-200" },
    { value: "pink", label: "Pink", bg: "bg-pink-50", border: "border-pink-200" },
    { value: "purple", label: "Purple", bg: "bg-purple-50", border: "border-purple-200" },
];

export function NotesView({
    notes,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    onTogglePin
}: NotesViewProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

    const [newNote, setNewNote] = useState<{
        title: string;
        content: string;
        color: NoteColor;
    }>({
        title: "",
        content: "",
        color: "default"
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.title.trim() && !newNote.content.trim()) return;
        onAddNote({
            title: newNote.title.trim() || "Untitled",
            content: newNote.content,
            isPinned: false,
            color: newNote.color,
            projectId: "lantern" // Will be overridden by parent
        });
        setIsAdding(false);
        setNewNote({ title: "", content: "", color: "default" });
    };

    const handleStartEdit = (note: Note) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const handleSaveEdit = (noteId: string) => {
        onUpdateNote?.(noteId, {
            title: editTitle.trim() || "Untitled",
            content: editContent
        });
        setEditingNoteId(null);
        setEditTitle("");
        setEditContent("");
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditTitle("");
        setEditContent("");
    };

    const handleDeleteNote = (noteId: string) => {
        if (confirm("Are you sure you want to delete this note?")) {
            onDeleteNote?.(noteId);
        }
    };

    const handleColorChange = (noteId: string, color: NoteColor) => {
        onUpdateNote?.(noteId, { color });
        setShowColorPicker(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getColorClasses = (color: NoteColor) => {
        const colorOption = COLOR_OPTIONS.find(c => c.value === color);
        return colorOption || COLOR_OPTIONS[0];
    };

    const pinnedNotes = notes.filter(n => n.isPinned);
    const unpinnedNotes = notes.filter(n => !n.isPinned);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Notes</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Note
                </button>
            </div>

            {/* Add Note Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={newNote.title}
                                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Note title..."
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                                placeholder="Write your note..."
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="flex gap-2">
                                {COLOR_OPTIONS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setNewNote({ ...newNote, color: color.value })}
                                        className={clsx(
                                            "w-8 h-8 rounded-full border-2 transition-all",
                                            color.bg,
                                            newNote.color === color.value
                                                ? "ring-2 ring-black ring-offset-2 scale-110"
                                                : "hover:scale-105"
                                        )}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                </form>
            )}

            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notes yet for this project.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Pinned Notes Section */}
                    {pinnedNotes.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Pin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-600">Pinned</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pinnedNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isEditing={editingNoteId === note.id}
                                        editTitle={editTitle}
                                        editContent={editContent}
                                        setEditTitle={setEditTitle}
                                        setEditContent={setEditContent}
                                        onStartEdit={() => handleStartEdit(note)}
                                        onSaveEdit={() => handleSaveEdit(note.id)}
                                        onCancelEdit={handleCancelEdit}
                                        onDelete={() => handleDeleteNote(note.id)}
                                        onTogglePin={() => onTogglePin?.(note.id, note.isPinned)}
                                        onColorChange={(color) => handleColorChange(note.id, color)}
                                        showColorPicker={showColorPicker === note.id}
                                        setShowColorPicker={(show) => setShowColorPicker(show ? note.id : null)}
                                        getColorClasses={getColorClasses}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unpinned Notes Section */}
                    {unpinnedNotes.length > 0 && (
                        <div>
                            {pinnedNotes.length > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                    <StickyNote className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-600">Other Notes</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {unpinnedNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isEditing={editingNoteId === note.id}
                                        editTitle={editTitle}
                                        editContent={editContent}
                                        setEditTitle={setEditTitle}
                                        setEditContent={setEditContent}
                                        onStartEdit={() => handleStartEdit(note)}
                                        onSaveEdit={() => handleSaveEdit(note.id)}
                                        onCancelEdit={handleCancelEdit}
                                        onDelete={() => handleDeleteNote(note.id)}
                                        onTogglePin={() => onTogglePin?.(note.id, note.isPinned)}
                                        onColorChange={(color) => handleColorChange(note.id, color)}
                                        showColorPicker={showColorPicker === note.id}
                                        setShowColorPicker={(show) => setShowColorPicker(show ? note.id : null)}
                                        getColorClasses={getColorClasses}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Separate NoteCard component for cleaner code
interface NoteCardProps {
    note: Note;
    isEditing: boolean;
    editTitle: string;
    editContent: string;
    setEditTitle: (title: string) => void;
    setEditContent: (content: string) => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onColorChange: (color: NoteColor) => void;
    showColorPicker: boolean;
    setShowColorPicker: (show: boolean) => void;
    getColorClasses: (color: NoteColor) => { bg: string; border: string };
    formatDate: (timestamp: number) => string;
}

function NoteCard({
    note,
    isEditing,
    editTitle,
    editContent,
    setEditTitle,
    setEditContent,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onTogglePin,
    onColorChange,
    showColorPicker,
    setShowColorPicker,
    getColorClasses,
    formatDate
}: NoteCardProps) {
    const colorClasses = getColorClasses(note.color);

    return (
        <div
            className={clsx(
                "rounded-xl shadow-sm border overflow-hidden group transition-all hover:shadow-md",
                colorClasses.bg,
                colorClasses.border
            )}
        >
            {isEditing ? (
                // Edit Mode
                <div className="p-4">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="Title..."
                        autoFocus
                    />
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="Content..."
                        rows={4}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={onCancelEdit}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onSaveEdit}
                            className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                // View Mode
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Color Picker Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                                    title="Change color"
                                >
                                    <Palette className="w-4 h-4" />
                                </button>
                                {showColorPicker && (
                                    <div className="absolute right-0 top-full mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1 z-10">
                                        {COLOR_OPTIONS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => onColorChange(color.value)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-full border transition-all hover:scale-110",
                                                    color.bg,
                                                    note.color === color.value && "ring-2 ring-black ring-offset-1"
                                                )}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Pin Button */}
                            <button
                                onClick={onTogglePin}
                                className={clsx(
                                    "p-1.5 rounded-lg transition-colors",
                                    note.isPinned
                                        ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                )}
                                title={note.isPinned ? "Unpin" : "Pin to top"}
                            >
                                {note.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                            </button>
                            {/* Edit Button */}
                            <button
                                onClick={onStartEdit}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            {/* Delete Button */}
                            <button
                                onClick={onDelete}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {note.content && (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-4 mb-3">
                            {note.content}
                        </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(note.updatedAt)}</span>
                        {note.isPinned && (
                            <span className="flex items-center gap-1 text-amber-500">
                                <Pin className="w-3 h-3" />
                                Pinned
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
