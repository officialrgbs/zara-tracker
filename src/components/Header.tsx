"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ProjectId, TabId } from "@/types";
import { clsx } from "clsx";

interface HeaderProps {
    currentProject: ProjectId;
    setCurrentProject: (id: ProjectId) => void;
    currentTab: TabId;
    setCurrentTab: (id: TabId) => void;
}

const PROJECTS: { id: ProjectId; label: string }[] = [
    { id: "lantern", label: "Lantern Making" },
    { id: "hiphop", label: "Hiphop" },
];

const TABS: { id: TabId; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "budget", label: "Budget" },
    { id: "notes", label: "Notes" },
];

export function Header({
    currentProject,
    setCurrentProject,
    currentTab,
    setCurrentTab,
}: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProjectSelect = (projectId: ProjectId) => {
        setCurrentProject(projectId);
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-2xl mx-auto">
            {/* Project Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-2xl font-bold text-gray-900 bg-white/50 px-4 py-2 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
                >
                    {PROJECTS.find((p) => p.id === currentProject)?.label}
                    <ChevronDown className={clsx("w-6 h-6 text-gray-500 transition-transform", isDropdownOpen && "rotate-180")} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white/95 backdrop-blur-md shadow-xl rounded-xl overflow-hidden border border-gray-100 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                        {PROJECTS.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => handleProjectSelect(project.id)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 hover:bg-black/5 font-medium transition-colors",
                                    currentProject === project.id ? "text-blue-600 bg-blue-50" : "text-gray-700"
                                )}
                            >
                                {project.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pill Switcher */}
            <div className="flex bg-gray-100 p-1.5 rounded-full shadow-inner gap-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={clsx(
                            "px-6 py-2 rounded-full font-medium text-sm transition-all duration-300",
                            currentTab === tab.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
