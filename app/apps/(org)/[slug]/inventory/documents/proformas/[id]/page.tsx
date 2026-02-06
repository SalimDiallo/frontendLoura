"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, Badge, Label } from "@/components/ui";
import {
  getProforma,
  updateProforma,
  convertProformaToSale,
  getWarehouses,
} from "@/lib/services/inventory";
import type { ProformaInvoice, Warehouse } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  FileDown,
  ShoppingCart,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  User,
  Package,
  Calculator,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePdfDownload } from "@/lib/hooks/usePdfDownload";

export default function ProformaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const proformaId = params.id as string;

  const [proforma, setProforma] = useState<ProformaInvoice | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [convertModal, setConvertModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { downloadPdf, downloading: downloadingPdf } = usePdfDownload({
    onSuccess: () => setSuccess("PDF téléchargé !"),
    onError: (err) => setError(err),
  });

  useEffect(() => {
    loadData();
  }, [proformaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [proformaData, warehousesData] = await Promise.all([
        getProforma(proformaId),
        getWarehouses(),
      ]);
      setProforma(proformaData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!proforma) return;
    try {
      setUpdatingStatus(true);
      await updateProforma(proformaId, { status: newStatus as any });
      setSuccess("Statut mis à jour !");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedWarehouse) return;
    try {
      setConverting(true);
      await convertProformaToSale(proformaId, selectedWarehouse);
      setConvertModal(false);
      setSuccess("Convertie en vente !");
      setTimeout(() => router.push(`/apps/${slug}/inventory/sales`), 1500);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "success" | "warning" | "error" | "default"; label: string; icon: any }> = {
      draft: { variant: "default", label: "Brouillon", icon: FileText },
      sent: { variant: "default", label: "Envoyée", icon: Mail },
      accepted: { variant: "success", label: "Acceptée", icon: CheckCircle },
      rejected: { variant: "error", label: "Refusée", icon: XCircle },
      expired: { variant: "error", label: "Expirée", icon: AlertTriangle },
      converted: { variant: "success", label: "Convertie", icon: ShoppingCart },
    };
    const c = config[status] || config.draft;
    const Icon = c.icon;
    return <Badge variant={c.variant} className="gap-1"><Icon className="h-3 w-3" />{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="error"><AlertTriangle className="h-4 w-4" /><span>Pro forma introuvable</span></Alert>
        <Button variant="outline" asChild><Link href={`/apps/${slug}/inventory/documents/proformas`}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Link></Button>
      </div>
    );
  }

  const canConvert = proforma.status === "accepted" || proforma.status === "sent";
  const canUpdate = proforma.status !== "converted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-background">
      {convertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Convertir en vente</h2>
              <Button variant="ghost" size="icon" onClick={() => setConvertModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Sélectionnez l'entrepôt</p>
            <div className="mb-6">
              <Label>Entrepôt *</Label>
              <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1">
                <option value="">Choisir...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConvertModal(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleConvert} disabled={converting || !selectedWarehouse} className="flex-1 bg-green-600 hover:bg-green-700">
                {converting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Conversion...</> : <><CheckCircle className="mr-2 h-4 w-4" />Convertir</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild><Link href={`/apps/${slug}/inventory/documents/proformas`}><ArrowLeft className="h-5 w-5" /></Link></Button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">Pro Forma</h1>
                  <code className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-mono font-semibold">{proforma.proforma_number}</code>
                  {getStatusBadge(proforma.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Créé le {formatDate(proforma.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadPdf(`/inventory/proformas/${proformaId}/export-pdf/`, `Proforma_${proforma.proforma_number}.pdf`)} disabled={downloadingPdf}>
                {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}PDF
              </Button>
              {canConvert && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConvertModal(true)}><ShoppingCart className="mr-2 h-4 w-4" />Convertir</Button>}
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
        {canUpdate && (
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="font-semibold text-sm flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" />Actions rapides</h3>
              <div className="flex gap-2 flex-wrap">
                {proforma.status === "draft" && <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("sent")} disabled={updatingStatus}><Mail className="mr-1 h-3 w-3" />Envoyer</Button>}
                {(proforma.status === "draft" || proforma.status === "sent") && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => handleStatusUpdate("accepted")} disabled={updatingStatus}><CheckCircle className="mr-1 h-3 w-3" />Accepter</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleStatusUpdate("rejected")} disabled={updatingStatus}><XCircle className="mr-1 h-3 w-3" />Refuser</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><User className="h-4 w-4" />Client</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{proforma.customer_name_display || proforma.client_name || "N/A"}</p></div>
              {proforma.client_email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{proforma.client_email}</span></div>}
              {proforma.client_phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{proforma.client_phone}</span></div>}
              {proforma.client_address && <div className="flex items-start gap-2 text-sm"><MapPin className="h-3 w-3 text-muted-foreground mt-0.5" /><span className="text-muted-foreground">{proforma.client_address}</span></div>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><Calendar className="h-4 w-4" />Dates</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-muted-foreground">Émission</p><p className="font-medium">{formatDate(proforma.issue_date)}</p></div>
              <div><p className="text-xs text-muted-foreground">Validité</p><p className={`font-medium ${proforma.is_expired ? "text-red-600" : "text-green-600"}`}>{formatDate(proforma.validity_date)}{proforma.is_expired && " ⚠️"}</p></div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><Calculator className="h-4 w-4" />Montant</h3>
            <div><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-3xl font-bold text-primary">{formatCurrency(proforma.total_amount)}</p></div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><Package className="h-3 w-3" /><span>{proforma.item_count || proforma.items?.length || 0} article(s)</span></div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-5 border-b bg-muted/30"><h3 className="font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Articles</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b bg-muted/50"><th className="text-left p-4 font-medium text-sm">#</th><th className="text-left p-4 font-medium text-sm">Produit</th><th className="text-right p-4 font-medium text-sm">Qté</th><th className="text-right p-4 font-medium text-sm">Prix unit.</th><th className="text-right p-4 font-medium text-sm">Remise</th><th className="text-right p-4 font-medium text-sm">Total</th></tr></thead>
              <tbody>
                {proforma.items?.map((item, idx) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="p-4"><p className="font-medium">{item.product_name}</p>{item.product_sku && <p className="text-xs text-muted-foreground">{item.product_sku}</p>}{item.description && <p className="text-xs italic text-muted-foreground mt-1">{item.description}</p>}</td>
                    <td className="p-4 text-right font-medium">{item.quantity}</td>
                    <td className="p-4 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-4 text-right">{item.discount_amount > 0 ? <span className="text-green-600 font-medium">-{formatCurrency(item.discount_amount)}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-4 text-right font-bold">{formatCurrency(item.total)}</td>
                  </tr>
                )) || <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">Aucun article</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-5 border-t bg-muted/30">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-medium">{formatCurrency(proforma.subtotal || 0)}</span></div>
                {(proforma.discount_amount || 0) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Remise</span><span className="font-medium">-{formatCurrency(proforma.discount_amount)}</span></div>}
                {(proforma.tax_amount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA</span><span className="font-medium">{formatCurrency(proforma.tax_amount)}</span></div>}
                <div className="flex justify-between pt-3 border-t font-bold text-lg"><span>Total</span><span className="text-primary">{formatCurrency(proforma.total_amount || 0)}</span></div>
              </div>
            </div>
          </div>
        </Card>

        {(proforma.notes || proforma.conditions) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proforma.notes && <Card className="p-5"><h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h4><p className="text-sm whitespace-pre-wrap">{proforma.notes}</p></Card>}
            {proforma.conditions && <Card className="p-5"><h4 className="text-sm font-semibold text-muted-foreground mb-2">Conditions</h4><p className="text-sm whitespace-pre-wrap">{proforma.conditions}</p></Card>}
          </div>
        )}

        {proforma.status === "converted" && proforma.converted_sale && (
          <Alert variant="success" className="border-green-200"><CheckCircle className="h-5 w-5" /><div><p className="font-semibold">Convertie en vente</p><p className="text-sm mt-1">Vente : <code className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">{proforma.converted_sale}</code></p></div></Alert>
        )}
      </div>
    </div>
  );
}
