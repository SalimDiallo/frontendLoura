"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { deleteCustomer, getCustomers } from "@/lib/services/inventory";
import type { Customer } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Edit,
  Eye,
  Filter,
  Keyboard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SortField = "name" | "total_purchases" | "total_debt";
type SortOrder = "asc" | "desc";
type PeriodFilter = "all" | "current_month" | "last_month" | "custom";

export default function CustomersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Nouveaux états pour les filtres avancés
  const [sortField, setSortField] = useState<SortField>("total_purchases");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("current_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadCustomers();
  }, [slug, filterActive]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
          return;
        }
        if (isInputFocused) {
          (document.activeElement as HTMLElement).blur();
          setSearchTerm("");
          return;
        }
        setSelectedIndex(-1);
        return;
      }

      if (isInputFocused) return;

      if ((e.ctrlKey && e.key === "k") || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push(`/apps/${slug}/inventory/customers/new`);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredAndSortedCustomers.length - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const customer = filteredAndSortedCustomers[selectedIndex];
        if (customer) {
          router.push(`/apps/${slug}/inventory/customers/${customer.id}`);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router, showShortcuts, selectedIndex, deleteConfirmId]);

  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers({ is_active: filterActive });
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      setDeleteConfirmId(null);
      loadCustomers();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  // Fonction pour filtrer par période (basée sur created_at)
  const filterByPeriod = (customer: Customer): boolean => {
    if (periodFilter === "all") return true;

    const customerDate = new Date(customer.created_at);
    const now = new Date();

    if (periodFilter === "current_month") {
      return (
        customerDate.getMonth() === now.getMonth() &&
        customerDate.getFullYear() === now.getFullYear()
      );
    }

    if (periodFilter === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return (
        customerDate.getMonth() === lastMonth.getMonth() &&
        customerDate.getFullYear() === lastMonth.getFullYear()
      );
    }

    if (periodFilter === "custom") {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate) : new Date(0);
      const end = customEndDate ? new Date(customEndDate) : new Date();
      return customerDate >= start && customerDate <= end;
    }

    return true;
  };

  // Filtrer et trier les clients
  const filteredAndSortedCustomers = customers
    .filter((customer) =>
      searchTerm === ""
        ? true
        : customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(filterByPeriod)
    .sort((a, b) => {
      let aValue: any = a[sortField] || 0;
      let bValue: any = b[sortField] || 0;

      if (sortField === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  // Top 5 clients par chiffre d'affaires
  const topCustomers = [...customers]
    .filter((c) => (c.total_purchases || 0) > 0)
    .sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0))
    .slice(0, 5);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60" role="status">
        <div className="text-center">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-xs text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS} showMessage>
      <div className="space-y-4 p-4">
        {/* Shortcuts Modal */}
        {showShortcuts && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowShortcuts(false)}
          >
            <Card className="w-full max-w-xs p-3 m-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Raccourcis clavier
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1.5">
                <ShortcutItem keys={["Ctrl", "K"]} description="Rechercher" />
                <ShortcutItem keys={["N"]} description="Nouveau client" />
                <ShortcutItem keys={["↑", "↓"]} description="Naviguer" />
                <ShortcutItem keys={["Enter"]} description="Voir le détail" />
                <ShortcutItem keys={["Esc"]} description="Annuler" />
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-xs p-4 m-3">
              <h2 className="text-base font-bold mb-2">Confirmer la suppression</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
              </p>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                  Annuler
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(deleteConfirmId)}>
                  Supprimer
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez votre base de clients et analysez les performances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              title="Raccourcis clavier (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_CUSTOMERS}>
              <Button asChild size="sm">
                <Link href={`/apps/${slug}/inventory/customers/new`}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nouveau client
                  <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs">
                    N
                  </kbd>
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Erreur</h3>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Top Clients Section */}
        {topCustomers.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <h2 className="text-base font-bold">Top 5 Clients</h2>
              <Badge variant="outline" size="sm">Par chiffre d'affaires</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="relative p-3 rounded-lg border bg-gradient-to-br from-background to-muted/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/apps/${slug}/inventory/customers/${customer.id}`)}
                >
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{customer.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">CA</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(customer.total_purchases || 0)}
                      </span>
                    </div>
                    {(customer.total_debt || 0) > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Dette</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(customer.total_debt || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total clients</p>
                <p className="text-xl font-bold">{customers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">CA Total</p>
                <p className="text-base font-bold break-words">
                  {formatCurrency(customers.reduce((acc, c) => acc + (c.total_purchases || 0), 0))}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
                <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Crédit total</p>
                <p className="text-xl font-bold">
                  {formatCurrency(customers.reduce((acc, c) => acc + (c.total_debt || 0), 0))}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Limite dépassée</p>
                <p className="text-xl font-bold">
                  {customers.filter((c) => (c.total_debt || 0) > c.credit_limit).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-3">
          <div className="space-y-3">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Rechercher par nom, code, email ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-20"
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                    Ctrl+K
                  </kbd>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterActive === undefined ? "default" : "outline"}
                  onClick={() => setFilterActive(undefined)}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={filterActive === true ? "default" : "outline"}
                  onClick={() => setFilterActive(filterActive === true ? undefined : true)}
                >
                  Actifs
                </Button>
                <Button
                  size="sm"
                  variant={filterActive === false ? "default" : "outline"}
                  onClick={() => setFilterActive(filterActive === false ? undefined : false)}
                >
                  Inactifs
                </Button>
                <Button
                  size="sm"
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-3 border-t space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Period Filter */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Période
                    </label>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={periodFilter === "all" ? "default" : "outline"}
                        onClick={() => setPeriodFilter("all")}
                        className="text-xs"
                      >
                        Tout
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "current_month" ? "default" : "outline"}
                        onClick={() => setPeriodFilter("current_month")}
                        className="text-xs"
                      >
                        Ce mois
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "last_month" ? "default" : "outline"}
                        onClick={() => setPeriodFilter("last_month")}
                        className="text-xs"
                      >
                        Mois dernier
                      </Button>
                      <Button
                        size="sm"
                        variant={periodFilter === "custom" ? "default" : "outline"}
                        onClick={() => setPeriodFilter("custom")}
                        className="text-xs"
                      >
                        Personnalisé
                      </Button>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Trier par
                    </label>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={sortField === "name" ? "default" : "outline"}
                        onClick={() => toggleSort("name")}
                        className="text-xs"
                      >
                        Nom
                        {sortField === "name" && (
                          <ArrowDownUp className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={sortField === "total_purchases" ? "default" : "outline"}
                        onClick={() => toggleSort("total_purchases")}
                        className="text-xs"
                      >
                        CA
                        {sortField === "total_purchases" && (
                          <ArrowDownUp className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={sortField === "total_debt" ? "default" : "outline"}
                        onClick={() => toggleSort("total_debt")}
                        className="text-xs"
                      >
                        Dette
                        {sortField === "total_debt" && (
                          <ArrowDownUp className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Custom Date Range */}
                {periodFilter === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">Date début</label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">Date fin</label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Customers List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Client</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Localisation</th>
                  <th className="text-right px-4 py-3 font-semibold">CA</th>
                  <th className="text-right px-4 py-3 font-semibold">Dette</th>
                  <th className="text-right px-4 py-3 font-semibold">Limite</th>
                  <th className="text-center px-4 py-3 font-semibold">Statut</th>
                  <th className="text-center px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filteredAndSortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 px-4">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Aucun client trouvé</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour ajouter un client
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={cn(
                        "border-b transition-colors cursor-pointer",
                        selectedIndex === index
                          ? "bg-primary/5 ring-1 ring-primary ring-inset"
                          : "hover:bg-muted/30"
                      )}
                      onClick={() => setSelectedIndex(index)}
                      onDoubleClick={() =>
                        router.push(`/apps/${slug}/inventory/customers/${customer.id}`)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-primary">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.code && (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {customer.code}
                              </code>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {customer.city || customer.address || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(customer.total_purchases || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            (customer.total_debt || 0) > 0 && "text-orange-600",
                            (customer.total_debt || 0) > customer.credit_limit && "text-red-600"
                          )}
                        >
                          {formatCurrency(customer.total_debt || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(customer.credit_limit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge size="sm" variant={customer.is_active ? "success" : "default"}>
                          {customer.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS}>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/apps/${slug}/inventory/customers/${customer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_CUSTOMERS}>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/apps/${slug}/inventory/customers/${customer.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_CUSTOMERS}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(customer.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <p>
            {filteredAndSortedCustomers.length} client(s) affiché(s) sur {customers.length}
          </p>
          <p className="text-xs">
            Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour les raccourcis
          </p>
        </div>
      </div>
    </Can>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{description}</span>
      <div className="flex gap-0.5">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs min-w-[20px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
