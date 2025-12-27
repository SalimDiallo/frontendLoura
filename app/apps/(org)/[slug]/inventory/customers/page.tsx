"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getCustomers, deleteCustomer } from "@/lib/services/inventory";
import type { Customer } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  Trash2,
  Edit,
  CreditCard,
  Keyboard,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
          Math.min(prev + 1, filteredCustomers.length - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const customer = filteredCustomers[selectedIndex];
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

  const filteredCustomers = customers.filter((customer) =>
    searchTerm === ""
      ? true
      : customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <Card className="w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Raccourcis clavier
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
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
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirmId)}>
                Supprimer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre base de clients
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
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/customers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
              <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs">
                N
              </kbd>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par nom, code, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterActive === undefined ? "default" : "outline"}
              onClick={() => setFilterActive(undefined)}
            >
              Tous
            </Button>
            <Button
              variant={filterActive === true ? "default" : "outline"}
              onClick={() => setFilterActive(filterActive === true ? undefined : true)}
            >
              Actifs
            </Button>
            <Button
              variant={filterActive === false ? "default" : "outline"}
              onClick={() => setFilterActive(filterActive === false ? undefined : false)}
            >
              Inactifs
            </Button>
          </div>
        </div>
      </Card>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total clients</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clients actifs</p>
              <p className="text-2xl font-bold">{customers.filter(c => c.is_active).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crédit total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(customers.reduce((acc, c) => acc + (c.total_debt || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Limite dépassée</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => (c.total_debt || 0) > c.credit_limit).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customers List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-left p-4 font-medium">Localisation</th>
                <th className="text-right p-4 font-medium">Dette</th>
                <th className="text-right p-4 font-medium">Limite crédit</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun client trouvé</p>
                    <p className="text-sm mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour ajouter un client
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/customers/${customer.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                    <td className="p-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{customer.city || customer.address || "-"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "font-bold",
                        (customer.total_debt || 0) > 0 && "text-orange-600",
                        (customer.total_debt || 0) > customer.credit_limit && "text-red-600"
                      )}>
                        {formatCurrency(customer.total_debt || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground">
                      {formatCurrency(customer.credit_limit)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={customer.is_active ? "success" : "default"}>
                        {customer.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/customers/${customer.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Total: {filteredCustomers.length} client(s)</p>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour voir tous les raccourcis clavier
      </p>
    </div>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
