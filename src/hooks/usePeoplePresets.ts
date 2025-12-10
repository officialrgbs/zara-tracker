import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PeoplePreset } from "@/types";

export function usePeoplePresets() {
    const [presets, setPresets] = useState<PeoplePreset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, "zara_people_presets");

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newPresets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PeoplePreset[];
                // Sort by name
                newPresets.sort((a, b) => a.name.localeCompare(b.name));
                setPresets(newPresets);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore presets error:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const addPreset = async (name: string, people: string[]) => {
        await addDoc(collection(db, "zara_people_presets"), {
            name,
            people,
            createdAt: Date.now()
        });
    };

    const deletePreset = async (presetId: string) => {
        const presetRef = doc(db, "zara_people_presets", presetId);
        await deleteDoc(presetRef);
    };

    return {
        presets,
        loading,
        addPreset,
        deletePreset
    };
}
