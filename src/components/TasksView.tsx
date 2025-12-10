import { useState } from "react";
import { Plus, User, Clock, CheckCircle2, Circle, AlertCircle, MessageSquarePlus, Trash2, X } from "lucide-react";
import { Task } from "@/types";
import { IN_CHARGE_OPTIONS } from "@/data/in-charge";
import { clsx } from "clsx";

interface TasksViewProps {
    tasks: Task[];
    onAddTask: (task: Omit<Task, "id" | "createdAt">) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
    onDeleteTask?: (taskId: string) => void;
}

export function TasksView({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TasksViewProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [addingUpdateFor, setAddingUpdateFor] = useState<string | null>(null);
    const [newUpdateText, setNewUpdateText] = useState("");
    const [newTask, setNewTask] = useState<{
        title: string;
        inCharge: string[];
        status: Task["status"];
        latestUpdate: string;
    }>({
        title: "",
        inCharge: [],
        status: "Pending",
        latestUpdate: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || newTask.inCharge.length === 0) return;
        onAddTask({ ...newTask, projectId: "lantern" }); // Project ID will be overridden by parent
        setIsAdding(false);
        setNewTask({ title: "", inCharge: [], status: "Pending", latestUpdate: "" });
    };

    const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
        onUpdateTask?.(taskId, { status: newStatus });
    };

    const handleAddUpdate = (taskId: string) => {
        if (!newUpdateText.trim()) return;
        onUpdateTask?.(taskId, { latestUpdate: newUpdateText.trim() });
        setNewUpdateText("");
        setAddingUpdateFor(null);
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            onDeleteTask?.(taskId);
        }
    };

    const togglePersonInCharge = (person: string) => {
        setNewTask(prev => ({
            ...prev,
            inCharge: prev.inCharge.includes(person)
                ? prev.inCharge.filter(p => p !== person)
                : [...prev.inCharge, person]
        }));
    };

    const togglePersonOnTask = (taskId: string, currentPeople: string[], person: string) => {
        const newPeople = currentPeople.includes(person)
            ? currentPeople.filter(p => p !== person)
            : [...currentPeople, person];
        if (newPeople.length > 0) {
            onUpdateTask?.(taskId, { inCharge: newPeople });
        }
    };

    const getStatusColor = (status: Task["status"]) => {
        switch (status) {
            case "Completed": return "bg-green-100 text-green-700 border-green-200";
            case "In Progress": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Pending": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-100";
        }
    };

    const getStatusIcon = (status: Task["status"]) => {
        switch (status) {
            case "Completed": return <CheckCircle2 className="w-4 h-4" />;
            case "In Progress": return <Clock className="w-4 h-4" />;
            case "Pending": return <Circle className="w-4 h-4" />;
        }
    };

    // Helper to normalize inCharge to always be an array (for backward compatibility)
    const normalizeInCharge = (inCharge: string | string[]): string[] => {
        if (Array.isArray(inCharge)) return inCharge;
        return inCharge ? [inCharge] : [];
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Active Tasks</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="What needs to be done?"
                                autoFocus
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign People ({newTask.inCharge.length} selected)
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                                {IN_CHARGE_OPTIONS.map(person => (
                                    <button
                                        key={person}
                                        type="button"
                                        onClick={() => togglePersonInCharge(person)}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                            newTask.inCharge.includes(person)
                                                ? "bg-black text-white"
                                                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                                        )}
                                    >
                                        {person}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={newTask.status}
                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task["status"] })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latest Update</label>
                            <textarea
                                value={newTask.latestUpdate}
                                onChange={(e) => setNewTask({ ...newTask, latestUpdate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Any progress notes..."
                                rows={2}
                            />
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
                            disabled={newTask.inCharge.length === 0}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Task
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p>No tasks yet for this project.</p>
                    </div>
                ) : (
                    tasks.map((task) => {
                        const people = normalizeInCharge(task.inCharge);
                        return (
                            <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                                    <div className="flex items-center gap-2">
                                        {/* Editable Status Dropdown */}
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                                            className={clsx(
                                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none",
                                                getStatusColor(task.status)
                                            )}
                                        >
                                            <option value="Pending">⭕ Pending</option>
                                            <option value="In Progress">🕐 In Progress</option>
                                            <option value="Completed">✅ Completed</option>
                                        </select>
                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete task"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* People assigned */}
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    {people.map(person => (
                                        <span
                                            key={person}
                                            className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium"
                                        >
                                            {person}
                                            <button
                                                onClick={() => togglePersonOnTask(task.id, people, person)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Remove person"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {/* Add more people dropdown */}
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                togglePersonOnTask(task.id, people, e.target.value);
                                            }
                                        }}
                                        className="bg-gray-50 border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs text-gray-500 hover:border-gray-400 cursor-pointer"
                                    >
                                        <option value="">+ Add person</option>
                                        {IN_CHARGE_OPTIONS.filter(p => !people.includes(p)).map(person => (
                                            <option key={person} value={person}>{person}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Latest Update Section */}
                                <div className="border-t border-gray-100 pt-3">
                                    {task.latestUpdate && (
                                        <div className="flex items-start gap-1.5 mb-3">
                                            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-gray-600 leading-snug text-sm">{task.latestUpdate}</p>
                                        </div>
                                    )}

                                    {/* Add Update Button/Form */}
                                    {addingUpdateFor === task.id ? (
                                        <div className="flex gap-2 items-start">
                                            <input
                                                type="text"
                                                value={newUpdateText}
                                                onChange={(e) => setNewUpdateText(e.target.value)}
                                                placeholder="Add an update..."
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddUpdate(task.id);
                                                    }
                                                    if (e.key === "Escape") {
                                                        setAddingUpdateFor(null);
                                                        setNewUpdateText("");
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => handleAddUpdate(task.id)}
                                                className="px-3 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAddingUpdateFor(null);
                                                    setNewUpdateText("");
                                                }}
                                                className="px-3 py-2 text-gray-600 hover:bg-gray-100 text-sm rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingUpdateFor(task.id)}
                                            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            Add Update
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
