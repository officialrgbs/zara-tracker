"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { TasksView } from "@/components/TasksView";
import { ProjectId, TabId, Task } from "@/types";
import { useZaraProjects } from "@/hooks/useZaraProjects";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [currentProject, setCurrentProject] = useState<ProjectId>("lantern");
  const [currentTab, setCurrentTab] = useState<TabId>("tasks");
  const { tasks, loading, addTask, updateTask, deleteTask } = useZaraProjects();

  const handleAddTask = (newTask: Omit<Task, "id" | "createdAt">) => {
    addTask({
      ...newTask,
      createdAt: Date.now(),
      projectId: currentProject, // Ensure project ID is set from current context
    });
  };

  const currentTasks = tasks.filter((t) => t.projectId === currentProject);

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
              <TasksView tasks={currentTasks} onAddTask={handleAddTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
            )}
            {currentTab === "budget" && (
              <div className="text-center py-20 text-gray-400">Budget View Coming Soon</div>
            )}
            {currentTab === "notes" && (
              <div className="text-center py-20 text-gray-400">Notes View Coming Soon</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
