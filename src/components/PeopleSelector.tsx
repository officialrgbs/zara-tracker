import { useState } from "react";
import { CheckSquare, Square, Save, Trash2, Users, ChevronDown } from "lucide-react";
import { PeoplePreset } from "@/types";
import { IN_CHARGE_OPTIONS } from "@/data/in-charge";
import { clsx } from "clsx";

interface PeopleSelectorProps {
    selectedPeople: string[];
    onSelectionChange: (people: string[]) => void;
    presets: PeoplePreset[];
    onSavePreset: (name: string, people: string[]) => void;
    onDeletePreset: (presetId: string) => void;
    label?: string;
}

export function PeopleSelector({
    selectedPeople,
    onSelectionChange,
    presets,
    onSavePreset,
    onDeletePreset,
    label = "Select People"
}: PeopleSelectorProps) {
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");

    const handleSelectAll = () => {
        onSelectionChange([...IN_CHARGE_OPTIONS]);
    };

    const handleDeselectAll = () => {
        onSelectionChange([]);
    };

    const togglePerson = (person: string) => {
        if (selectedPeople.includes(person)) {
            onSelectionChange(selectedPeople.filter(p => p !== person));
        } else {
            onSelectionChange([...selectedPeople, person]);
        }
    };

    const handleLoadPreset = (preset: PeoplePreset) => {
        onSelectionChange([...preset.people]);
        setShowPresetDropdown(false);
    };

    const handleSavePreset = () => {
        if (newPresetName.trim() && selectedPeople.length > 0) {
            onSavePreset(newPresetName.trim(), selectedPeople);
            setNewPresetName("");
            setShowSavePreset(false);
        }
    };

    const handleDeletePreset = (e: React.MouseEvent, presetId: string) => {
        e.stopPropagation();
        if (confirm("Delete this preset?")) {
            onDeletePreset(presetId);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label} ({selectedPeople.length} selected)
                </label>
                <div className="flex items-center gap-2">
                    {/* Presets Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Users className="w-3.5 h-3.5" />
                            Presets
                            <ChevronDown className={clsx("w-3 h-3 transition-transform", showPresetDropdown && "rotate-180")} />
                        </button>
                        {showPresetDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                {presets.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-gray-400">No presets saved</p>
                                ) : (
                                    presets.map(preset => (
                                        <div
                                            key={preset.id}
                                            onClick={() => handleLoadPreset(preset)}
                                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{preset.name}</p>
                                                <p className="text-xs text-gray-400">{preset.people.length} people</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeletePreset(e, preset.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                    {showSavePreset ? (
                                        <div className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={newPresetName}
                                                onChange={(e) => setNewPresetName(e.target.value)}
                                                placeholder="Preset name..."
                                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-black/10"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSavePreset();
                                                    if (e.key === "Escape") setShowSavePreset(false);
                                                }}
                                            />
                                            <div className="flex gap-1 mt-2">
                                                <button
                                                    onClick={handleSavePreset}
                                                    disabled={!newPresetName.trim() || selectedPeople.length === 0}
                                                    className="flex-1 px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setShowSavePreset(false)}
                                                    className="px-2 py-1 text-gray-500 text-xs hover:bg-gray-100 rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowSavePreset(true)}
                                            disabled={selectedPeople.length === 0}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Save current as preset
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Select/Deselect All */}
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <CheckSquare className="w-3.5 h-3.5" />
                        All
                    </button>
                    <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <Square className="w-3.5 h-3.5" />
                        None
                    </button>
                </div>
            </div>

            {/* People Grid */}
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                {IN_CHARGE_OPTIONS.map(person => (
                    <button
                        key={person}
                        type="button"
                        onClick={() => togglePerson(person)}
                        className={clsx(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            selectedPeople.includes(person)
                                ? "bg-black text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                        )}
                    >
                        {person}
                    </button>
                ))}
            </div>
        </div>
    );
}
