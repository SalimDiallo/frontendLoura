"use client";

import { Can } from "@/components/apps/common/protected-route";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { cancelOrder, confirmOrder, getOrders, receiveOrder } from "@/lib/services/inventory";
import type { OrderList } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import { getStatusInfo } from "@/lib/utils/BadgeStatus";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  // Dialog UI state for each action (use IDs to avoid conflict)
  const [confirmDialogOrderId, setConfirmDialogOrderId] = useState<string | null>(null);
  const [receiveDialogOrderId, setReceiveDialogOrderId] = useState<string | null>(null);
  const [cancelDialogOrderId, setCancelDialogOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "draft").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    received: orders.filter(o => o.status === "received").length,
  };

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS} showMessage={true}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Can>
    );
  }

  // Find selected order for dialogs
  // const selectedConfirmOrder = orders.find(o => o.id === confirmDialogOrderId);
  // const selectedReceiveOrder = orders.find(o => o.id === receiveDialogOrderId);
  // const selectedCancelOrder = orders.find(o => o.id === cancelDialogOrderId);

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS} showMessage={true}>
      <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Approvisionnement du Stock
          </h1>
          <p className="text-sm text-muted-foreground">Commandes fournisseurs</p>
        </div>
        <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS}>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/orders/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle commande
            </Link>
          </Button>
        </Can>
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
            filterStatus === "confirmed" ? "border-foreground bg-blue-50 dark:bg-blue-900/20" : "hover:border-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-foreground" />
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
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS}>
              <Button asChild className="mt-4">
                <Link href={`/apps/${slug}/inventory/orders/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle commande
                </Link>
              </Button>
            </Can>
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
                        <StatusIcon />
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
                              <span className="text-foreground">
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
                            <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS}>
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setConfirmDialogOrderId(order.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirmer
                                </Button>
                                <ConfirmationDialog
                                  open={confirmDialogOrderId === order.id}
                                  onOpenChange={open => setConfirmDialogOrderId(open ? order.id : null)}
                                  title="Confirmer la commande"
                                  description={`Voulez-vous confirmer la commande « ${order.order_number} » auprès de ${order.supplier_name || "ce fournisseur"} ?`}
                                  confirmLabel="Confirmer"
                                  onConfirm={() => handleConfirm(order.id)}
                                  loading={actionLoading === order.id}
                                  icon="info"
                                />
                              </>
                            </Can>
                          )}
                          {order.status === "confirmed" && (
                            <Can permission={COMMON_PERMISSIONS.INVENTORY.RECEIVE_ORDERS}>
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => setReceiveDialogOrderId(order.id)}
                                >
                                  <Package className="h-4 w-4 mr-1" />
                                  Réceptionner
                                </Button>
                                <ConfirmationDialog
                                  open={receiveDialogOrderId === order.id}
                                  onOpenChange={open => setReceiveDialogOrderId(open ? order.id : null)}
                                  title="Réceptionner la commande"
                                  description={`Marquer la commande « ${order.order_number} » comme réceptionnée ?`}
                                  confirmLabel="Réceptionner"
                                  onConfirm={() => handleReceive(order.id)}
                                  loading={actionLoading === order.id}
                                  icon="success"
                                />
                              </>
                            </Can>
                          )}
                          {order.status !== "received" && order.status !== "cancelled" && (
                            <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_ORDERS}>
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCancelDialogOrderId(order.id)}
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                                <ConfirmationDialog
                                  open={cancelDialogOrderId === order.id}
                                  onOpenChange={open => setCancelDialogOrderId(open ? order.id : null)}
                                  title="Annuler la commande"
                                  description={`Êtes-vous sûr de vouloir annuler la commande « ${order.order_number} » ? Cette action est irréversible.`}
                                  confirmLabel="Confirmer l'annulation"
                                  confirmVariant="destructive"
                                  onConfirm={() => handleCancel(order.id)}
                                  loading={actionLoading === order.id}
                                  icon="warning"
                                />
                              </>
                            </Can>
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
    </Can>
  );
}
