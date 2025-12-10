import { useState, useMemo } from "react";
import { Plus, User, Clock, CheckCircle2, Circle, AlertCircle, MessageSquarePlus, Trash2, X, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import { Task, Update, PeoplePreset } from "@/types";
import { IN_CHARGE_OPTIONS } from "@/data/in-charge";
import { PeopleSelector } from "./PeopleSelector";
import { clsx } from "clsx";

type SortOption = "update" | "completion" | "created";
type StatusFilter = "all" | "Pending" | "In Progress" | "Completed";

interface TasksViewProps {
    tasks: Task[];
    onAddTask: (task: Omit<Task, "id" | "createdAt">) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
    onDeleteTask?: (taskId: string) => void;
    presets: PeoplePreset[];
    onSavePreset: (name: string, people: string[]) => void;
    onDeletePreset: (presetId: string) => void;
}

export function TasksView({
    tasks,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    presets,
    onSavePreset,
    onDeletePreset
}: TasksViewProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [addingUpdateFor, setAddingUpdateFor] = useState<string | null>(null);
    const [newUpdateText, setNewUpdateText] = useState("");
    const [expandedHistoryFor, setExpandedHistoryFor] = useState<Set<string>>(new Set());

    // Sort & Filter state
    const [sortBy, setSortBy] = useState<SortOption>("update");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [personFilter, setPersonFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

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

    // Helper to normalize updates (for backward compatibility)
    const normalizeUpdates = (task: Task): Update[] => {
        if (task.updates && Array.isArray(task.updates)) {
            return task.updates;
        }
        const oldUpdate = (task as unknown as { latestUpdate?: string }).latestUpdate;
        if (oldUpdate) {
            return [{ text: oldUpdate, timestamp: task.createdAt }];
        }
        return [];
    };

    // Helper to normalize inCharge
    const normalizeInCharge = (inCharge: string | string[]): string[] => {
        if (Array.isArray(inCharge)) return inCharge;
        return inCharge ? [inCharge] : [];
    };

    // Get latest update timestamp
    const getLatestUpdateTime = (task: Task): number => {
        const updates = normalizeUpdates(task);
        return updates.length > 0 ? updates[0].timestamp : task.createdAt;
    };

    // Status order for sorting
    const getStatusOrder = (status: Task["status"]): number => {
        switch (status) {
            case "Pending": return 0;
            case "In Progress": return 1;
            case "Completed": return 2;
            default: return 0;
        }
    };

    // Sorted and filtered tasks
    const filteredAndSortedTasks = useMemo(() => {
        let result = [...tasks];

        // Apply filters
        if (statusFilter !== "all") {
            result = result.filter(t => t.status === statusFilter);
        }
        if (personFilter.length > 0) {
            result = result.filter(t =>
                personFilter.some(person => normalizeInCharge(t.inCharge).includes(person))
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case "update":
                    return getLatestUpdateTime(b) - getLatestUpdateTime(a);
                case "completion":
                    return getStatusOrder(a.status) - getStatusOrder(b.status);
                case "created":
                    return b.createdAt - a.createdAt;
                default:
                    return 0;
            }
        });

        return result;
    }, [tasks, sortBy, statusFilter, personFilter]);

    // Get unique people from all tasks for filter
    const allPeople = useMemo(() => {
        const people = new Set<string>();
        tasks.forEach(t => normalizeInCharge(t.inCharge).forEach(p => people.add(p)));
        return Array.from(people).sort();
    }, [tasks]);

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
        });
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
        onUpdateTask?.(taskId, { updates: [newUpdate, ...currentUpdates] });
        setNewUpdateText("");
        setAddingUpdateFor(null);
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            onDeleteTask?.(taskId);
        }
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

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Active Tasks</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {/* Sort & Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white rounded-xl border border-gray-100">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-700"
                    >
                        <option value="update">Sort by Update</option>
                        <option value="completion">Sort by Status</option>
                        <option value="created">Sort by Created</option>
                    </select>
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        showFilters ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(statusFilter !== "all" || personFilter.length > 0) && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                </button>

                {/* Active Filters Display */}
                {(statusFilter !== "all" || personFilter.length > 0) && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusFilter !== "all" && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                {statusFilter}
                                <button onClick={() => setStatusFilter("all")} className="hover:text-blue-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {personFilter.map(person => (
                            <span key={person} className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                                {person}
                                <button onClick={() => setPersonFilter(personFilter.filter(p => p !== person))} className="hover:text-purple-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Filter Options */}
                {showFilters && (
                    <div className="w-full flex flex-wrap gap-4 pt-3 border-t border-gray-100 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-black/10"
                            >
                                <option value="all">All</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <span className="text-sm text-gray-500 block mb-2">Filter by Person:</span>
                            <div className="flex flex-wrap gap-2">
                                {allPeople.map(person => (
                                    <button
                                        key={person}
                                        type="button"
                                        onClick={() => {
                                            if (personFilter.includes(person)) {
                                                setPersonFilter(personFilter.filter(p => p !== person));
                                            } else {
                                                setPersonFilter([...personFilter, person]);
                                            }
                                        }}
                                        className={clsx(
                                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                            personFilter.includes(person)
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {person}
                                    </button>
                                ))}
                                {personFilter.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setPersonFilter([])}
                                        className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Task Form */}
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
                            <PeopleSelector
                                selectedPeople={newTask.inCharge}
                                onSelectionChange={(people) => setNewTask({ ...newTask, inCharge: people })}
                                presets={presets}
                                onSavePreset={onSavePreset}
                                onDeletePreset={onDeletePreset}
                                label="Assign People"
                            />
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

            {/* Tasks List */}
            <div className="grid gap-4">
                {filteredAndSortedTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p>{tasks.length === 0 ? "No tasks yet for this project." : "No tasks match your filters."}</p>
                    </div>
                ) : (
                    filteredAndSortedTasks.map((task) => {
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
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addPersonToTask(task.id, people, e.target.value);
                                                e.target.value = "";
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
                                    {latestUpdate && (
                                        <div className="flex items-start gap-2 mb-3 bg-blue-50 p-3 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-gray-700 leading-snug text-sm">{latestUpdate.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDate(latestUpdate.timestamp)}</p>
                                            </div>
                                        </div>
                                    )}

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
