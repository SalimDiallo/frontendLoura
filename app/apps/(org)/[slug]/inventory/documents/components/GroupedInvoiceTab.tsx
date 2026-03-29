"use client";

import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { getCustomers } from "@/lib/services/inventory";
import {
    generateGroupedInvoicePdf,
    getFilterableSales,
    type FilterableSale,
    type FilterableSaleItem,
} from "@/lib/services/inventory/stats.service";
import type { Customer } from "@/lib/types/inventory";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Download,
    FileText,
    Filter,
    Layers,
    Loader2,
    ShoppingCart,
    Trash2,
    User,
    X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ===== Types =====
interface SelectedItem {
    saleId: string;
    saleNumber: string;
    saleDate: string | null;
    customerName: string;
    itemId: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface GroupedInvoiceTabProps {
    slug: string;
}

export default function GroupedInvoiceTab({ slug }: GroupedInvoiceTabProps) {
    // === Filters ===
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterCustomerId, setFilterCustomerId] = useState<string>("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");

    // === Sales Data ===
    const [sales, setSales] = useState<FilterableSale[]>([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

    // === Selection ===
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // === Preview / Generation ===
    const [showPreview, setShowPreview] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [invoiceTitle, setInvoiceTitle] = useState("");
    const [invoiceNotes, setInvoiceNotes] = useState("");
    const [generating, setGenerating] = useState(false);

    // === Customer Autocomplete ===
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerRef = useRef<HTMLDivElement>(null);

    // === UI ===
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load customers for filter autocomplete
    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const data = await getCustomers({ is_active: true });
                setCustomers(data);
            } catch (err) {
                console.error("Erreur chargement clients:", err);
            }
        };
        loadCustomers();
        generateInvoiceNumber();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const generateInvoiceNumber = () => {
        const now = new Date();
        const num = `FG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
        setInvoiceNumber(num);
    };

    // === Load Sales ===
    const loadSales = useCallback(async () => {
        setLoadingSales(true);
        setError(null);
        try {
            const data = await getFilterableSales({
                customer: filterCustomerId || undefined,
                start_date: filterDateFrom || undefined,
                end_date: filterDateTo || undefined,
            });
            setSales(data);
        } catch (err: any) {
            setError(err.message || "Erreur lors du chargement des ventes");
        } finally {
            setLoadingSales(false);
        }
    }, [filterCustomerId, filterDateFrom, filterDateTo]);

    // Auto-load on filter change
    useEffect(() => {
        loadSales();
    }, [loadSales]);

    // === Toggle sale expand ===
    const toggleSaleExpand = (saleId: string) => {
        setExpandedSales((prev) => {
            const next = new Set(prev);
            if (next.has(saleId)) next.delete(saleId);
            else next.add(saleId);
            return next;
        });
    };

    // === Select/Deselect Item ===
    const toggleItem = (sale: FilterableSale, item: FilterableSaleItem) => {
        setSelectedItems((prev) => {
            const exists = prev.find((si) => si.itemId === item.id);
            if (exists) {
                return prev.filter((si) => si.itemId !== item.id);
            }
            return [
                ...prev,
                {
                    saleId: sale.id,
                    saleNumber: sale.sale_number,
                    saleDate: sale.sale_date,
                    customerName: sale.customer_name,
                    itemId: item.id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total,
                },
            ];
        });
    };

    // === Select/Deselect All items in a Sale ===
    const toggleAllSaleItems = (sale: FilterableSale) => {
        const allSelected = sale.items.every((item) =>
            selectedItems.some((si) => si.itemId === item.id)
        );
        if (allSelected) {
            setSelectedItems((prev) => prev.filter((si) => si.saleId !== sale.id));
        } else {
            const newItems: SelectedItem[] = sale.items
                .filter((item) => !selectedItems.some((si) => si.itemId === item.id))
                .map((item) => ({
                    saleId: sale.id,
                    saleNumber: sale.sale_number,
                    saleDate: sale.sale_date,
                    customerName: sale.customer_name,
                    itemId: item.id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total,
                }));
            setSelectedItems((prev) => [...prev, ...newItems]);
        }
    };

    // Select all visible
    const selectAllVisible = () => {
        const allItems: SelectedItem[] = [];
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                if (!selectedItems.some((si) => si.itemId === item.id)) {
                    allItems.push({
                        saleId: sale.id,
                        saleNumber: sale.sale_number,
                        saleDate: sale.sale_date,
                        customerName: sale.customer_name,
                        itemId: item.id,
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total: item.total,
                    });
                }
            });
        });
        setSelectedItems((prev) => [...prev, ...allItems]);
    };

    const clearSelection = () => setSelectedItems([]);

    // === Calculations ===
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

    // === Build Filters Summary ===
    const buildFiltersSummary = () => {
        const parts: string[] = [];
        if (filterCustomer) parts.push(`Client: ${filterCustomer}`);
        if (filterDateFrom) parts.push(`Du: ${filterDateFrom}`);
        if (filterDateTo) parts.push(`Au: ${filterDateTo}`);
        return parts.length > 0 ? parts.join(" · ") : "Aucun filtre";
    };

    // === Generate PDF ===
    const handleGenerate = async () => {
        if (selectedItems.length === 0) {
            setError("Veuillez sélectionner au moins un élément.");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            await generateGroupedInvoicePdf({
                invoice_number: invoiceNumber,
                title: invoiceTitle || "Facture Groupée",
                date: new Date().toISOString().split("T")[0],
                client_name: filterCustomer || "Divers clients",
                date_from: filterDateFrom || undefined,
                date_to: filterDateTo || undefined,
                filters_summary: buildFiltersSummary(),
                items: selectedItems.map((si) => ({
                    product_name: si.product_name,
                    quantity: si.quantity,
                    unit_price: si.unit_price,
                    sale_number: si.saleNumber,
                    sale_date: si.saleDate || undefined,
                })),
                notes: invoiceNotes || undefined,
            });
            setSuccess("Facture groupée générée avec succès !");
            setTimeout(() => setSuccess(null), 4000);
        } catch (err: any) {
            setError(err.message || "Erreur lors de la génération");
        } finally {
            setGenerating(false);
        }
    };

    // === Customer filter ===
    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(filterCustomer.toLowerCase()) ||
            (c.phone && c.phone.includes(filterCustomer))
    );

    const selectFilterCustomer = (customer: Customer) => {
        setFilterCustomer(customer.name);
        setFilterCustomerId(customer.id);
        setShowCustomerDropdown(false);
    };

    const clearCustomerFilter = () => {
        setFilterCustomer("");
        setFilterCustomerId("");
    };

    // === Render ===
    return (
        <div className="flex flex-col lg:flex-row gap-4 p-4">
            {/* ========== LEFT PANEL: Filters + Sales List ========== */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
                {/* Alerts */}
                {error && (
                    <Alert variant="error" className="animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </Alert>
                )}
                {success && (
                    <Alert variant="success" className="animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{success}</span>
                    </Alert>
                )}

                {/* Filters Card */}
                <Card className="p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Filter className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold">Filtres de recherche</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Customer Filter */}
                        <div className="relative" ref={customerRef}>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                <User className="h-3 w-3 inline mr-1" />Client
                            </label>
                            <div className="relative">
                                <Input
                                    value={filterCustomer}
                                    onChange={(e) => {
                                        setFilterCustomer(e.target.value);
                                        setFilterCustomerId("");
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    placeholder="Rechercher un client..."
                                    className="h-9 text-sm pr-8"
                                />
                                {filterCustomer && (
                                    <button
                                        onClick={clearCustomerFilter}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            {showCustomerDropdown && filterCustomer && !filterCustomerId && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="p-3 text-xs text-muted-foreground text-center">Aucun client trouvé</div>
                                    ) : (
                                        filteredCustomers.slice(0, 8).map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectFilterCustomer(c)}
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                                            >
                                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{c.name}</div>
                                                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                <Calendar className="h-3 w-3 inline mr-1" />Date début
                            </label>
                            <Input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                <Calendar className="h-3 w-3 inline mr-1" />Date fin
                            </label>
                            <Input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* Active filters badges */}
                    {(filterCustomer || filterDateFrom || filterDateTo) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Filtres actifs:</span>
                            {filterCustomer && (
                                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                    Client: {filterCustomer}
                                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={clearCustomerFilter} />
                                </Badge>
                            )}
                            {filterDateFrom && (
                                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                    Du: {filterDateFrom}
                                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setFilterDateFrom("")} />
                                </Badge>
                            )}
                            {filterDateTo && (
                                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                    Au: {filterDateTo}
                                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setFilterDateTo("")} />
                                </Badge>
                            )}
                        </div>
                    )}
                </Card>

                {/* Action Bar */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {sales.length} vente(s)
                        </Badge>
                        {selectedItems.length > 0 && (
                            <Badge className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {selectedItems.length} sélectionné(s)
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={selectAllVisible}
                            disabled={sales.length === 0}
                        >
                            <Layers className="h-3 w-3 mr-1" />
                            Tout sélectionner
                        </Button>
                        {selectedItems.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                onClick={clearSelection}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Effacer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sales List */}
                <div className="flex flex-col gap-3">
                    {loadingSales ? (
                        <Card className="p-12">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping">
                                        <ShoppingCart className="h-8 w-8 text-primary/30" />
                                    </div>
                                    <ShoppingCart className="h-8 w-8 text-primary relative" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Chargement des ventes</p>
                                    <p className="text-xs text-muted-foreground mt-1">Veuillez patienter...</p>
                                </div>
                            </div>
                        </Card>
                    ) : sales.length === 0 ? (
                        <Card className="p-8">
                            <div className="text-center">
                                <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Aucune vente trouvée avec ces filtres.</p>
                                <p className="text-xs text-muted-foreground mt-1">Modifiez les critères de recherche.</p>
                            </div>
                        </Card>
                    ) : (
                        sales.map((sale) => {
                            const isExpanded = expandedSales.has(sale.id);
                            const allItemsSelected = sale.items.every((item) =>
                                selectedItems.some((si) => si.itemId === item.id)
                            );
                            const someItemsSelected = sale.items.some((item) =>
                                selectedItems.some((si) => si.itemId === item.id)
                            );

                            return (
                                <Card key={sale.id} className={cn(
                                    "transition-all duration-300 hover:shadow-md",
                                    someItemsSelected && "ring-2 ring-primary/40 bg-primary/[0.03] shadow-sm"
                                )}>
                                    {/* Sale Header */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-accent/60 transition-all duration-200 rounded-t-lg group"
                                        onClick={() => toggleSaleExpand(sale.id)}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleAllSaleItems(sale); }}
                                            className={cn(
                                                "h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                                                allItemsSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : someItemsSelected
                                                        ? "bg-primary/30 border-primary/50"
                                                        : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            {allItemsSelected && <CheckCircle className="h-3 w-3" />}
                                            {someItemsSelected && !allItemsSelected && <div className="h-1.5 w-1.5 bg-primary rounded-sm" />}
                                        </button>

                                        {/* Sale Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold">{sale.sale_number}</span>
                                                <Badge
                                                    variant={sale.payment_status === "paid" ? "success" : sale.payment_status === "partial" ? "warning" : "secondary"}
                                                    className="text-[10px] h-4"
                                                >
                                                    {sale.payment_status === "paid" ? "Payée" : sale.payment_status === "partial" ? "Partielle" : sale.payment_status === "pending" ? "En attente" : sale.payment_status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />{sale.customer_name}
                                                </span>
                                                {sale.sale_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />{formatDate(sale.sale_date)}
                                                    </span>
                                                )}
                                                <span>{sale.items.length} article(s)</span>
                                            </div>
                                        </div>

                                        {/* Total + Expand */}
                                        <span className="text-sm font-bold tabular-nums text-primary">{formatCurrency(sale.total_amount)}</span>
                                        <div className="transition-transform duration-200 group-hover:scale-110">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>

                                    {/* Sale Items */}
                                    {isExpanded && (
                                        <div className="border-t">
                                            {sale.items.map((item) => {
                                                const isSelected = selectedItems.some((si) => si.itemId === item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleItem(sale, item)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b last:border-b-0",
                                                            isSelected ? "bg-primary/5" : "hover:bg-accent/30"
                                                        )}
                                                    >
                                                        <button
                                                            className={cn(
                                                                "h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                                                            )}
                                                        >
                                                            {isSelected && <CheckCircle className="h-2.5 w-2.5" />}
                                                        </button>
                                                        <span className="flex-1 text-sm truncate">{item.product_name}</span>
                                                        <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">x{item.quantity}</span>
                                                        <span className="text-xs text-muted-foreground tabular-nums w-24 text-right">{formatCurrency(item.unit_price)}</span>
                                                        <span className="text-sm font-medium tabular-nums w-24 text-right">{formatCurrency(item.total)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========== RIGHT PANEL: Preview / Actions ========== */}
            <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4">
                {/* Selection Summary */}
                <Card className="p-5 shadow-lg sticky top-4">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold">Facture Groupée</h3>
                            <p className="text-xs text-muted-foreground">Composez votre facture</p>
                        </div>
                        {selectedItems.length > 0 && (
                            <Badge className="text-xs h-6 animate-in fade-in zoom-in">{selectedItems.length}</Badge>
                        )}
                    </div>

                    {selectedItems.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <div className="inline-flex p-4 rounded-full bg-muted/50 mb-3">
                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Aucun article sélectionné</p>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                Sélectionnez des articles dans la liste<br />pour composer votre facture groupée
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Invoice Config */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">N° Facture</label>
                                    <Input
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Titre</label>
                                    <Input
                                        value={invoiceTitle}
                                        onChange={(e) => setInvoiceTitle(e.target.value)}
                                        placeholder="Facture Groupée - Janvier 2024"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                                    <textarea
                                        value={invoiceNotes}
                                        onChange={(e) => setInvoiceNotes(e.target.value)}
                                        placeholder="Notes optionnelles..."
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Selected Items List */}
                            <div className="border rounded-lg divide-y mb-4 max-h-52 overflow-y-auto">
                                {selectedItems.map((item) => (
                                    <div key={item.itemId} className="flex items-center gap-2 px-3 py-2 text-xs">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{item.product_name}</div>
                                            <div className="text-muted-foreground">{item.saleNumber}</div>
                                        </div>
                                        <span className="tabular-nums text-muted-foreground">x{item.quantity}</span>
                                        <span className="tabular-nums font-medium w-20 text-right">{formatCurrency(item.total)}</span>
                                        <button
                                            onClick={() => setSelectedItems((prev) => prev.filter((si) => si.itemId !== item.itemId))}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1.5 text-sm border-t pt-3">
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span className="tabular-nums text-primary">{formatCurrency(subtotal)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 mt-5 pt-4 border-t">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || selectedItems.length === 0}
                                    className="w-full h-11 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />Génération en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-5 w-5 mr-2" />Générer la facture PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Card>

                {/* Filter Summary Info */}
                {(filterCustomer || filterDateFrom || filterDateTo) && (
                    <Card className="p-3 bg-muted/30">
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="font-medium text-foreground">Résumé des filtres</div>
                            {filterCustomer && <div>• Client: <span className="font-medium">{filterCustomer}</span></div>}
                            {filterDateFrom && <div>• Début: <span className="font-medium">{filterDateFrom}</span></div>}
                            {filterDateTo && <div>• Fin: <span className="font-medium">{filterDateTo}</span></div>}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
