import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/types";

export function useZaraProjects() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simplified query without orderBy to debug permission issue
        const q = collection(db, "zara_projects");

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newTasks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Task[];
                // Sort client-side by createdAt descending
                newTasks.sort((a, b) => b.createdAt - a.createdAt);
                setTasks(newTasks);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore permission error:", error);
                console.error("Please update Firestore rules in Firebase Console to allow access");
                setLoading(false); // Stop loading even on error
            }
        );
        return () => unsubscribe();
    }, []);

    const addTask = async (task: Omit<Task, "id">) => {
        await addDoc(collection(db, "zara_projects"), task);
    };

    const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id">>) => {
        const taskRef = doc(db, "zara_projects", taskId);
        await updateDoc(taskRef, updates);
    };

    const deleteTask = async (taskId: string) => {
        const taskRef = doc(db, "zara_projects", taskId);
        await deleteDoc(taskRef);
    };

    return { tasks, loading, addTask, updateTask, deleteTask };
}
