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

// Budget Item Types
export type BudgetItemType = "prop" | "assistance";
export type PaymentStatus = "delayed" | "paid" | "due";
export type PaymentType = "gcash" | "cash";

export interface PayerPayment {
    name: string;
    amountToPay: number;
    amountPaid: number;
    lastUpdated: number; // timestamp
    status: PaymentStatus;
    paymentType: PaymentType;
}

export interface BudgetItem {
    id: string;
    name: string;
    type: BudgetItemType;
    cost: number; // unit price per item
    quantity: number;
    otherFee: number;
    hasLaborFee: boolean; // checkbox to enable labor fee
    laborFee: number; // labor fee amount
    total: number; // calculated as (cost * quantity) + otherFee + laborFee
    link: string; // optional product link
    payers: PayerPayment[];
    projectId: ProjectId;
    createdAt: number;
}

// Note Types
export type NoteColor = "default" | "yellow" | "green" | "blue" | "pink" | "purple";

export interface Note {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    color: NoteColor;
    projectId: ProjectId;
    createdAt: number;
    updatedAt: number;
}

// People Preset Types (for reusable people selections)
export interface PeoplePreset {
    id: string;
    name: string;
    people: string[];
    createdAt: number;
}
