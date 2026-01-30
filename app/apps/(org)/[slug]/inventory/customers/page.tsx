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
import { cn, formatCurrency } from "@/lib/utils";

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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez votre base de clients
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            title="Raccourcis clavier (?)"
          >
            <Keyboard className="h-3 w-3" />
          </Button>
          <Button asChild size="sm">
            <Link href={`/apps/${slug}/inventory/customers/new`}>
              <Plus className="mr-1 h-3 w-3" />
              <span className="text-xs">Nouveau client</span>
              <kbd className="ml-1 hidden sm:inline-flex h-3.5 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                N
              </kbd>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par nom, code, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 pl-7 pr-16 text-xs"
              />
              <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-3.5 items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterActive === undefined ? "default" : "outline"}
              onClick={() => setFilterActive(undefined)}
            >
              <span className="text-xs">Tous</span>
            </Button>
            <Button
              size="sm"
              variant={filterActive === true ? "default" : "outline"}
              onClick={() => setFilterActive(filterActive === true ? undefined : true)}
            >
              <span className="text-xs">Actifs</span>
            </Button>
            <Button
              size="sm"
              variant={filterActive === false ? "default" : "outline"}
              onClick={() => setFilterActive(filterActive === false ? undefined : false)}
            >
              <span className="text-xs">Inactifs</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" className="py-2 px-3 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <div>
            <h3 className="font-semibold text-xs">Erreur</h3>
            <p className="text-xs">{error}</p>
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Users className="h-4 w-4 text-foreground dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Total clients</p>
              <p className="text-lg font-bold">{customers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Clients actifs</p>
              <p className="text-lg font-bold">{customers.filter(c => c.is_active).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Crédit total</p>
              <p className="text-lg font-bold">
                {formatCurrency(customers.reduce((acc, c) => acc + (c.total_debt || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Limite dépassée</p>
              <p className="text-lg font-bold">
                {customers.filter(c => (c.total_debt || 0) > c.credit_limit).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customers List */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Client</th>
                <th className="text-left px-3 py-2 font-medium">Contact</th>
                <th className="text-left px-3 py-2 font-medium">Localisation</th>
                <th className="text-right px-3 py-2 font-medium">Dette</th>
                <th className="text-right px-3 py-2 font-medium">Limite crédit</th>
                <th className="text-center px-3 py-2 font-medium">Statut</th>
                <th className="text-center px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-7 px-3 text-xs text-muted-foreground">
                    <Users className="h-7 w-7 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Aucun client trouvé</p>
                    <p className="text-[11px] mt-1">
                      Appuyez sur{" "}
                      <kbd className="px-1 py-[1px] rounded border bg-muted font-mono text-[11px]">N</kbd> pour ajouter un client
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
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-xs">{customer.name}</div>
                          {customer.code && (
                            <code className="text-[10px] bg-muted px-1 py-[1px] rounded">
                              {customer.code}
                            </code>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="h-2.5 w-2.5 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                        <span>{customer.city || customer.address || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={cn(
                        "font-bold text-xs",
                        (customer.total_debt || 0) > 0 && "text-orange-600",
                        (customer.total_debt || 0) > customer.credit_limit && "text-red-600"
                      )}>
                        {formatCurrency(customer.total_debt || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground text-xs">
                      {formatCurrency(customer.credit_limit)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge size="sm" variant={customer.is_active ? "success" : "default"}>
                        {customer.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/customers/${customer.id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/customers/${customer.id}/edit`}>
                            <Edit className="h-3 w-3" />
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
                          <Trash2 className="h-3 w-3 text-red-500" />
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
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <p>Total: {filteredCustomers.length} client(s)</p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        Appuyez sur{" "}
        <kbd className="px-1 py-[1px] rounded border bg-muted font-mono text-[11px]">?</kbd> pour voir tous les raccourcis clavier
      </p>
    </div>
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
            className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px] min-w-[18px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
