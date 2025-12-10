import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BudgetItem, PayerPayment } from "@/types";

export function useBudgetItems() {
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, "zara_budget_items");

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const newItems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as BudgetItem[];
                // Sort client-side by createdAt descending
                newItems.sort((a, b) => b.createdAt - a.createdAt);
                setBudgetItems(newItems);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore budget items error:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const addBudgetItem = async (item: Omit<BudgetItem, "id">) => {
        await addDoc(collection(db, "zara_budget_items"), item);
    };

    const updateBudgetItem = async (itemId: string, updates: Partial<Omit<BudgetItem, "id">>) => {
        const itemRef = doc(db, "zara_budget_items", itemId);
        await updateDoc(itemRef, updates);
    };

    const deleteBudgetItem = async (itemId: string) => {
        const itemRef = doc(db, "zara_budget_items", itemId);
        await deleteDoc(itemRef);
    };

    // Update a specific payer's payment info
    const updatePayerPayment = async (
        itemId: string,
        currentPayers: PayerPayment[],
        payerName: string,
        updates: Partial<PayerPayment>
    ) => {
        const updatedPayers = currentPayers.map(p =>
            p.name === payerName
                ? { ...p, ...updates, lastUpdated: Date.now() }
                : p
        );
        await updateBudgetItem(itemId, { payers: updatedPayers });
    };

    // Add a new payer to an item
    const addPayerToItem = async (
        itemId: string,
        currentPayers: PayerPayment[],
        newPayer: PayerPayment
    ) => {
        const updatedPayers = [...currentPayers, newPayer];
        await updateBudgetItem(itemId, { payers: updatedPayers });
    };

    // Remove a payer from an item
    const removePayerFromItem = async (
        itemId: string,
        currentPayers: PayerPayment[],
        payerName: string
    ) => {
        const updatedPayers = currentPayers.filter(p => p.name !== payerName);
        await updateBudgetItem(itemId, { payers: updatedPayers });
    };

    return {
        budgetItems,
        loading,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        updatePayerPayment,
        addPayerToItem,
        removePayerFromItem
    };
}
