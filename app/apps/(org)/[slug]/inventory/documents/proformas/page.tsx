"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Badge } from "@/components/ui";
import { getProformas, deleteProforma, convertProformaToSale, getWarehouses } from "@/lib/services/inventory";
import type { ProformaInvoice, Warehouse } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  FileText,
  Calendar,
  Eye,
  Trash2,
  Download,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProformasPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [proformas, setProformas] = useState<ProformaInvoice[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [convertModal, setConvertModal] = useState<{ proforma: ProformaInvoice; warehouseId: string } | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadData();
  }, [slug, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [proformasData, warehousesData] = await Promise.all([
        getProformas({ status: filterStatus }),
        getWarehouses(),
      ]);
      setProformas(proformasData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProforma(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const handleConvert = async () => {
    if (!convertModal) return;
    try {
      setConverting(true);
      await convertProformaToSale(convertModal.proforma.id, convertModal.warehouseId);
      setConvertModal(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la conversion");
    } finally {
      setConverting(false);
    }
  };

  const filteredProformas = proformas.filter((p) =>
    searchTerm === ""
      ? true
      : p.proforma_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "converted": return "success";
      case "accepted": return "success";
      case "sent": return "warning";
      case "draft": return "default";
      case "rejected": return "error";
      case "expired": return "error";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Supprimer la pro forma</h2>
            <p className="text-muted-foreground mb-6">
              Cette action est irréversible. Voulez-vous continuer ?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirmId)}>Supprimer</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Convert Modal */}
      {convertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Convertir en vente</h2>
            <p className="text-muted-foreground mb-4">
              Sélectionnez l'entrepôt pour la vente :
            </p>
            <select
              value={convertModal.warehouseId}
              onChange={(e) => setConvertModal({ ...convertModal, warehouseId: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mb-6"
            >
              <option value="">Choisir un entrepôt</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConvertModal(null)}>Annuler</Button>
              <Button 
                onClick={handleConvert} 
                disabled={converting || !convertModal.warehouseId}
              >
                {converting ? "Conversion..." : "Convertir en vente"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Factures Pro Forma</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos devis et factures pro forma
          </p>
        </div>
        <Button asChild>
          <Link href={`/apps/${slug}/inventory/documents/proformas/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle pro forma
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
              variant={filterStatus === "draft" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "draft" ? undefined : "draft")}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Brouillons
            </Button>
            <Button
              variant={filterStatus === "sent" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "sent" ? undefined : "sent")}
              size="sm"
            >
              Envoyées
            </Button>
            <Button
              variant={filterStatus === "accepted" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "accepted" ? undefined : "accepted")}
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Acceptées
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{filteredProformas.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">
                {proformas.filter((p) => ["draft", "sent"].includes(p.status)).length}
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
              <p className="text-sm text-muted-foreground">Converties</p>
              <p className="text-2xl font-bold">
                {proformas.filter((p) => p.status === "converted").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expirées</p>
              <p className="text-2xl font-bold">
                {proformas.filter((p) => p.status === "expired" || p.is_expired).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Proformas List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">N° Pro Forma</th>
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-left p-4 font-medium">Date d'émission</th>
                <th className="text-left p-4 font-medium">Validité</th>
                <th className="text-right p-4 font-medium">Montant</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProformas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune pro forma trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredProformas.map((proforma) => (
                  <tr
                    key={proforma.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/apps/${slug}/inventory/documents/proformas/${proforma.id}`)}
                  >
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {proforma.proforma_number}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">
                        {proforma.customer_name_display || proforma.client_name || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(proforma.issue_date).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        proforma.is_expired && "text-red-600"
                      )}>
                        {new Date(proforma.validity_date).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatCurrency(proforma.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={getStatusVariant(proforma.status)}>
                        {proforma.status_display || proforma.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/documents/proformas/${proforma.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {proforma.status !== "converted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConvertModal({ proforma, warehouseId: "" })}
                            title="Convertir en vente"
                          >
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(proforma.id)}
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
    </div>
  );
}
