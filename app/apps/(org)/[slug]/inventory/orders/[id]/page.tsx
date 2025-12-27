"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import {
  getOrder,
  deleteOrder,
  confirmOrder,
  receiveOrder,
  cancelOrder,
  exportOrderPdf
} from "@/lib/services/inventory";
import type { Order, OrderStatus } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building,
  Calendar,
  FileText,
  FileDown,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  TruckIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande "${order.order_number}" ?`)) {
      return;
    }

    try {
      await deleteOrder(orderId);
      router.push(`/apps/${slug}/inventory/orders`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
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
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      return;
    }

    try {
      setActionLoading(true);
      const updatedOrder = await cancelOrder(orderId);
      setOrder(updatedOrder);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation");
    } finally {
      setActionLoading(false);
    }
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPdf = async () => {
    try {
      setPdfLoading(true);
      await exportOrderPdf(orderId);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'export PDF");
    } finally {
      setPdfLoading(false);
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

  if (error || !order) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error || "Commande introuvable"}
        </Alert>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status];

  return (
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
              <h1 className="text-3xl font-bold">{order.order_number}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Commande du {new Date(order.order_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'draft' && (
            <Button onClick={handleConfirm} disabled={actionLoading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmer
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button onClick={handleReceive} disabled={actionLoading}>
              <TruckIcon className="mr-2 h-4 w-4" />
              Marquer comme reçu
            </Button>
          )}
          {(order.status === 'draft' || order.status === 'pending') && (
            <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPdf} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Télécharger PDF
          </Button>
          <Link href={`/apps/${slug}/inventory/orders/${orderId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Order Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Fournisseur et entrepôt
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Fournisseur</p>
              <Link
                href={`/apps/${slug}/inventory/suppliers/${order.supplier}`}
                className="font-medium hover:text-primary"
              >
                {order.supplier_name || order.supplier}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Entrepôt de destination</p>
              <Link
                href={`/apps/${slug}/inventory/warehouses/${order.warehouse}`}
                className="font-medium hover:text-primary"
              >
                {order.warehouse_name || order.warehouse}
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
                {new Date(order.order_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {order.expected_delivery_date && (
              <div>
                <p className="text-muted-foreground text-xs">Livraison prévue</p>
                <p className="font-medium">
                  {new Date(order.expected_delivery_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {order.actual_delivery_date && (
              <div>
                <p className="text-muted-foreground text-xs">Livraison réelle</p>
                <p className="font-medium">
                  {new Date(order.actual_delivery_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles commandés
          </h2>
          <Badge variant="outline">{order.items?.length || 0} article(s)</Badge>
        </div>

        {!order.items || order.items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun article dans cette commande</p>
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
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
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
                        {item.product_sku || '-'}
                      </code>
                    </td>
                    <td className="p-4 text-right font-semibold">{item.quantity}</td>
                    <td className="p-4 text-right">
                      <span className={item.received_quantity < item.quantity ? 'text-orange-600' : 'text-green-600'}>
                        {item.received_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'GNF',
                        maximumFractionDigits: 0,
                      }).format(item.unit_price)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'GNF',
                        maximumFractionDigits: 0,
                      }).format(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-bold">
                  <td colSpan={5} className="p-4 text-right">Total de la commande</td>
                  <td className="p-4 text-right text-lg">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'GNF',
                      maximumFractionDigits: 0,
                    }).format(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
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
            <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5"></div>
            <div>
              <p className="font-medium">Commande créée</p>
              <p className="text-muted-foreground text-xs">
                {new Date(order.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
          {order.updated_at !== order.created_at && (
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-600 mt-1.5"></div>
              <div>
                <p className="font-medium">Dernière modification</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(order.updated_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
