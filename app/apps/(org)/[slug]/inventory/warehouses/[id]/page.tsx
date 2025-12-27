"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getWarehouse, getWarehouseInventory, getWarehouseStats, getMovements } from "@/lib/services/inventory";
import type { Warehouse, Stock, WarehouseStats, Movement } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  MapPin,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Plus,
  Loader2,
  Phone,
  Mail,
  User,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const warehouseId = params.id as string;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<Stock[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");

  useEffect(() => {
    loadWarehouseDetails();
  }, [warehouseId]);

  const loadWarehouseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [warehouseData, inventoryData, statsData, movementsData] = await Promise.all([
        getWarehouse(warehouseId),
        getWarehouseInventory(warehouseId).catch(() => []),
        getWarehouseStats(warehouseId).catch(() => null),
        getMovements({ warehouse: warehouseId }).catch(() => []),
      ]);

      setWarehouse(warehouseData);
      setInventory(inventoryData);
      setStats(statsData);
      setMovements(movementsData.slice(0, 10)); // Derniers 10 mouvements
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const filteredInventory = inventory.filter((s) =>
    searchTerm === "" ? true :
    s.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in": return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "out": return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case "transfer": return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-orange-600" />;
    }
  };

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

  if (error || !warehouse) {
    return (
      <div className="p-6">
        <Alert variant="error">{error || "Entrepôt introuvable"}</Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}/inventory/warehouses`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{warehouse.name}</h1>
              <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                {warehouse.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <code className="text-sm text-muted-foreground">{warehouse.code}</code>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/movements/new?warehouse=${warehouseId}`}>
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Entrée de stock
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/warehouses/${warehouseId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Infos & Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Infos entrepôt */}
        <Card className="p-4 md:col-span-2">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">Informations</h3>
          <div className="space-y-3">
            {(warehouse.address || warehouse.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  {warehouse.address && <p>{warehouse.address}</p>}
                  <p>{warehouse.city}{warehouse.country && `, ${warehouse.country}`}</p>
                </div>
              </div>
            )}
            {warehouse.manager_name && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{warehouse.manager_name}</span>
              </div>
            )}
            {warehouse.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{warehouse.phone}</span>
              </div>
            )}
            {warehouse.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{warehouse.email}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 mx-auto mb-2 flex items-center justify-center">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{stats?.unique_products || inventory.length}</p>
          <p className="text-xs text-muted-foreground">Produits</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 mx-auto mb-2 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{new Intl.NumberFormat("fr-FR").format(stats?.total_quantity || 0)}</p>
          <p className="text-xs text-muted-foreground">Unités</p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 mx-auto mb-2 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats?.total_value || warehouse.total_stock_value || 0)}</p>
          <p className="text-xs text-muted-foreground">Valeur</p>
        </Card>
      </div>

      {/* Alertes */}
      {stats && stats.low_stock_products > 0 && (
        <Alert variant="warning" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span><strong>{stats.low_stock_products}</strong> produit(s) en stock bas</span>
        </Alert>
      )}

      {/* Actions rapides */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/movements/new?warehouse=${warehouseId}&type=in`}>
            <ArrowDownCircle className="mr-2 h-4 w-4 text-green-600" />
            Entrée
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/movements/new?warehouse=${warehouseId}&type=out`}>
            <ArrowUpCircle className="mr-2 h-4 w-4 text-red-600" />
            Sortie
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/movements/new?warehouse=${warehouseId}&type=transfer`}>
            <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-600" />
            Transfert
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/orders/new?warehouse=${warehouseId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Commander
          </Link>
        </Button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "stock" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("stock")}
        >
          <Package className="inline-block mr-2 h-4 w-4" />
          Stock ({inventory.length})
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "movements" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("movements")}
        >
          <Clock className="inline-block mr-2 h-4 w-4" />
          Mouvements récents
        </button>
      </div>

      {/* Contenu onglet Stock */}
      {activeTab === "stock" && (
        <Card className="p-4">
          {/* Recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">Aucun stock</p>
              <p className="text-sm text-muted-foreground mb-4">Cet entrepôt est vide</p>
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/movements/new?warehouse=${warehouseId}&type=in`}>
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Ajouter du stock
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map((stock) => {
                const isLowStock = stock.quantity <= 10;
                const value = stock.quantity * (stock.unit_cost || 0);
                return (
                  <div
                    key={stock.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                      isLowStock && "bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                    )}
                    onClick={() => router.push(`/apps/${slug}/inventory/products/${stock.product}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isLowStock ? "bg-orange-100 dark:bg-orange-900/30" : "bg-primary/10"
                      )}>
                        <Package className={cn("h-5 w-5", isLowStock ? "text-orange-600" : "text-primary")} />
                      </div>
                      <div>
                        <p className="font-medium">{stock.product_name}</p>
                        <code className="text-xs text-muted-foreground">{stock.product_sku}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={cn("text-xl font-bold", isLowStock && "text-orange-600")}>
                          {stock.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">unités</p>
                      </div>
                      <div className="text-right w-28">
                        <p className="font-medium">{formatCurrency(value)}</p>
                        <p className="text-xs text-muted-foreground">valeur</p>
                      </div>
                      {isLowStock && (
                        <Badge variant="error" className="animate-pulse">Stock bas</Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Contenu onglet Mouvements */}
      {activeTab === "movements" && (
        <Card className="p-4">
          {movements.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">Aucun mouvement</p>
              <p className="text-sm text-muted-foreground">Pas encore de mouvement dans cet entrepôt</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getMovementIcon(mov.movement_type)}
                    <div>
                      <p className="font-medium">{mov.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(mov.movement_date).toLocaleDateString("fr-FR")} • {mov.reference || "Sans référence"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      mov.movement_type === "in" && "text-green-600",
                      mov.movement_type === "out" && "text-red-600",
                      mov.movement_type === "transfer" && "text-blue-600"
                    )}>
                      {mov.movement_type === "in" ? "+" : mov.movement_type === "out" ? "-" : "↔"}{mov.quantity}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/apps/${slug}/inventory/movements?warehouse=${warehouseId}`}>
                    Voir tous les mouvements
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
