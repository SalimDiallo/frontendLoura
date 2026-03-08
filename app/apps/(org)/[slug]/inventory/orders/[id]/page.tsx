"use client";

import { Badge, Button, Card } from "@/components/ui";
import {
  cancelOrder,
  confirmOrder,
  deleteOrder,
  getOrder,
  receiveOrder
} from "@/lib/services/inventory";
import type { Order, OrderStatus } from "@/lib/types/inventory";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Package,
  Trash2,
  Truck,
  TruckIcon,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Permissions & confirmations UI
import { Can } from "@/components/apps/common";
import { ConfirmationDialog, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { PDFPreviewWrapper } from "@/components/ui/pdf-preview";
import { usePDF } from "@/lib/hooks/usePDF";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "outline" | "success" | "warning" | "error" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  pending: { label: "En attente", variant: "warning" },
  confirmed: { label: "Confirmé", variant: "default" },
  received: { label: "Reçu", variant: "success" },
  cancelled: { label: "Annulé", variant: "error" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { preview, download, previewState, closePreview } = usePDF();

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la commande");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await deleteOrder(orderId);
      router.push(`/apps/${slug}/inventory/orders`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const updatedOrder = await confirmOrder(orderId);
      setOrder(updatedOrder);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la confirmation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async () => {
    try {
      setActionLoading(true);
      const updatedOrder = await receiveOrder(orderId);
      setOrder(updatedOrder);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la réception");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const updatedOrder = await cancelOrder(orderId);
      setOrder(updatedOrder);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation");
    } finally {
      setActionLoading(false);
      setCancelDialogOpen(false);
    }
  };

  const handlePreviewPdf = () => {
    if (!order) return;
    preview(
      `/inventory/orders/${orderId}/export-pdf/`,
      `Commande - ${order?.order_number}`,
      `Commande_${order?.order_number}.pdf`
    );
  };

  const handleDownloadPdf = () => {
    if (!order) return;
    download(
      `/inventory/orders/${orderId}/export-pdf/`,
      `Commande_${order?.order_number}.pdf`
    );
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


  const statusInfo = order?.status ? statusConfig[order.status] : statusConfig["draft"];

  // Helper to see if the transport info exists (at least company or mode or cost, etc.)
  const hasTransport =
    !!order?.transport_company ||
    !!order?.transport_mode ||
    !!order?.transport_cost ||
    !!order?.tracking_number ||
    !!order?.transport_notes;

  return (
 <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS} showMessage>
       <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/orders`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold">{order?.order_number}</h1>
              <Badge variant={statusInfo.variant} size="lg">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Commande du {order?.order_date && formatDate(order?.order_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">

          {/* CONFIRM button */}
          <Can  permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS} >
            {order?.status === "draft" && (
              <Button onClick={handleConfirm} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmer
              </Button>
            )}
          </Can>

          {/* RECEIVE button */}
          <Can  permission={COMMON_PERMISSIONS.INVENTORY.RECEIVE_ORDERS} >
            {order?.status === "confirmed" && (
              <Button onClick={handleReceive} disabled={actionLoading}>
                <TruckIcon className="mr-2 h-4 w-4" />
                Marquer comme reçu
              </Button>
            )}
          </Can>

          {/* CANCEL button with ConfirmationDialog */}
          <Can  permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS} >
            {(order?.status === "draft" || order?.status === "pending") && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <ConfirmationDialog
                  open={cancelDialogOpen}
                  title="Annulation de la commande"
                  description="Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible."
                  loading={actionLoading}
                  onConfirm={handleCancel}
                  onOpenChange={() => setCancelDialogOpen(false)}
                  icon="warning"
                />
              </>
            )}
          </Can>

          {/* PDF */}
          <Button variant="outline" onClick={handlePreviewPdf}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4" />
          </Button>

          {/* Edit */}
          <Can  permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS} >
            <Link href={`/apps/${slug}/inventory/orders/${orderId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </Link>
          </Can>

          {/* Delete with ConfirmationDialog */}
          <Can  permission={COMMON_PERMISSIONS.INVENTORY.DELETE_ORDERS} >
            <>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <DeleteConfirmation
                open={deleteDialogOpen}
                title="Supprimer la commande"
                description={`Êtes-vous sûr de vouloir supprimer la commande "${order?.order_number}" ? Cette action est irréversible.`}
                loading={actionLoading}
                onConfirm={handleDelete}
                onOpenChange={() => setDeleteDialogOpen(false)}
              />
            </>
          </Can>
        </div>
      </div>

      {/* Order Information */}
      <div className={`grid gap-6 md:grid-cols-${hasTransport ? "3" : "2"}`}>
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-foreground" />
            Fournisseur et entrepôt
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Fournisseur</p>
              <Link
                href={`/apps/${slug}/inventory/suppliers/${order?.supplier}`}
                className="font-medium hover:text-primary"
              >
                {order?.supplier_name || order?.supplier}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Entrepôt de destination
              </p>
              <Link
                href={`/apps/${slug}/inventory/warehouses/${order?.warehouse}`}
                className="font-medium hover:text-primary"
              >
                {order?.warehouse_name || order?.warehouse}
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Dates
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date de commande</p>
              <p className="font-medium">
                {order?.order_date && formatDate(order?.order_date)}
              </p>
            </div>
            {order?.expected_delivery_date && (
              <div>
                <p className="text-muted-foreground text-xs">
                  Livraison prévue
                </p>
                <p className="font-medium">
                  {formatDate(order?.expected_delivery_date, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}
            {order?.actual_delivery_date && (
              <div>
                <p className="text-muted-foreground text-xs">
                  Livraison réelle
                </p>
                <p className="font-medium">
                  {formatDate(order?.actual_delivery_date, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
        {/* Bloc transport s'il y a des infos de transport */}
        {hasTransport && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              Informations de transport
            </h3>
            <div className="space-y-2 text-sm">
              {order?.transport_company && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Transporteur
                  </span>
                  <p className="font-medium">{order?.transport_company}</p>
                </div>
              )}
              {order?.transport_mode && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Mode de transport
                  </span>
                  <p className="font-medium capitalize">
                    {order?.transport_mode}
                  </p>
                </div>
              )}
              {typeof order?.transport_included !== "undefined" && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Transport inclus ?
                  </span>
                  <p className="font-medium">
                    {order?.transport_included ? "Oui" : "Non"}
                  </p>
                </div>
              )}
              {!!order?.transport_cost &&
                order?.transport_cost !== "0" &&
                order?.transport_cost !== "0.00" && (
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Coût du transport
                    </span>
                    <p className="font-medium">
                      {formatCurrency(Number(order?.transport_cost))}
                    </p>
                  </div>
                )}
              {order?.tracking_number && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Numéro de suivi
                  </span>
                  <p className="font-medium">{order?.tracking_number}</p>
                </div>
              )}
              {order?.transport_notes && (
                <div>
                  <span className="text-muted-foreground text-xs">
                    Note de livraison
                  </span>
                  <p className="font-medium">{order?.transport_notes}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Order Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles commandés
          </h2>
          <Badge variant="outline">
            {order?.items?.length || 0} article(s)
          </Badge>
        </div>

        {!order?.items || order?.items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Aucun article dans cette commande
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Produit</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-right p-4 font-medium">Qté commandée</th>
                  <th className="text-right p-4 font-medium">Qté reçue</th>
                  <th className="text-right p-4 font-medium">Prix unitaire</th>
                  <th className="text-right p-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order?.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/apps/${slug}/inventory/products/${item.product}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.product_name || item.product}
                      </Link>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {item.product_sku || "-"}
                      </code>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {item.quantity}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={
                          item.received_quantity < item.quantity
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {item.received_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-bold">
                  <td colSpan={5} className="p-4 text-right">
                    Total de la commande
                  </td>
                  <td className="p-4 text-right text-lg">
                    {formatCurrency(Number(order?.total_amount) ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Notes */}
      {order?.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {order?.notes}
          </p>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historique
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-foreground mt-1.5"></div>
            <div>
              <p className="font-medium">Commande créée</p>
              <p className="text-muted-foreground text-xs">
                {order?.created_at && formatDate(order?.created_at)}
              </p>
            </div>
          </div>
          {order?.updated_at !== order?.created_at && (
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-600 mt-1.5"></div>
              <div>
                <p className="font-medium">Dernière modification</p>
                <p className="text-muted-foreground text-xs">
                {order?.updated_at && formatDate(order?.updated_at)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* PDF Preview Modal */}
      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />
    </div>
 </Can>
  );
}
