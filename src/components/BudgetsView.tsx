import { useState, useMemo } from "react";
import {
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    ExternalLink,
    User,
    DollarSign,
    Smartphone,
    Banknote,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X,
    Package,
    Users,
    Hammer,
    ArrowUpDown,
    Filter,
    CheckSquare,
    Square
} from "lucide-react";
import { BudgetItem, PayerPayment, BudgetItemType, PaymentStatus, PaymentType, PeoplePreset } from "@/types";
import { IN_CHARGE_OPTIONS } from "@/data/in-charge";
import { PeopleSelector } from "./PeopleSelector";
import { clsx } from "clsx";

type SortOption = "completion" | "created" | "total";
type TypeFilter = "all" | "prop" | "assistance";

interface BudgetsViewProps {
    budgetItems: BudgetItem[];
    onAddItem: (item: Omit<BudgetItem, "id" | "createdAt">) => void;
    onUpdateItem?: (itemId: string, updates: Partial<Omit<BudgetItem, "id">>) => void;
    onDeleteItem?: (itemId: string) => void;
    onUpdatePayerPayment?: (
        itemId: string,
        currentPayers: PayerPayment[],
        payerName: string,
        updates: Partial<PayerPayment>
    ) => void;
    onAddPayer?: (
        itemId: string,
        currentPayers: PayerPayment[],
        newPayer: PayerPayment
    ) => void;
    onRemovePayer?: (
        itemId: string,
        currentPayers: PayerPayment[],
        payerName: string
    ) => void;
    presets: PeoplePreset[];
    onSavePreset: (name: string, people: string[]) => void;
    onDeletePreset: (presetId: string) => void;
}

export function BudgetsView({
    budgetItems,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onUpdatePayerPayment,
    onAddPayer,
    onRemovePayer,
    presets,
    onSavePreset,
    onDeletePreset
}: BudgetsViewProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [editingPayment, setEditingPayment] = useState<{ itemId: string, payerName: string } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    // Sort & Filter state
    const [sortBy, setSortBy] = useState<SortOption>("created");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [personFilter, setPersonFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const [newItem, setNewItem] = useState<{
        name: string;
        type: BudgetItemType;
        cost: number;
        quantity: number;
        otherFee: number;
        hasLaborFee: boolean;
        laborFee: number;
        link: string;
        selectedPayers: string[];
    }>({
        name: "",
        type: "prop",
        cost: 0,
        quantity: 1,
        otherFee: 0,
        hasLaborFee: false,
        laborFee: 0,
        link: "",
        selectedPayers: []
    });

    // Calculate total based on formula
    const calculateTotal = (cost: number, quantity: number, otherFee: number, hasLaborFee: boolean, laborFee: number) => {
        return (cost * quantity) + otherFee + (hasLaborFee ? laborFee : 0);
    };

    const calculatedTotal = calculateTotal(
        newItem.cost,
        newItem.quantity,
        newItem.otherFee,
        newItem.hasLaborFee,
        newItem.laborFee
    );

    // Calculate completion percentage
    const getCompletionPercent = (item: BudgetItem): number => {
        if (item.total === 0) return 0;
        const paid = item.payers.reduce((sum, p) => sum + p.amountPaid, 0);
        return (paid / item.total) * 100;
    };

    // Filter and sort items
    const filteredAndSortedItems = useMemo(() => {
        let result = [...budgetItems];

        // Apply filters
        if (typeFilter !== "all") {
            result = result.filter(item => item.type === typeFilter);
        }
        if (personFilter.length > 0) {
            result = result.filter(item => item.payers.some(p => personFilter.includes(p.name)));
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case "completion":
                    return getCompletionPercent(b) - getCompletionPercent(a);
                case "total":
                    return b.total - a.total;
                case "created":
                default:
                    return b.createdAt - a.createdAt;
            }
        });

        return result;
    }, [budgetItems, sortBy, typeFilter, personFilter]);

    // Get unique people from all budget items for filter
    const allPeople = useMemo(() => {
        const people = new Set<string>();
        budgetItems.forEach(item => item.payers.forEach(p => people.add(p.name)));
        return Array.from(people).sort();
    }, [budgetItems]);

    // Get payer rows for person view (when filtering by specific people)
    const personViewRows = useMemo(() => {
        if (personFilter.length === 0) return [];

        const rows: Array<{
            itemId: string;
            itemName: string;
            itemType: BudgetItemType;
            payer: PayerPayment;
        }> = [];

        budgetItems.forEach(item => {
            item.payers.forEach(payer => {
                if (personFilter.includes(payer.name)) {
                    rows.push({
                        itemId: item.id,
                        itemName: item.name,
                        itemType: item.type,
                        payer
                    });
                }
            });
        });

        // Sort by person name, then by item name
        rows.sort((a, b) => {
            if (a.payer.name !== b.payer.name) {
                return a.payer.name.localeCompare(b.payer.name);
            }
            return a.itemName.localeCompare(b.itemName);
        });

        return rows;
    }, [budgetItems, personFilter]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name) return;

        // Create payers from selected people
        const total = calculatedTotal;
        const perPersonAmount = newItem.selectedPayers.length > 0 ? total / newItem.selectedPayers.length : 0;
        const payers: PayerPayment[] = newItem.selectedPayers.map(name => ({
            name,
            amountToPay: perPersonAmount,
            amountPaid: 0,
            lastUpdated: Date.now(),
            status: "due" as PaymentStatus,
            paymentType: "gcash" as PaymentType
        }));

        onAddItem({
            name: newItem.name,
            type: newItem.type,
            cost: newItem.cost,
            quantity: newItem.quantity,
            otherFee: newItem.otherFee,
            hasLaborFee: newItem.hasLaborFee,
            laborFee: newItem.hasLaborFee ? newItem.laborFee : 0,
            total,
            link: newItem.link,
            payers,
            projectId: "lantern"
        });
        setIsAdding(false);
        setNewItem({
            name: "",
            type: "prop",
            cost: 0,
            quantity: 1,
            otherFee: 0,
            hasLaborFee: false,
            laborFee: 0,
            link: "",
            selectedPayers: []
        });
    };

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const handleAddPayer = (itemId: string, currentPayers: PayerPayment[], personName: string, totalAmount: number) => {
        const perPersonAmount = totalAmount / (currentPayers.length + 1);
        const newPayer: PayerPayment = {
            name: personName,
            amountToPay: perPersonAmount,
            amountPaid: 0,
            lastUpdated: Date.now(),
            status: "due",
            paymentType: "gcash"
        };
        const updatedExistingPayers = currentPayers.map(p => ({
            ...p,
            amountToPay: perPersonAmount
        }));
        onAddPayer?.(itemId, updatedExistingPayers, newPayer);
    };

    const handleRemovePayer = (e: React.MouseEvent, itemId: string, currentPayers: PayerPayment[], payerName: string, totalAmount: number) => {
        e.stopPropagation();
        const remainingPayers = currentPayers.filter(p => p.name !== payerName);
        if (remainingPayers.length > 0) {
            const perPersonAmount = totalAmount / remainingPayers.length;
            const updatedPayers = remainingPayers.map(p => ({
                ...p,
                amountToPay: perPersonAmount
            }));
            onUpdateItem?.(itemId, { payers: updatedPayers });
        } else {
            onRemovePayer?.(itemId, currentPayers, payerName);
        }
    };

    const handlePaymentUpdate = (itemId: string, payers: PayerPayment[], payerName: string, newAmountPaid: number) => {
        const payer = payers.find(p => p.name === payerName);
        if (!payer) return;
        let newStatus: PaymentStatus = "due";
        if (newAmountPaid >= payer.amountToPay) {
            newStatus = "paid";
        } else if (newAmountPaid > 0) {
            newStatus = "delayed";
        }
        onUpdatePayerPayment?.(itemId, payers, payerName, {
            amountPaid: newAmountPaid,
            status: newStatus
        });
        setEditingPayment(null);
        setPaymentAmount("");
    };

    const handleStatusChange = (itemId: string, payers: PayerPayment[], payerName: string, newStatus: PaymentStatus) => {
        onUpdatePayerPayment?.(itemId, payers, payerName, { status: newStatus });
    };

    const handlePaymentTypeChange = (itemId: string, payers: PayerPayment[], payerName: string, newType: PaymentType) => {
        onUpdatePayerPayment?.(itemId, payers, payerName, { paymentType: newType });
    };

    const handleDeleteItem = (itemId: string) => {
        if (confirm("Are you sure you want to delete this budget item?")) {
            onDeleteItem?.(itemId);
        }
    };

    // Batch payer operations
    const handleSelectAllPayers = (itemId: string, totalAmount: number) => {
        const perPersonAmount = totalAmount / IN_CHARGE_OPTIONS.length;
        const newPayers: PayerPayment[] = IN_CHARGE_OPTIONS.map(name => ({
            name,
            amountToPay: perPersonAmount,
            amountPaid: 0,
            lastUpdated: Date.now(),
            status: "due" as PaymentStatus,
            paymentType: "gcash" as PaymentType
        }));
        onUpdateItem?.(itemId, { payers: newPayers });
    };

    const handleDeselectAllPayers = (itemId: string) => {
        onUpdateItem?.(itemId, { payers: [] });
    };

    const handleLoadPresetPayers = (itemId: string, preset: PeoplePreset, totalAmount: number) => {
        const perPersonAmount = totalAmount / preset.people.length;
        const newPayers: PayerPayment[] = preset.people.map(name => ({
            name,
            amountToPay: perPersonAmount,
            amountPaid: 0,
            lastUpdated: Date.now(),
            status: "due" as PaymentStatus,
            paymentType: "gcash" as PaymentType
        }));
        onUpdateItem?.(itemId, { payers: newPayers });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const getTypeColor = (type: BudgetItemType) => {
        return type === "prop"
            ? "bg-purple-100 text-purple-700 border-purple-200"
            : "bg-cyan-100 text-cyan-700 border-cyan-200";
    };

    const calculateTotalPaid = (payers: PayerPayment[]) => {
        return payers.reduce((sum, p) => sum + p.amountPaid, 0);
    };

    const calculateTotalLeft = (payers: PayerPayment[]) => {
        return payers.reduce((sum, p) => sum + (p.amountToPay - p.amountPaid), 0);
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Budget Items</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
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
                        <option value="created">Sort by Created</option>
                        <option value="completion">Sort by Completion</option>
                        <option value="total">Sort by Amount</option>
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
                    {(typeFilter !== "all" || personFilter.length > 0) && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                </button>

                {/* Active Filters Display */}
                {(typeFilter !== "all" || personFilter.length > 0) && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {typeFilter !== "all" && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                                {typeFilter === "prop" ? "🎭 Prop" : "🤝 Assistance"}
                                <button onClick={() => setTypeFilter("all")} className="hover:text-purple-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {personFilter.map(person => (
                            <span key={person} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                {person}
                                <button onClick={() => setPersonFilter(personFilter.filter(p => p !== person))} className="hover:text-blue-900">
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
                            <span className="text-sm text-gray-500">Type:</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-black/10"
                            >
                                <option value="all">All</option>
                                <option value="prop">🎭 Prop</option>
                                <option value="assistance">🤝 Assistance</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <span className="text-sm text-gray-500 block mb-2">Filter by Person (shows their payments):</span>
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
                                                ? "bg-blue-600 text-white"
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

            {/* Add Item Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                                type="text"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="What do you need?"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={newItem.type}
                                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as BudgetItemType })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                            >
                                <option value="prop">🎭 Prop</option>
                                <option value="assistance">🤝 Assistance</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (per item)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newItem.cost}
                                onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Other Fee</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newItem.otherFee}
                                onChange={(e) => setNewItem({ ...newItem, otherFee: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Labor Fee Section */}
                        <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    id="hasLaborFee"
                                    checked={newItem.hasLaborFee}
                                    onChange={(e) => setNewItem({ ...newItem, hasLaborFee: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <label htmlFor="hasLaborFee" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                    <Hammer className="w-4 h-4" />
                                    Include Labor Fee
                                </label>
                            </div>
                            {newItem.hasLaborFee && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Labor Fee Amount</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newItem.laborFee}
                                        onChange={(e) => setNewItem({ ...newItem, laborFee: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Auto-calculated Total */}
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Calculated Total</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ({formatCurrency(newItem.cost)} × {newItem.quantity}) + {formatCurrency(newItem.otherFee)}
                                        {newItem.hasLaborFee && ` + ${formatCurrency(newItem.laborFee)}`}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(calculatedTotal)}</p>
                            </div>
                        </div>

                        {/* People Selector - Who will pay? */}
                        <div className="col-span-1 md:col-span-2">
                            <PeopleSelector
                                selectedPeople={newItem.selectedPayers}
                                onSelectionChange={(people) => setNewItem({ ...newItem, selectedPayers: people })}
                                presets={presets}
                                onSavePreset={onSavePreset}
                                onDeletePreset={onDeletePreset}
                                label="Who will pay?"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Link (optional)</label>
                            <input
                                type="url"
                                value={newItem.link}
                                onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="https://..."
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
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Save Item
                        </button>
                    </div>
                </form>
            )}

            {/* Person View - Show individual payment rows when filtering by people */}
            {personFilter.length > 0 && personViewRows.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Payment Details for {personFilter.length === 1 ? personFilter[0] : `${personFilter.length} People`}
                        </h3>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Person</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Paid</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Left</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Via</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {personViewRows.map((row, idx) => {
                                        const amountLeft = row.payer.amountToPay - row.payer.amountPaid;
                                        return (
                                            <tr key={`${row.itemId}-${row.payer.name}-${idx}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-gray-900">{row.payer.name}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-700">{row.itemName}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                                                        getTypeColor(row.itemType)
                                                    )}>
                                                        {row.itemType === "prop" ? "🎭" : "🤝"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {formatCurrency(row.payer.amountToPay)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-green-600 font-medium">
                                                        {formatCurrency(row.payer.amountPaid)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx(
                                                        "font-medium",
                                                        amountLeft <= 0 ? "text-green-600" : "text-orange-600"
                                                    )}>
                                                        {formatCurrency(Math.max(0, amountLeft))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        row.payer.status === "paid" && "bg-green-100 text-green-700",
                                                        row.payer.status === "delayed" && "bg-yellow-100 text-yellow-700",
                                                        row.payer.status === "due" && "bg-gray-100 text-gray-700"
                                                    )}>
                                                        {row.payer.status === "paid" ? "✅ Paid" : row.payer.status === "delayed" ? "⚠️ Delayed" : "⏱️ Due"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-500">
                                                        {row.payer.paymentType === "gcash" ? "📱 GCash" : "💵 Cash"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Summary */}
                        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6 text-sm">
                                <span className="text-gray-600">
                                    Total to Pay: <span className="font-semibold text-gray-900">
                                        {formatCurrency(personViewRows.reduce((sum, r) => sum + r.payer.amountToPay, 0))}
                                    </span>
                                </span>
                                <span className="text-gray-600">
                                    Paid: <span className="font-semibold text-green-600">
                                        {formatCurrency(personViewRows.reduce((sum, r) => sum + r.payer.amountPaid, 0))}
                                    </span>
                                </span>
                                <span className="text-gray-600">
                                    Remaining: <span className="font-semibold text-orange-600">
                                        {formatCurrency(personViewRows.reduce((sum, r) => sum + Math.max(0, r.payer.amountToPay - r.payer.amountPaid), 0))}
                                    </span>
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">{personViewRows.length} payment{personViewRows.length !== 1 ? 's' : ''} across items</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Budget Items List */}
            <div className="space-y-4">
                {personFilter.length > 0 && (
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Items containing selected people:</h3>
                )}
                {filteredAndSortedItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{budgetItems.length === 0 ? "No budget items yet for this project." : "No items match your filters."}</p>
                    </div>
                ) : (
                    filteredAndSortedItems.map((item) => {
                        const isExpanded = expandedItems.has(item.id);
                        const totalPaid = calculateTotalPaid(item.payers);
                        const totalLeft = calculateTotalLeft(item.payers);
                        const progressPercent = item.total > 0 ? (totalPaid / item.total) * 100 : 0;

                        return (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                {/* Item Header */}
                                <div
                                    onClick={() => toggleItem(item.id)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="text-gray-400">
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                                                    getTypeColor(item.type)
                                                )}>
                                                    {item.type === "prop" ? "🎭 Prop" : "🤝 Assistance"}
                                                </span>
                                                {item.link && (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-blue-500 hover:text-blue-600"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                                                <span>{formatCurrency(item.cost || 0)} × {item.quantity}</span>
                                                {item.otherFee > 0 && <span>+Other: {formatCurrency(item.otherFee)}</span>}
                                                {item.hasLaborFee && item.laborFee > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Hammer className="w-3 h-3" />
                                                        {formatCurrency(item.laborFee)}
                                                    </span>
                                                )}
                                                <span className="font-medium text-gray-700">= {formatCurrency(item.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx(
                                                        "h-full rounded-full transition-all",
                                                        progressPercent >= 100 ? "bg-green-500" : progressPercent > 0 ? "bg-yellow-500" : "bg-gray-300"
                                                    )}
                                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatCurrency(totalPaid)} / {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteItem(item.id);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                        {/* Payer Selection with Select All/None/Presets */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Who will pay? ({item.payers.length} selected)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Presets dropdown */}
                                                    {presets.length > 0 && (
                                                        <select
                                                            value=""
                                                            onChange={(e) => {
                                                                const preset = presets.find(p => p.id === e.target.value);
                                                                if (preset) {
                                                                    handleLoadPresetPayers(item.id, preset, item.total);
                                                                }
                                                            }}
                                                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                                                        >
                                                            <option value="">Load Preset...</option>
                                                            {presets.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectAllPayers(item.id, item.total)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <CheckSquare className="w-3.5 h-3.5" />
                                                        All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeselectAllPayers(item.id)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <Square className="w-3.5 h-3.5" />
                                                        None
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                                {IN_CHARGE_OPTIONS.map(person => {
                                                    const isPayer = item.payers.some(p => p.name === person);
                                                    return (
                                                        <button
                                                            key={person}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isPayer) {
                                                                    handleRemovePayer(
                                                                        { stopPropagation: () => { } } as React.MouseEvent,
                                                                        item.id,
                                                                        item.payers,
                                                                        person,
                                                                        item.total
                                                                    );
                                                                } else {
                                                                    handleAddPayer(item.id, item.payers, person, item.total);
                                                                }
                                                            }}
                                                            className={clsx(
                                                                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                                                isPayer
                                                                    ? "bg-black text-white"
                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                            )}
                                                        >
                                                            {person}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Payment Tracking Table */}
                                        {item.payers.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-700">Payment Tracking</span>
                                                </div>

                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                                <tr>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Amount Paid</th>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Left to Pay</th>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                                                                    <th className="text-left px-4 py-2 font-medium text-gray-600">Last Updated</th>
                                                                    <th className="text-center px-4 py-2 font-medium text-gray-600"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {item.payers.map(payer => {
                                                                    const amountLeft = payer.amountToPay - payer.amountPaid;
                                                                    const isEditing = editingPayment?.itemId === item.id && editingPayment?.payerName === payer.name;

                                                                    return (
                                                                        <tr key={payer.name} className="hover:bg-gray-50">
                                                                            <td className="px-4 py-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <User className="w-4 h-4 text-gray-400" />
                                                                                    <span className="font-medium text-gray-900">{payer.name}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            max={payer.amountToPay}
                                                                                            step="0.01"
                                                                                            value={paymentAmount}
                                                                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                                                                            className="w-24 px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                                                                            autoFocus
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => handlePaymentUpdate(item.id, item.payers, payer.name, parseFloat(paymentAmount) || 0)}
                                                                                            className="px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                                                                                        >
                                                                                            Save
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingPayment(null);
                                                                                                setPaymentAmount("");
                                                                                            }}
                                                                                            className="px-2 py-1 text-gray-500 text-xs hover:bg-gray-100 rounded"
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setEditingPayment({ itemId: item.id, payerName: payer.name });
                                                                                            setPaymentAmount(payer.amountPaid.toString());
                                                                                        }}
                                                                                        className="text-green-600 font-medium hover:underline"
                                                                                    >
                                                                                        {formatCurrency(payer.amountPaid)}
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <span className={clsx(
                                                                                    "font-medium",
                                                                                    amountLeft <= 0 ? "text-green-600" : "text-orange-600"
                                                                                )}>
                                                                                    {formatCurrency(Math.max(0, amountLeft))}
                                                                                </span>
                                                                                <span className="text-gray-400 text-xs ml-1">
                                                                                    / {formatCurrency(payer.amountToPay)}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <select
                                                                                    value={payer.status}
                                                                                    onChange={(e) => handleStatusChange(item.id, item.payers, payer.name, e.target.value as PaymentStatus)}
                                                                                    className={clsx(
                                                                                        "px-2 py-1 rounded-full text-xs font-medium border cursor-pointer appearance-none",
                                                                                        payer.status === "paid" && "bg-green-100 text-green-700 border-green-200",
                                                                                        payer.status === "delayed" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                                                                        payer.status === "due" && "bg-gray-100 text-gray-700 border-gray-200"
                                                                                    )}
                                                                                >
                                                                                    <option value="due">⏱️ Due</option>
                                                                                    <option value="delayed">⚠️ Delayed</option>
                                                                                    <option value="paid">✅ Paid</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <select
                                                                                    value={payer.paymentType}
                                                                                    onChange={(e) => handlePaymentTypeChange(item.id, item.payers, payer.name, e.target.value as PaymentType)}
                                                                                    className="px-2 py-1 rounded-lg text-xs font-medium border border-gray-200 cursor-pointer bg-white"
                                                                                >
                                                                                    <option value="gcash">📱 GCash</option>
                                                                                    <option value="cash">💵 Cash</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                                                {formatDate(payer.lastUpdated)}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <button
                                                                                    onClick={(e) => handleRemovePayer(e, item.id, item.payers, payer.name, item.total)}
                                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                    title="Remove payer"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Summary Footer */}
                                                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-gray-600">
                                                                Total Collected: <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                                                            </span>
                                                            <span className="text-gray-600">
                                                                Remaining: <span className="font-semibold text-orange-600">{formatCurrency(totalLeft)}</span>
                                                            </span>
                                                        </div>
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={clsx(
                                                                    "h-full rounded-full transition-all",
                                                                    progressPercent >= 100 ? "bg-green-500" : progressPercent > 0 ? "bg-yellow-500" : "bg-gray-300"
                                                                )}
                                                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Grand Total Summary */}
            {budgetItems.length > 0 && (
                <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-400 text-sm">Total Budget</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(budgetItems.reduce((sum, item) => sum + item.total, 0))}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Collected</p>
                            <p className="text-2xl font-bold text-green-400">
                                {formatCurrency(budgetItems.reduce((sum, item) => sum + calculateTotalPaid(item.payers), 0))}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Remaining</p>
                            <p className="text-2xl font-bold text-yellow-400">
                                {formatCurrency(budgetItems.reduce((sum, item) => sum + calculateTotalLeft(item.payers), 0))}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Items</p>
                            <p className="text-2xl font-bold">{budgetItems.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
