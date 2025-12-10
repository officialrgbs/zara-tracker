import { useState } from "react";
import { Plus, User, Clock, CheckCircle2, Circle, AlertCircle, MessageSquarePlus, Trash2, X, ChevronDown } from "lucide-react";
import { Task, Update } from "@/types";
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
    const [expandedHistoryFor, setExpandedHistoryFor] = useState<Set<string>>(new Set());
    const [newTask, setNewTask] = useState<{
        title: string;
        inCharge: string[];
        status: Task["status"];
        initialUpdate: string;
    }>({
        title: "",
        inCharge: [],
        status: "Pending",
        initialUpdate: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || newTask.inCharge.length === 0) return;
        const updates: Update[] = newTask.initialUpdate
            ? [{ text: newTask.initialUpdate, timestamp: Date.now() }]
            : [];
        onAddTask({
            title: newTask.title,
            inCharge: newTask.inCharge,
            status: newTask.status,
            updates,
            projectId: "lantern"
        }); // Project ID will be overridden by parent
        setIsAdding(false);
        setNewTask({ title: "", inCharge: [], status: "Pending", initialUpdate: "" });
    };

    const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
        onUpdateTask?.(taskId, { status: newStatus });
    };

    const handleAddUpdate = (taskId: string, currentUpdates: Update[]) => {
        if (!newUpdateText.trim()) return;
        const newUpdate: Update = {
            text: newUpdateText.trim(),
            timestamp: Date.now()
        };
        // Add new update at the beginning (newest first)
        onUpdateTask?.(taskId, { updates: [newUpdate, ...currentUpdates] });
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

    const removePersonFromTask = (e: React.MouseEvent, taskId: string, currentPeople: string[], personToRemove: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newPeople = currentPeople.filter(p => p !== personToRemove);
        if (newPeople.length > 0) {
            onUpdateTask?.(taskId, { inCharge: newPeople });
        } else {
            alert("Cannot remove the last person. A task must have at least one person assigned.");
        }
    };

    const addPersonToTask = (taskId: string, currentPeople: string[], personToAdd: string) => {
        if (!currentPeople.includes(personToAdd)) {
            onUpdateTask?.(taskId, { inCharge: [...currentPeople, personToAdd] });
        }
    };

    const toggleHistory = (taskId: string) => {
        setExpandedHistoryFor(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    // Helper to normalize updates (for backward compatibility with old latestUpdate string)
    const normalizeUpdates = (task: Task): Update[] => {
        if (task.updates && Array.isArray(task.updates)) {
            return task.updates;
        }
        // Backward compatibility: convert old latestUpdate string to Update array
        const oldUpdate = (task as unknown as { latestUpdate?: string }).latestUpdate;
        if (oldUpdate) {
            return [{ text: oldUpdate, timestamp: task.createdAt }];
        }
        return [];
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Update (optional)</label>
                            <textarea
                                value={newTask.initialUpdate}
                                onChange={(e) => setNewTask({ ...newTask, initialUpdate: e.target.value })}
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
                        const updates = normalizeUpdates(task);
                        const latestUpdate = updates[0];
                        const previousUpdates = updates.slice(1);
                        const isHistoryExpanded = expandedHistoryFor.has(task.id);

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
                                                onClick={(e) => removePersonFromTask(e, task.id, people, person)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 -mr-1 rounded hover:bg-red-50"
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
                                                addPersonToTask(task.id, people, e.target.value);
                                                e.target.value = ""; // Reset dropdown
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

                                {/* Updates Section */}
                                <div className="border-t border-gray-100 pt-3">
                                    {/* Latest Update */}
                                    {latestUpdate && (
                                        <div className="flex items-start gap-2 mb-3 bg-blue-50 p-3 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-gray-700 leading-snug text-sm">{latestUpdate.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDate(latestUpdate.timestamp)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Update Button/Form */}
                                    {addingUpdateFor === task.id ? (
                                        <div className="flex gap-2 items-start mb-3">
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
                                                        handleAddUpdate(task.id, updates);
                                                    }
                                                    if (e.key === "Escape") {
                                                        setAddingUpdateFor(null);
                                                        setNewUpdateText("");
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => handleAddUpdate(task.id, updates)}
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
                                            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm hover:bg-gray-50 px-2 py-1 rounded-md transition-colors mb-3"
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            Add Update
                                        </button>
                                    )}

                                    {/* Previous Updates Toggle */}
                                    {previousUpdates.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() => toggleHistory(task.id)}
                                                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors"
                                            >
                                                <ChevronDown className={clsx("w-3 h-3 transition-transform", isHistoryExpanded && "rotate-180")} />
                                                {isHistoryExpanded ? "Hide" : "Show"} {previousUpdates.length} previous update{previousUpdates.length > 1 ? "s" : ""}
                                            </button>

                                            {isHistoryExpanded && (
                                                <ul className="mt-2 space-y-2 pl-4 border-l-2 border-gray-100">
                                                    {previousUpdates.map((update, index) => (
                                                        <li key={index} className="text-sm text-gray-500">
                                                            <span className="text-gray-600">{update.text}</span>
                                                            <span className="text-xs text-gray-400 ml-2">— {formatDate(update.timestamp)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
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
