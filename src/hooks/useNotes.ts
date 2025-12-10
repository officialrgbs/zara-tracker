import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note } from "@/types";

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, "zara_notes");

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newNotes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Note[];
                // Sort: pinned first, then by updatedAt descending
                newNotes.sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return b.updatedAt - a.updatedAt;
                });
                setNotes(newNotes);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore notes error:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const addNote = async (note: Omit<Note, "id">) => {
        await addDoc(collection(db, "zara_notes"), note);
    };

    const updateNote = async (noteId: string, updates: Partial<Omit<Note, "id">>) => {
        const noteRef = doc(db, "zara_notes", noteId);
        await updateDoc(noteRef, { ...updates, updatedAt: Date.now() });
    };

    const deleteNote = async (noteId: string) => {
        const noteRef = doc(db, "zara_notes", noteId);
        await deleteDoc(noteRef);
    };

    const togglePin = async (noteId: string, currentPinned: boolean) => {
        await updateNote(noteId, { isPinned: !currentPinned });
    };

    return {
        notes,
        loading,
        addNote,
        updateNote,
        deleteNote,
        togglePin
    };
}
