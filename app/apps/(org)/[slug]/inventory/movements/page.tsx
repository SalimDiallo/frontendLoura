"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getMovements } from "@/lib/services/inventory";
import type { Movement } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Settings,
  Package,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

export default function MovementsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadMovements();
  }, [slug, filterType]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterType) params.type = filterType;
      const data = await getMovements(params);
      setMovements(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) =>
    searchTerm === ""
      ? true
      : m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'out': return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'adjustment': return <Settings className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string): "success" | "error" | "info" | "default" => {
    switch (type) {
      case 'in': return 'success';
      case 'out': return 'error';
      case 'transfer': return 'info';
      default: return 'default';
    }
  };

  // Stats
  const totalIn = movements.filter(m => m.movement_type === 'in').length;
  const totalOut = movements.filter(m => m.movement_type === 'out').length;
  const totalTransfer = movements.filter(m => m.movement_type === 'transfer').length;

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK} showMessage={true}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK} showMessage={true}>
      <div className="p-6 space-y-4">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mouvements</h1>
          <p className="text-sm text-muted-foreground">Entrées, sorties et transferts de stock</p>
        </div>
        <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK}>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/movements/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau
            </Link>
          </Button>
        </Can>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterType(filterType === "in" ? undefined : "in")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterType === "in" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "hover:border-green-300"
          )}
        >
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold">{totalIn}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Entrées</p>
        </button>
        <button
          onClick={() => setFilterType(filterType === "out" ? undefined : "out")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterType === "out" ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "hover:border-red-300"
          )}
        >
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold">{totalOut}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sorties</p>
        </button>
        <button
          onClick={() => setFilterType(filterType === "transfer" ? undefined : "transfer")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterType === "transfer" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">{totalTransfer}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Transferts</p>
        </button>
      </div>

      {/* Search simple */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Liste */}
      <Card>
        {filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">Aucun mouvement</p>
            <p className="text-sm text-muted-foreground">Les mouvements de stock apparaîtront ici</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMovements.map((m) => (
              <div
                key={m.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => router.push(`/apps/${slug}/inventory/movements/${m.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Icône type */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    m.movement_type === 'in' && "bg-green-100 dark:bg-green-900/30",
                    m.movement_type === 'out' && "bg-red-100 dark:bg-red-900/30",
                    m.movement_type === 'transfer' && "bg-blue-100 dark:bg-blue-900/30",
                    !['in', 'out', 'transfer'].includes(m.movement_type) && "bg-muted"
                  )}>
                    {getIcon(m.movement_type)}
                  </div>

                  {/* Infos */}
                  <div>
                    <p className="font-medium">{m.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(m.movement_date).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span>{m.warehouse_name}</span>
                      {m.destination_warehouse_name && (
                        <>
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>{m.destination_warehouse_name}</span>
                        </>
                      )}
                    </div>
                    {/* Fournisseur ou Client */}
                    {m.supplier_name && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        📦 Fournisseur: {m.supplier_name}
                      </p>
                    )}
                    {m.customer_name && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        👤 Client: {m.customer_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantité + badges + actions */}
                <div className="flex items-center gap-3">
                  {/* Badges commande/vente */}
                  {m.order_number && (
                    <Badge variant="info" className="text-xs">
                      CMD {m.order_number}
                    </Badge>
                  )}
                  {m.sale_number && (
                    <Badge variant="success" className="text-xs">
                      VTE {m.sale_number}
                    </Badge>
                  )}
                  <span className={cn(
                    "font-bold text-lg min-w-[60px] text-right",
                    m.movement_type === 'in' && "text-green-600",
                    m.movement_type === 'out' && "text-red-600"
                  )}>
                    {m.movement_type === 'out' ? '-' : '+'}{m.quantity}
                  </span>
                  <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                    <Link href={`/apps/${slug}/inventory/movements/${m.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        {filteredMovements.length} mouvement(s) • {filterType ? `Filtre: ${filterType}` : 'Tous les types'}
      </p>
    </div>
    </Can>
  );
}
