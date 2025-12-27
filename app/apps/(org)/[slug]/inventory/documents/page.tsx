"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, Input, Badge } from "@/components/ui";
import {
  getProformas,
  getDeliveryNotes,
  getProducts,
  deleteProforma,
  deleteDeliveryNote,
  convertProformaToSale,
  markDeliveryAsDelivered,
  getWarehouses,
} from "@/lib/services/inventory";
import type { ProformaInvoice, DeliveryNote, Warehouse, ProductList } from "@/lib/types/inventory";
import {
  FileText,
  Plus,
  Download,
  ExternalLink,
  Search,
  Truck,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  X,
  ShoppingCart,
  Package,
  Calendar,
  ArrowLeft,
  Receipt,
  AlertTriangle,
  MapPin,
  Loader2,
  FileDown,
  Calculator,
  User,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_CONFIG, STORAGE_KEYS } from "@/lib/api/config";

type TabType = "proformas" | "delivery" | "invoices";

// Types pour Devis/Factures
type DocumentType = "quote" | "invoice";

interface DocumentItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface SavedDocument {
  id: string;
  type: DocumentType;
  number: string;
  clientName: string;
  date: string;
  total: number;
  createdAt: string;
  payload: any;
}

const THEME_COLORS = [
  { name: "Bleu", primary: "#2563eb", secondary: "#dbeafe" },
  { name: "Vert", primary: "#16a34a", secondary: "#dcfce7" },
  { name: "Violet", primary: "#7c3aed", secondary: "#ede9fe" },
  { name: "Orange", primary: "#ea580c", secondary: "#ffedd5" },
];

const STORAGE_KEY_DOCS = "inventory_documents_history";

export default function DocumentsHubPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Tab actif
  const [activeTab, setActiveTab] = useState<TabType>("proformas");

  // Data
  const [proformas, setProformas] = useState<ProformaInvoice[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"proforma" | "delivery" | null>(null);
  const [convertModal, setConvertModal] = useState<{ proforma: ProformaInvoice; warehouseId: string } | null>(null);
  const [converting, setConverting] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null);

  // === DEVIS / FACTURES STATE ===
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>("quote");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [notes, setNotes] = useState("");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [generating, setGenerating] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Preview state for history
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Load saved documents from localStorage
    const saved = localStorage.getItem(`${STORAGE_KEY_DOCS}_${slug}`);
    if (saved) {
      try { setSavedDocuments(JSON.parse(saved)); } catch (e) {}
    }
    generateNumber();
  }, [slug]);

  useEffect(() => {
    generateNumber();
  }, [documentType]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [proformasData, notesData, warehousesData] = await Promise.all([
        getProformas({}),
        getDeliveryNotes({}),
        getWarehouses(),
      ]);
      setProformas(proformasData);
      setDeliveryNotes(notesData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = useCallback(async () => {
    if (products.length > 0) return;
    try {
      setLoadingProducts(true);
      const data = await getProducts({ is_active: true });
      setProducts(data);
    } catch (err: any) {
      console.error("Erreur chargement produits:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [products.length]);

  // Handlers
  const handleDelete = async () => {
    if (!deleteConfirmId || !deleteType) return;
    try {
      if (deleteType === "proforma") {
        await deleteProforma(deleteConfirmId);
      } else {
        await deleteDeliveryNote(deleteConfirmId);
      }
      setDeleteConfirmId(null);
      setDeleteType(null);
      setSuccess("Document supprimé avec succès");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const handleConvert = async () => {
    if (!convertModal) return;
    try {
      setConverting(true);
      await convertProformaToSale(convertModal.proforma.id, convertModal.warehouseId);
      setConvertModal(null);
      setSuccess("Proforma convertie en vente avec succès !");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la conversion");
    } finally {
      setConverting(false);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      setMarkingDelivered(id);
      await markDeliveryAsDelivered(id);
      setSuccess("Livraison marquée comme effectuée !");
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setMarkingDelivered(null);
    }
  };

  // === DEVIS/FACTURES HANDLERS ===
  const generateNumber = () => {
    const prefix = documentType === "quote" ? "DEV" : "FAC";
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setDocumentNumber(`${prefix}-${date}-${random}`);
  };

  const addManualItem = () => {
    setItems([...items, { id: crypto.randomUUID(), product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const addProductItem = (product: ProductList) => {
    setItems([...items, {
      id: crypto.randomUUID(),
      product_name: product.name,
      quantity: 1,
      unit_price: product.selling_price || product.purchase_price || 0,
    }]);
    setShowProductSearch(false);
    setProductSearch("");
  };

  const updateItem = (id: string, field: keyof DocumentItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveToHistory = (doc: SavedDocument) => {
    const updated = [doc, ...savedDocuments].slice(0, 50);
    setSavedDocuments(updated);
    localStorage.setItem(`${STORAGE_KEY_DOCS}_${slug}`, JSON.stringify(updated));
  };

  const deleteFromHistory = (id: string) => {
    const updated = savedDocuments.filter(d => d.id !== id);
    setSavedDocuments(updated);
    localStorage.setItem(`${STORAGE_KEY_DOCS}_${slug}`, JSON.stringify(updated));
  };

  // Prévisualiser un document depuis l'historique
  const handlePreviewDoc = async (doc: SavedDocument) => {
    try {
      setLoadingPreview(true);
      setPreviewDoc(doc);

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const endpoint = doc.type === "quote"
        ? "/inventory/stats/generate_quote_pdf/"
        : "/inventory/stats/generate_invoice_pdf/";

      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}?organization_subdomain=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify(doc.payload),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      setError("Erreur lors de la prévisualisation");
      setPreviewDoc(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Télécharger un document depuis l'historique
  const handleDownloadDoc = async (doc: SavedDocument) => {
    try {
      setDownloadingDoc(doc.id);
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const endpoint = doc.type === "quote"
        ? "/inventory/stats/generate_quote_pdf/"
        : "/inventory/stats/generate_invoice_pdf/";

      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}?organization_subdomain=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify(doc.payload),
      });

      if (!response.ok) throw new Error("Erreur");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.type === "quote" ? "devis" : "facture"}_${doc.number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess("Document téléchargé !");
    } catch (err) {
      setError("Erreur lors du téléchargement");
    } finally {
      setDownloadingDoc(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  // Calculs Devis/Factures
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxPercent > 0 ? afterDiscount * (taxPercent / 100) : 0;
  const invoiceTotal = afterDiscount + taxAmount;

  const handleGenerate = async () => {
    if (!clientName.trim()) { setError("Le nom du client est requis"); return; }
    if (!documentNumber.trim()) { setError("Le numéro du document est requis"); return; }
    if (items.length === 0) { setError("Ajoutez au moins un article"); return; }

    try {
      setGenerating(true);
      setError(null);

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const endpoint = documentType === "quote"
        ? "/inventory/stats/generate_quote_pdf/"
        : "/inventory/stats/generate_invoice_pdf/";

      const payload = {
        [documentType === "quote" ? "quote_number" : "invoice_number"]: documentNumber,
        date: documentDate,
        client_name: clientName,
        client_email: clientEmail || undefined,
        client_phone: clientPhone || undefined,
        items: items.map(item => ({ product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price })),
        notes: notes || undefined,
        discount_percent: discountPercent > 0 ? discountPercent : undefined,
        tax_percent: taxPercent > 0 ? taxPercent : undefined,
      };

      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}?organization_subdomain=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération du PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const newDoc: SavedDocument = {
        id: crypto.randomUUID(),
        type: documentType,
        number: documentNumber,
        clientName,
        date: documentDate,
        total: invoiceTotal,
        createdAt: new Date().toISOString(),
        payload,
      };
      saveToHistory(newDoc);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType === "quote" ? "devis" : "facture"}_${documentNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccess(`${documentType === "quote" ? "Devis" : "Facture"} généré !`);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setItems([]);
      setNotes("");
      setDiscountPercent(0);
      generateNumber();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  // Filtrage
  const filteredProformas = proformas.filter((p) =>
    searchTerm === "" ? true : p.proforma_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeliveries = deliveryNotes.filter((n) =>
    searchTerm === "" ? true : n.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSavedDocs = savedDocuments.filter((d) =>
    searchTerm === "" ? true : d.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const getProformaStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "converted": case "accepted": return "success";
      case "sent": case "draft": return "default";
      case "rejected": case "expired": return "error";
      default: return "default";
    }
  };

  const getDeliveryStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "delivered": return "success";
      case "in_transit": case "ready": return "warning";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-muted-foreground mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setDeleteConfirmId(null); setDeleteType(null); }}>Annuler</Button>
              <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Convert Modal */}
      {convertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Convertir en vente</h2>
            <select
              value={convertModal.warehouseId}
              onChange={(e) => setConvertModal({ ...convertModal, warehouseId: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mb-6"
            >
              <option value="">Choisir un entrepôt</option>
              {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConvertModal(null)}>Annuler</Button>
              <Button onClick={handleConvert} disabled={converting || !convertModal.warehouseId} className="bg-green-600 hover:bg-green-700">
                {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                Convertir
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Sélectionner un produit</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowProductSearch(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border-t">
              {loadingProducts ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filteredProducts.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">Aucun produit</p>
              ) : filteredProducts.slice(0, 20).map((product) => (
                <button key={product.id} className="w-full text-left p-3 hover:bg-muted/50 border-b transition-colors" onClick={() => addProductItem(product)}>
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium">{product.name}</p><p className="text-sm text-muted-foreground">{product.sku}</p></div>
                    <Badge variant="outline">{formatCurrency(product.selling_price || 0)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/apps/${slug}/inventory`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documents
              </h1>
              <p className="text-xs text-muted-foreground">Pro forma, Bons de livraison, Devis & Factures</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "proformas" && (
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/documents/proformas/new`}><Plus className="mr-2 h-4 w-4" />Nouvelle Proforma</Link>
              </Button>
            )}
            {activeTab === "delivery" && (
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/delivery-notes/new`}><Plus className="mr-2 h-4 w-4" />Nouveau Bon</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex border-t bg-muted/30 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("proformas"); setSearchTerm(""); }}
            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === "proformas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Receipt className="h-4 w-4" />
            Pro Forma
            <Badge variant="outline" className="ml-1">{proformas.length}</Badge>
          </button>
          <button
            onClick={() => { setActiveTab("delivery"); setSearchTerm(""); }}
            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === "delivery" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Truck className="h-4 w-4" />
            Bons de livraison
            <Badge variant="outline" className="ml-1">{deliveryNotes.length}</Badge>
          </button>
          <button
            onClick={() => { setActiveTab("invoices"); setSearchTerm(""); }}
            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === "invoices" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            Devis & Factures
            <Badge variant="outline" className="ml-1">{savedDocuments.length}</Badge>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className="p-4">
          {error && (
            <Alert variant="error" className="mb-2">
              <AlertTriangle className="h-4 w-4" /><span>{error}</span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></Button>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-2">
              <CheckCircle className="h-4 w-4" /><span>{success}</span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSuccess(null)}><X className="h-4 w-4" /></Button>
            </Alert>
          )}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* ==================== PROFORMAS TAB ==================== */}
        {activeTab === "proformas" && (
          <>
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une proforma..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900"><FileText className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">{proformas.length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900"><Clock className="h-4 w-4 text-yellow-600" /></div><div><p className="text-xs text-muted-foreground">En attente</p><p className="text-lg font-bold">{proformas.filter(p => ["draft", "sent"].includes(p.status)).length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900"><CheckCircle className="h-4 w-4 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Converties</p><p className="text-lg font-bold">{proformas.filter(p => p.status === "converted").length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900"><XCircle className="h-4 w-4 text-red-600" /></div><div><p className="text-xs text-muted-foreground">Expirées</p><p className="text-lg font-bold">{proformas.filter(p => p.status === "expired" || p.is_expired).length}</p></div></div></Card>
            </div>
            <Card>
              <div className="overflow-x-auto">
                {filteredProformas.length === 0 ? (
                  <div className="text-center p-12">
                    <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="font-semibold text-lg mb-1">Aucune pro forma</h3>
                    <Button asChild className="mt-4"><Link href={`/apps/${slug}/inventory/documents/proformas/new`}><Plus className="mr-2 h-4 w-4" />Nouvelle Proforma</Link></Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/50"><th className="text-left p-4 font-medium">N° Proforma</th><th className="text-left p-4 font-medium">Client</th><th className="text-left p-4 font-medium">Date</th><th className="text-right p-4 font-medium">Montant</th><th className="text-center p-4 font-medium">Statut</th><th className="text-center p-4 font-medium">Actions</th></tr></thead>
                    <tbody>
                      {filteredProformas.map((proforma) => (
                        <tr key={proforma.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/apps/${slug}/inventory/documents/proformas/${proforma.id}`)}>
                          <td className="p-4"><code className="text-sm bg-muted px-2 py-1 rounded font-mono">{proforma.proforma_number}</code></td>
                          <td className="p-4 font-medium">{proforma.customer_name_display || proforma.client_name || "N/A"}</td>
                          <td className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{formatDate(proforma.issue_date)}</div></td>
                          <td className="p-4 text-right font-bold">{formatCurrency(proforma.total_amount)}</td>
                          <td className="p-4 text-center"><Badge variant={getProformaStatusVariant(proforma.status)}>{proforma.status_display || proforma.status}</Badge></td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" asChild><Link href={`/apps/${slug}/inventory/documents/proformas/${proforma.id}`}><Eye className="h-4 w-4" /></Link></Button>
                              {proforma.status !== "converted" && (<Button variant="ghost" size="sm" onClick={() => setConvertModal({ proforma, warehouseId: "" })}><ShoppingCart className="h-4 w-4 text-green-600" /></Button>)}
                              <Button variant="ghost" size="sm" onClick={() => { setDeleteConfirmId(proforma.id); setDeleteType("proforma"); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ==================== DELIVERY NOTES TAB ==================== */}
        {activeTab === "delivery" && (
          <>
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un bon de livraison..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900"><Truck className="h-4 w-4 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold">{deliveryNotes.length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900"><Package className="h-4 w-4 text-yellow-600" /></div><div><p className="text-xs text-muted-foreground">Prêts</p><p className="text-lg font-bold">{deliveryNotes.filter(n => n.status === "ready").length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900"><Truck className="h-4 w-4 text-purple-600" /></div><div><p className="text-xs text-muted-foreground">En transit</p><p className="text-lg font-bold">{deliveryNotes.filter(n => n.status === "in_transit").length}</p></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900"><CheckCircle className="h-4 w-4 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Livrés</p><p className="text-lg font-bold">{deliveryNotes.filter(n => n.status === "delivered").length}</p></div></div></Card>
            </div>
            <Card>
              <div className="overflow-x-auto">
                {filteredDeliveries.length === 0 ? (
                  <div className="text-center p-12">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="font-semibold text-lg mb-1">Aucun bon de livraison</h3>
                    <Button asChild className="mt-4"><Link href={`/apps/${slug}/inventory/delivery-notes/new`}><Plus className="mr-2 h-4 w-4" />Nouveau Bon</Link></Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/50"><th className="text-left p-4 font-medium">N° Bon</th><th className="text-left p-4 font-medium">Destinataire</th><th className="text-left p-4 font-medium">Adresse</th><th className="text-left p-4 font-medium">Date</th><th className="text-center p-4 font-medium">Statut</th><th className="text-center p-4 font-medium">Actions</th></tr></thead>
                    <tbody>
                      {filteredDeliveries.map((note) => (
                        <tr key={note.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/apps/${slug}/inventory/delivery-notes/${note.id}`)}>
                          <td className="p-4"><code className="text-sm bg-muted px-2 py-1 rounded font-mono">{note.delivery_number}</code></td>
                          <td className="p-4"><div className="font-medium">{note.recipient_name}</div>{note.recipient_phone && <p className="text-sm text-muted-foreground">{note.recipient_phone}</p>}</td>
                          <td className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground max-w-xs truncate"><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{note.delivery_address}</span></div></td>
                          <td className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{formatDate(note.delivery_date)}</div></td>
                          <td className="p-4 text-center"><Badge variant={getDeliveryStatusVariant(note.status)}>{note.status_display}</Badge></td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" asChild><Link href={`/apps/${slug}/inventory/delivery-notes/${note.id}`}><Eye className="h-4 w-4" /></Link></Button>
                              {note.status !== "delivered" && note.status !== "cancelled" && (
                                <Button variant="ghost" size="sm" onClick={() => handleMarkDelivered(note.id)} disabled={markingDelivered === note.id}>
                                  {markingDelivered === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                                </Button>
                              )}
                              {note.status === "pending" && (<Button variant="ghost" size="sm" onClick={() => { setDeleteConfirmId(note.id); setDeleteType("delivery"); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ==================== DEVIS & FACTURES TAB ==================== */}
        {activeTab === "invoices" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire de création */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText className="h-4 w-4" />Créer un document</h3>
                <div className="flex gap-2 mb-4">
                  {([{ type: "quote" as DocumentType, label: "Devis" }, { type: "invoice" as DocumentType, label: "Facture" }]).map(({ type, label }) => (
                    <button key={type} onClick={() => setDocumentType(type)} className={cn("flex-1 p-3 rounded-lg border-2 transition-all text-sm font-medium", documentType === type ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30")}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="flex gap-2">
                    <Input placeholder="Numéro *" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="flex-1" />
                    <Button variant="outline" size="sm" onClick={generateNumber}>Auto</Button>
                  </div>
                  <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm"><User className="h-4 w-4" />Client</h3>
                <div className="grid gap-3">
                  <Input placeholder="Nom du client *" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                    <Input placeholder="Téléphone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm"><Package className="h-4 w-4" />Articles ({items.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { loadProducts(); setShowProductSearch(true); }}><Search className="mr-1 h-3 w-3" />Produits</Button>
                    <Button size="sm" onClick={addManualItem}><Plus className="mr-1 h-3 w-3" />Ajouter</Button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg"><Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">Aucun article</p></div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex gap-2 items-start p-2 rounded-lg bg-muted/50">
                        <span className="text-xs text-muted-foreground w-4 pt-2">{idx + 1}</span>
                        <div className="flex-1 grid gap-1">
                          <Input placeholder="Désignation" value={item.product_name} onChange={(e) => updateItem(item.id, "product_name", e.target.value)} className="h-8 text-sm" />
                          <div className="grid grid-cols-3 gap-1">
                            <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-8 text-sm" placeholder="Qté" />
                            <Input type="number" min={0} value={item.unit_price} onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)} className="h-8 text-sm" placeholder="Prix" />
                            <div className="h-8 flex items-center justify-end text-sm font-medium px-2 bg-background rounded-md">{formatCurrency(item.quantity * item.unit_price)}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm"><Calculator className="h-4 w-4" />Options</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">Remise %</label><Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">TVA %</label><Input type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} /></div>
                </div>
                <div className="flex gap-2 mb-3">
                  {THEME_COLORS.map((color) => (
                    <button key={color.name} onClick={() => setThemeColor(color)} className={cn("w-6 h-6 rounded-full transition-all", themeColor.name === color.name && "ring-2 ring-offset-2")} style={{ backgroundColor: color.primary }} title={color.name} />
                  ))}
                </div>
                <textarea rows={2} placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </Card>

              <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating || items.length === 0 || !clientName || !documentNumber}>
                {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
                Générer et télécharger
              </Button>
            </div>

            {/* Historique */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Historique ({savedDocuments.length})</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                {filteredSavedDocs.length === 0 ? (
                  <div className="text-center py-8"><FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">Aucun document</p></div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredSavedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", doc.type === "quote" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600")}>
                            {doc.type === "quote" ? <FileText className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.number}</p>
                            <p className="text-xs text-muted-foreground">{doc.clientName} • {formatDate(doc.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm mr-2">{formatCurrency(doc.total)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreviewDoc(doc)} title="Voir">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadDoc(doc)} disabled={downloadingDoc === doc.id} title="Télécharger">
                            {downloadingDoc === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFromHistory(doc.id)} title="Supprimer">
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Preview Live */}
              <Card className="overflow-hidden shadow-lg">
                <div className="bg-white text-black p-4 text-sm" style={{ fontFamily: "system-ui" }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-lg font-bold" style={{ color: themeColor.primary }}>{documentType === "quote" ? "DEVIS" : "FACTURE"}</h1>
                      <p className="text-xs text-gray-500">N° {documentNumber || "XXX"}</p>
                    </div>
                    <div className="text-right text-xs text-gray-600"><p>Date: {formatDate(documentDate)}</p></div>
                  </div>
                  <div className="mb-3 p-2 rounded-lg text-xs" style={{ backgroundColor: themeColor.secondary }}>
                    <p className="text-gray-500">Client</p>
                    <p className="font-medium">{clientName || "Nom du client"}</p>
                  </div>
                  <div className="flex justify-end">
                    <div className="w-40 text-xs">
                      <div className="flex justify-between py-1"><span className="text-gray-500">Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
                      {discountPercent > 0 && <div className="flex justify-between py-1 text-green-600"><span>Remise</span><span>-{formatCurrency(discountAmount)}</span></div>}
                      {taxPercent > 0 && <div className="flex justify-between py-1"><span className="text-gray-500">TVA</span><span>{formatCurrency(taxAmount)}</span></div>}
                      <div className="flex justify-between py-2 mt-2 rounded-lg px-2 font-bold" style={{ backgroundColor: themeColor.secondary, color: themeColor.primary }}>
                        <span>Total</span><span>{formatCurrency(invoiceTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview PDF */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePreview} />
          <div className="relative bg-background rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-5xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", previewDoc.type === "quote" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600")}>
                  {previewDoc.type === "quote" ? <FileText className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="font-semibold">{previewDoc.type === "quote" ? "Devis" : "Facture"} {previewDoc.number}</h2>
                  <p className="text-xs text-muted-foreground">{previewDoc.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => previewUrl && window.open(previewUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />Nouvel onglet
                </Button>
                <Button size="sm" onClick={() => handleDownloadDoc(previewDoc)}>
                  <Download className="h-4 w-4 mr-2" />Télécharger
                </Button>
                <Button variant="ghost" size="icon" onClick={closePreview}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex-1 relative bg-muted/30 overflow-hidden">
              {loadingPreview ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-0" title="Aperçu PDF" />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
