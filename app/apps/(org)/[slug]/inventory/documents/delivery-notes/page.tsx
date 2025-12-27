"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getDeliveryNotes, markDeliveryAsDelivered, deleteDeliveryNote } from "@/lib/services/inventory";
import type { DeliveryNote } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  Truck,
  Calendar,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  Package,
  Keyboard,
  X,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DeliveryNotesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadDeliveryNotes();
  }, [slug, filterStatus]);

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
        router.push(`/apps/${slug}/inventory/delivery-notes/new`);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredNotes.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const note = filteredNotes[selectedIndex];
        if (note) {
          router.push(`/apps/${slug}/inventory/delivery-notes/${note.id}`);
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

  const loadDeliveryNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDeliveryNotes({ status: filterStatus });
      setDeliveryNotes(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des bons de livraison");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeliveryNote(id);
      setDeleteConfirmId(null);
      loadDeliveryNotes();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      setMarkingDelivered(id);
      await markDeliveryAsDelivered(id);
      loadDeliveryNotes();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setMarkingDelivered(null);
    }
  };

  const filteredNotes = deliveryNotes.filter((note) =>
    searchTerm === ""
      ? true
      : note.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_transit":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "ready":
        return <Package className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "default" | "info" => {
    switch (status) {
      case "delivered":
        return "success";
      case "in_transit":
        return "info";
      case "ready":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
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
              <ShortcutItem keys={["N"]} description="Nouveau bon" />
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
              Êtes-vous sûr de vouloir supprimer ce bon de livraison ?
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
          <h1 className="text-3xl font-bold">Bons de livraison</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des livraisons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/delivery-notes/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau bon
              <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs">
                N
              </kbd>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total bons</p>
              <p className="text-2xl font-bold">{deliveryNotes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prêts</p>
              <p className="text-2xl font-bold">
                {deliveryNotes.filter(n => n.status === "ready").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En transit</p>
              <p className="text-2xl font-bold">
                {deliveryNotes.filter(n => n.status === "in_transit").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Livrés</p>
              <p className="text-2xl font-bold">
                {deliveryNotes.filter(n => n.status === "delivered").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par numéro, vente ou destinataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === undefined ? "default" : "outline"}
              onClick={() => setFilterStatus(undefined)}
              size="sm"
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "pending" ? undefined : "pending")}
              size="sm"
            >
              En attente
            </Button>
            <Button
              variant={filterStatus === "ready" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "ready" ? undefined : "ready")}
              size="sm"
            >
              Prêts
            </Button>
            <Button
              variant={filterStatus === "in_transit" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "in_transit" ? undefined : "in_transit")}
              size="sm"
            >
              En transit
            </Button>
            <Button
              variant={filterStatus === "delivered" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "delivered" ? undefined : "delivered")}
              size="sm"
            >
              Livrés
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

      {/* Delivery Notes List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">N° Bon</th>
                <th className="text-left p-4 font-medium">Vente</th>
                <th className="text-left p-4 font-medium">Destinataire</th>
                <th className="text-left p-4 font-medium">Adresse</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-center p-4 font-medium">Articles</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun bon de livraison trouvé</p>
                    <p className="text-sm mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer un bon
                    </p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note, index) => (
                  <tr
                    key={note.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/delivery-notes/${note.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {note.delivery_number}
                      </code>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {note.sale_number || "-"}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{note.recipient_name}</div>
                      {note.recipient_phone && (
                        <p className="text-sm text-muted-foreground">{note.recipient_phone}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-xs truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{note.delivery_address}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(note.delivery_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="default">{note.item_count || 0}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(note.status)}
                        <Badge variant={getStatusVariant(note.status)}>
                          {note.status_display}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/delivery-notes/${note.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/api/inventory/delivery-notes/${note.id}/export-pdf/`} target="_blank">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {note.status !== "delivered" && note.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDelivered(note.id);
                            }}
                            disabled={markingDelivered === note.id}
                          >
                            {markingDelivered === note.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                        {note.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(note.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
        <p>Total: {filteredNotes.length} bon(s) de livraison</p>
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
          <kbd key={i} className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
