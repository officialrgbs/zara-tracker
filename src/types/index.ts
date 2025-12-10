export type ProjectId = "lantern" | "hiphop";
export type TabId = "tasks" | "budget" | "notes";

export interface Update {
    text: string;
    timestamp: number;
}

export interface Task {
    id: string;
    title: string;
    status: "Pending" | "In Progress" | "Completed";
    inCharge: string[]; // Array of people assigned to task
    updates: Update[]; // Array of updates with timestamps (newest first)
    projectId: ProjectId;
    createdAt: number;
}

