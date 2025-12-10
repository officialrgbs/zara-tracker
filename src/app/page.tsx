"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { TasksView } from "@/components/TasksView";
import { BudgetsView } from "@/components/BudgetsView";
import { NotesView } from "@/components/NotesView";
import { ProjectId, TabId, Task, BudgetItem, Note } from "@/types";
import { useZaraProjects } from "@/hooks/useZaraProjects";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useNotes } from "@/hooks/useNotes";
import { usePeoplePresets } from "@/hooks/usePeoplePresets";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [currentProject, setCurrentProject] = useState<ProjectId>("lantern");
  const [currentTab, setCurrentTab] = useState<TabId>("tasks");
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useZaraProjects();
  const {
    budgetItems,
    loading: budgetLoading,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    updatePayerPayment,
    addPayerToItem,
    removePayerFromItem
  } = useBudgetItems();
  const {
    notes,
    loading: notesLoading,
    addNote,
    updateNote,
    deleteNote,
    togglePin
  } = useNotes();
  const {
    presets,
    loading: presetsLoading,
    addPreset,
    deletePreset
  } = usePeoplePresets();

  const handleAddTask = (newTask: Omit<Task, "id" | "createdAt">) => {
    addTask({
      ...newTask,
      createdAt: Date.now(),
      projectId: currentProject,
    });
  };

  const handleAddBudgetItem = (newItem: Omit<BudgetItem, "id" | "createdAt">) => {
    addBudgetItem({
      ...newItem,
      createdAt: Date.now(),
      projectId: currentProject,
    });
  };

  const handleAddNote = (newNote: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    addNote({
      ...newNote,
      createdAt: now,
      updatedAt: now,
      projectId: currentProject,
    });
  };

  const currentTasks = tasks.filter((t) => t.projectId === currentProject);
  const currentBudgetItems = budgetItems.filter((b) => b.projectId === currentProject);
  const currentNotes = notes.filter((n) => n.projectId === currentProject);

  const loading = tasksLoading || budgetLoading || notesLoading || presetsLoading;

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Header
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <div className="container mx-auto">
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {currentTab === "tasks" && (
              <TasksView
                tasks={currentTasks}
                onAddTask={handleAddTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                presets={presets}
                onSavePreset={addPreset}
                onDeletePreset={deletePreset}
              />
            )}
            {currentTab === "budget" && (
              <BudgetsView
                budgetItems={currentBudgetItems}
                onAddItem={handleAddBudgetItem}
                onUpdateItem={updateBudgetItem}
                onDeleteItem={deleteBudgetItem}
                onUpdatePayerPayment={updatePayerPayment}
                onAddPayer={addPayerToItem}
                onRemovePayer={removePayerFromItem}
                presets={presets}
                onSavePreset={addPreset}
                onDeletePreset={deletePreset}
              />
            )}
            {currentTab === "notes" && (
              <NotesView
                notes={currentNotes}
                onAddNote={handleAddNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onTogglePin={togglePin}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
