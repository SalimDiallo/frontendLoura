"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getWarehouses, deleteWarehouse } from "@/lib/services/inventory";
import type { Warehouse } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  TrendingUp,
  Loader2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { DeleteConfirmation } from "@/components/common/confirmation-dialog";

export default function WarehousesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Supprime state
  const [toDelete, setToDelete] = useState<Warehouse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
    // eslint-disable-next-line
  }, [slug]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getWarehouses({ is_active: true });
      setWarehouses(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!toDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteWarehouse(toDelete.id);
      setWarehouses(w => w.filter(_w => _w.id !== toDelete.id));
      setToDelete(null);
    } catch (e: any) {
      setError(
        e?.message || "Erreur lors de la suppression de l'entrepôt"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    searchTerm === "" ? true :
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats globales
  const totalValue = warehouses.reduce((sum, w) => sum + (w.total_stock_value || 0), 0);
  const totalProducts = warehouses.reduce((sum, w) => sum + (w.product_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES} showMessage={true}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <WarehouseIcon className="h-6 w-6 text-primary" />
              Stock
            </h1>
            <p className="text-sm text-muted-foreground">Gérez vos entrepôts et lieux de stockage</p>
          </div>
          <div className="flex gap-2">
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS}>
              <Button variant="outline" asChild>
                <Link href={`/apps/${slug}/inventory/orders/new`}>
                  <Package className="mr-2 h-4 w-4" />
                  Commande achat
                </Link>
              </Button>
            </Can>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_WAREHOUSES}>
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/warehouses/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel entrepôt
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-2 bg-white dark:bg-muted border border-border shadow-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{warehouses.length}</p>
                <p className="text-xs text-muted-foreground">Entrepôts</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 bg-white dark:bg-muted border border-border shadow-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">Produits stockés</p>
              </div>
            </div>
          </Card>
          <Card className="p-2 bg-white dark:bg-muted border border-border shadow-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">Valeur totale</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un entrepôt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Error */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Liste des entrepôts */}
        {filteredWarehouses.length === 0 ? (
          <Card className="p-8 text-center">
            <WarehouseIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-medium">Aucun entrepôt</p>
            <p className="text-sm text-muted-foreground mb-2">Créez votre premier lieu de stockage</p>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_WAREHOUSES}>
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/warehouses/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un entrepôt
                </Link>
              </Button>
            </Can>
          </Card>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((warehouse) => {
              const canDelete = (warehouse.product_count || 0) === 0;
              return (
                <Card
                  key={warehouse.id}
                  className="overflow-hidden border border-border shadow-none hover:shadow-md transition-all cursor-pointer bg-white dark:bg-muted"
                  onClick={() => router.push(`/apps/${slug}/inventory/warehouses/${warehouse.id}`)}
                >
                  {/* En-tête sobre */}
                  {/* <div className="h-1 bg-gradient-to-r from-primary to-primary/60" /> */}
                  
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                          <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{warehouse.name}</h3>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{warehouse.code}</code>
                        </div>
                      </div>
                      <Badge variant={warehouse.is_active ? "success" : "secondary"}>
                        {warehouse.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {(warehouse.city || warehouse.address) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {warehouse.city || warehouse.address}
                          {warehouse.country && `, ${warehouse.country}`}
                        </span>
                      </div>
                    )}

                    {/* Stats sobres */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-md mb-2">
                      <div className="text-center">
                        <p className="text-lg font-bold">{warehouse.product_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Produits</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCurrency(warehouse.total_stock_value || 0)}</p>
                        <p className="text-xs text-muted-foreground">Valeur</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="default" size="sm" className="flex-1" asChild>
                        <Link href={`/apps/${slug}/inventory/warehouses/${warehouse.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Voir stock</span>
                        </Link>
                      </Button>
                      <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS}>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/orders/new?warehouse=${warehouse.id}`}>
                            <ShoppingCart className="h-4 w-4" />
                          </Link>
                        </Button>
                      </Can>

                      <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_WAREHOUSES}>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/warehouses/${warehouse.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </Can>
                      <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_WAREHOUSES}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-destructive hover:text-destructive${!canDelete ? " opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => {
                            if (canDelete) setToDelete(warehouse);
                          }}
                          title={
                            canDelete
                              ? "Supprimer l'entrepôt"
                              : "Impossible de supprimer cet entrepôt: il reste des produits"
                          }
                          disabled={!canDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <DeleteConfirmation
          open={!!toDelete}
          onOpenChange={open => {
            if (!open) setToDelete(null);
          }}
          itemName={toDelete?.name}
          onConfirm={handleDeleteWarehouse}
          loading={deleteLoading}
        />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          {filteredWarehouses.length} entrepôt(s) • Valeur totale: {formatCurrency(totalValue)}
        </p>
      </div>
    </Can>
  );
}
