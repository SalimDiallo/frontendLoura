"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card, PDFPreviewWrapper } from "@/components/ui";
import { PDFEndpoints, usePDF } from "@/lib/hooks";
import {
  getDeliveryNote,
  markDeliveryAsDelivered,
  updateDeliveryNote,
} from "@/lib/services/inventory";
import type { DeliveryNote } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileDown,
  Loader2,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeliveryNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const noteId = params.id as string;

  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { download, preview, downloading, previewState, closePreview } = usePDF({
    onSuccess: () => setSuccess("PDF téléchargé !"),
    onError: (err) => setError(err),
  });

  useEffect(() => {
    loadData();
  }, [noteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDeliveryNote(noteId);
      setNote(data);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      setMarkingDelivered(true);
      await markDeliveryAsDelivered(noteId);
      setSuccess("Livraison marquée comme effectuée !");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setMarkingDelivered(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await updateDeliveryNote(noteId, { status: newStatus } as any);
      setSuccess("Statut mis à jour !");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { variant: "success" | "warning" | "error" | "default"; label: string; icon: any }> = {
      pending: { variant: "default", label: "En préparation", icon: Clock },
      ready: { variant: "warning", label: "Prêt", icon: Package },
      in_transit: { variant: "default", label: "En transit", icon: Truck },
      delivered: { variant: "success", label: "Livré", icon: CheckCircle },
      cancelled: { variant: "error", label: "Annulé", icon: X },
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="error"><AlertTriangle className="h-4 w-4" /><span>Bon de livraison introuvable</span></Alert>
        <Button variant="outline" asChild><Link href={`/apps/${slug}/inventory/documents/delivery-notes`}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link></Button>
      </div>
    );
  };

  const statusConfig = getStatusConfig(note.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage>
      <div className="min-h-screen bg-gradient-to-br from-muted/20 to-background">
        <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild><Link href={`/apps/${slug}/inventory/documents/delivery-notes`}><ArrowLeft className="h-5 w-5" /></Link></Button>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6 text-primary" />Bon de livraison</h1>
                    <code className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-mono font-semibold">{note.delivery_number}</code>
                    <Badge variant={statusConfig.variant} className="gap-1"><StatusIcon className="h-3 w-3" />{statusConfig.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Créé le {formatDate(note.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => preview(
                    PDFEndpoints.deliveryNote(noteId),
                    `Bon de Livraison ${note.delivery_number}`,
                    `BL_${note.delivery_number}.pdf`
                  )}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  Prévisualiser PDF
                </Button>
                {note.status !== "delivered" && note.status !== "cancelled" && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleMarkDelivered} disabled={markingDelivered}>
                    {markingDelivered ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : <><CheckCircle className="mr-2 h-4 w-4" />Marquer livré</>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            {error && <Alert variant="error"><AlertTriangle className="h-4 w-4" /><span>{error}</span><Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></Button></Alert>}
            {success && <Alert variant="success"><CheckCircle className="h-4 w-4" /><span>{success}</span><Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSuccess(null)}><X className="h-4 w-4" /></Button></Alert>}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Progress */}
          {note.status !== "delivered" && note.status !== "cancelled" && (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" />Progression</h3>
                <div className="flex gap-2 flex-wrap">
                  {note.status === "pending" && <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("ready")} disabled={updatingStatus}><Package className="mr-1 h-3 w-3" />Prêt</Button>}
                  {(note.status === "pending" || note.status === "ready") && <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("in_transit")} disabled={updatingStatus}><Truck className="mr-1 h-3 w-3" />En transit</Button>}
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleMarkDelivered} disabled={markingDelivered}><CheckCircle className="mr-1 h-3 w-3" />Livré</Button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {["pending", "ready", "in_transit", "delivered"].map((s, idx) => {
                  const statuses = ["pending", "ready", "in_transit", "delivered"];
                  const currentIdx = statuses.indexOf(note.status);
                  const isActive = idx <= currentIdx;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      {idx > 0 && <div className={`flex-1 h-1 rounded ${isActive ? "bg-primary" : "bg-muted"}`} />}
                      <div className={`w-3 h-3 rounded-full ${isActive ? "bg-primary" : "bg-muted"}`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Préparation</span><span>Prêt</span><span>Transit</span><span>Livré</span>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><User className="h-4 w-4" />Destinataire</h3>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{note.recipient_name}</p></div>
                {note.recipient_phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{note.recipient_phone}</span></div>}
                <div className="flex items-start gap-2 text-sm"><MapPin className="h-3 w-3 text-muted-foreground mt-0.5" /><span className="text-muted-foreground">{note.delivery_address}</span></div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><Calendar className="h-4 w-4" />Dates</h3>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Livraison prévue</p><p className="font-medium">{formatDate(note.delivery_date)}</p></div>
                {note.delivered_at && <div><p className="text-xs text-muted-foreground">Livré le</p><p className="font-medium text-green-600">{formatDate(note.delivered_at)}</p></div>}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><Truck className="h-4 w-4" />Transporteur</h3>
              <div className="space-y-2">
                {note.carrier_name ? (
                  <>
                    <div><p className="text-xs text-muted-foreground">Société</p><p className="font-medium">{note.carrier_name}</p></div>
                    {note.driver_name && <div><p className="text-xs text-muted-foreground">Chauffeur</p><p className="text-sm">{note.driver_name}</p></div>}
                    {note.vehicle_info && <div><p className="text-xs text-muted-foreground">Véhicule</p><p className="text-sm">{note.vehicle_info}</p></div>}
                  </>
                ) : <p className="text-sm text-muted-foreground italic">Non défini</p>}
              </div>
            </Card>
          </div>

         {note.sale && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vente associée</p>
                    <p className="font-semibold">{note.sale_number || note.sale}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/apps/${slug}/inventory/sales/${note.sale}`}>
                    Voir la vente →
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="p-5 border-b bg-muted/30"><h3 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Articles ({note.item_count || note.items?.length || 0})</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50"><th className="text-left p-4 font-medium text-sm">#</th><th className="text-left p-4 font-medium text-sm">Produit</th><th className="text-right p-4 font-medium text-sm">Qté prévue</th><th className="text-right p-4 font-medium text-sm">Qté livrée</th><th className="text-left p-4 font-medium text-sm">Notes</th></tr></thead>
                <tbody>
                  {note.items?.map((item, idx) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4 text-sm text-muted-foreground">{idx + 1}</td>
                      <td className="p-4"><p className="font-medium">{item.product_name}</p>{item.product_sku && <p className="text-xs text-muted-foreground">{item.product_sku}</p>}</td>
                      <td className="p-4 text-right font-medium">{item.quantity}</td>
                      <td className="p-4 text-right"><span className={`font-medium ${Number(item.delivered_quantity) > 0 ? "text-green-600" : "text-muted-foreground"}`}>{item.delivered_quantity}</span></td>
                      <td className="p-4 text-sm text-muted-foreground">{item.notes || "—"}</td>
                    </tr>
                  )) || <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">Aucun article</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          {note.notes && <Card className="p-5"><h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h4><p className="text-sm whitespace-pre-wrap">{note.notes}</p></Card>}
        </div>

        <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
      </div>
    </Can>
  );
}
