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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

export default function WarehousesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadWarehouses();
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

  const filteredWarehouses = warehouses.filter((w) =>
    searchTerm === "" ? true :
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0, notation: "compact" }).format(amount) + " GNF";

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
            <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/inventory/orders/new`}>
                <Package className="mr-2 h-4 w-4" />
                Commande achat
              </Link>
            </Button>
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
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <WarehouseIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouses.length}</p>
                <p className="text-xs text-muted-foreground">Entrepôts</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">Produits stockés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
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
          <Card className="p-12 text-center">
            <WarehouseIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-medium">Aucun entrepôt</p>
            <p className="text-sm text-muted-foreground mb-4">Créez votre premier lieu de stockage</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((warehouse) => (
              <Card
                key={warehouse.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/apps/${slug}/inventory/warehouses/${warehouse.id}`)}
              >
                {/* Header coloré */}
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <WarehouseIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{warehouse.name}</h3>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{warehouse.code}</code>
                      </div>
                    </div>
                    <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                      {warehouse.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  {(warehouse.city || warehouse.address) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{warehouse.city || warehouse.address}{warehouse.country && `, ${warehouse.country}`}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{warehouse.product_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Produits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(warehouse.total_stock_value || 0)}</p>
                      <p className="text-xs text-muted-foreground">Valeur</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <Link href={`/apps/${slug}/inventory/warehouses/${warehouse.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir stock
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/apps/${slug}/inventory/orders/new?warehouse=${warehouse.id}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_WAREHOUSES}>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/apps/${slug}/inventory/warehouses/${warehouse.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </Can>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          {filteredWarehouses.length} entrepôt(s) • Valeur totale: {formatCurrency(totalValue)}
        </p>
      </div>
    </Can>
  );
}
