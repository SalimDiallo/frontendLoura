"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getOrders, confirmOrder, receiveOrder, cancelOrder } from "@/lib/services/inventory";
import type { OrderList, OrderStatus } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  Eye,
  Loader2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [slug, filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const data = await getOrders(params);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(id);
      await confirmOrder(id);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      setActionLoading(id);
      await receiveOrder(id);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cette commande ?")) return;
    try {
      setActionLoading(id);
      await cancelOrder(id);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter((o) =>
    searchTerm === "" ? true :
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const getStatusInfo = (status: OrderStatus) => {
    const info: Record<OrderStatus, { label: string; color: string; bg: string; icon: any }> = {
      draft: { label: "Brouillon", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", icon: Clock },
      pending: { label: "En attente", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: Clock },
      confirmed: { label: "Confirmée", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: CheckCircle },
      received: { label: "Reçue", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: Package },
      cancelled: { label: "Annulée", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: XCircle },
    };
    return info[status] || info.draft;
  };

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "draft").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    received: orders.filter(o => o.status === "received").length,
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

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Achats
          </h1>
          <p className="text-sm text-muted-foreground">Commandes fournisseurs</p>
        </div>
        <Button asChild>
          <Link href={`/apps/${slug}/inventory/orders/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle commande
          </Link>
        </Button>
      </div>

      {/* Stats cliquables */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus(undefined)}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterStatus === undefined ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
          )}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "pending" ? undefined : "pending")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterStatus === "pending" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "hover:border-yellow-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-2xl font-bold">{stats.pending}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">En attente</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "confirmed" ? undefined : "confirmed")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterStatus === "confirmed" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:border-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">{stats.confirmed}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Confirmées</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "received" ? undefined : "received")}
          className={cn(
            "p-3 rounded-lg border transition-all text-left",
            filterStatus === "received" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "hover:border-green-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold">{stats.received}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Reçues</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une commande..."
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
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground">Créez votre première commande fournisseur</p>
            <Button asChild className="mt-4">
              <Link href={`/apps/${slug}/inventory/orders/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle commande
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredOrders.map((order) => {
              const status = getStatusInfo(order.status);
              const StatusIcon = status.icon;
              const isLoading = actionLoading === order.id;
              
              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/apps/${slug}/inventory/orders/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Statut */}
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", status.bg)}>
                        <StatusIcon className={cn("h-5 w-5", status.color)} />
                      </div>

                      {/* Infos */}
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-medium">{order.order_number}</code>
                          <Badge variant="outline" className="text-xs">{order.item_count || 0} articles</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="font-medium">{order.supplier_name}</span>
                          <span>→</span>
                          <span>{order.warehouse_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.order_date).toLocaleDateString('fr-FR')}
                          </span>
                          {order.expected_delivery_date && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">
                                Livraison: {new Date(order.expected_delivery_date).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Montant */}
                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>

                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1">
                          {(order.status === "draft" || order.status === "pending") && (
                            <Button size="sm" variant="outline" onClick={() => handleConfirm(order.id)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmer
                            </Button>
                          )}
                          {order.status === "confirmed" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReceive(order.id)}>
                              <Package className="h-4 w-4 mr-1" />
                              Réceptionner
                            </Button>
                          )}
                          {order.status !== "received" && order.status !== "cancelled" && (
                            <Button size="sm" variant="ghost" onClick={() => handleCancel(order.id)}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/apps/${slug}/inventory/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        {filteredOrders.length} commande(s) • {filterStatus ? `Filtre: ${filterStatus}` : 'Toutes'}
      </p>
    </div>
  );
}
