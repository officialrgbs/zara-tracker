export type ProjectId = "lantern" | "hiphop";
export type TabId = "tasks" | "budget" | "notes";

export interface Task {
    id: string;
    title: string;
    status: "Pending" | "In Progress" | "Completed";
    inCharge: string[]; // Array of people assigned to task
    latestUpdate: string;
    projectId: ProjectId;
    createdAt: number;
}
