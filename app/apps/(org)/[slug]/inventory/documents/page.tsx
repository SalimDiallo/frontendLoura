"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { API_CONFIG, STORAGE_KEYS } from "@/lib/api/config";
import {
  convertProformaToSale,
  deleteDeliveryNote,
  deleteProforma,
  getCustomers,
  getDeliveryNotes,
  getProducts,
  getProformas,
  getWarehouses
} from "@/lib/services/inventory";
import type { Customer, DeliveryNote, ProductList, ProformaInvoice, Warehouse } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type TabType = "proformas"  | "invoices";

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
  const [generating, setGenerating] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Client autocomplete
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const clientRef = useRef<HTMLDivElement>(null);

  // Preview state for history
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadCustomers();
    // Load saved documents from localStorage
    const saved = localStorage.getItem(`${STORAGE_KEY_DOCS}_${slug}`);
    if (saved) {
      try { setSavedDocuments(JSON.parse(saved)); } catch (e) {}
    }
    generateNumber();
  }, [slug]);

  // Close client dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const loadCustomers = async () => {
    try {
      const data = await getCustomers({ is_active: true });
      setCustomers(data);
    } catch (err: any) {
      console.error("Erreur chargement clients:", err);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setClientName(customer.name);
    setClientEmail(customer.email || "");
    setClientPhone(customer.phone || "");
    setClientSearch("");
    setShowClientDropdown(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes((clientSearch || clientName).toLowerCase())
  );

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
   <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS} showMessage>
       <div className="min-h-screen bg-[#f8f9fb] dark:bg-muted/20">
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
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/apps/${slug}/inventory`}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Documents</h1>
              <p className="text-xs text-muted-foreground">Pro forma · Bons de livraison · Devis & Factures</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "proformas" && (
              <Button asChild size="sm" className="h-8 text-xs font-medium">
                <Link href={`/apps/${slug}/inventory/documents/proformas/new`}><Plus className="mr-1.5 h-3.5 w-3.5" />Nouvelle Proforma</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex overflow-x-auto">
          {[
            { key: "proformas" as TabType, icon: Receipt, label: "Pro Forma", count: proformas.length },
            { key: "invoices" as TabType, icon: FileText, label: "Devis & Factures", count: savedDocuments.length },
          ].map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchTerm(""); }}
              className={cn(
                "flex items-center gap-2 px-3 py-3 text-sm border-b-2 -mb-px transition-all whitespace-nowrap",
                activeTab === key
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground font-normal"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span className={cn(
                "ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                activeTab === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}>{count}</span>
            </button>
          ))}
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

      <div className="p-6 space-y-4">
        {/* ==================== PROFORMAS TAB ==================== */}
        {activeTab === "proformas" && (
          <>
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Rechercher une proforma..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm bg-background" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total", value: proformas.length, color: "border-l-slate-400" },
                { label: "En attente", value: proformas.filter(p => ["draft", "sent"].includes(p.status)).length, color: "border-l-amber-400" },
                { label: "Converties", value: proformas.filter(p => p.status === "converted").length, color: "border-l-emerald-400" },
                { label: "Expirées", value: proformas.filter(p => p.status === "expired" || p.is_expired).length, color: "border-l-rose-400" },
              ].map(({ label, value, color }) => (
                <Card key={label} className={cn("p-4 border-l-4", color)}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{value}</p>
                </Card>
              ))}
            </div>
            <Card className="border shadow-sm">
              <div className="overflow-x-auto">
                {filteredProformas.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground mb-4">Aucune pro forma</p>
                    <Button asChild size="sm"><Link href={`/apps/${slug}/inventory/documents/proformas/new`}><Plus className="mr-2 h-3.5 w-3.5" />Nouvelle Proforma</Link></Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Référence</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProformas.map((proforma) => (
                        <tr key={proforma.id} className="hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => router.push(`/apps/${slug}/inventory/documents/proformas/${proforma.id}`)}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-foreground">{proforma.proforma_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{proforma.customer_name_display || proforma.client_name || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">{formatDate(proforma.issue_date)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold">{formatCurrency(proforma.total_amount)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={getProformaStatusVariant(proforma.status)} className="text-xs">{proforma.status_display || proforma.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild><Link href={`/apps/${slug}/inventory/documents/proformas/${proforma.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                              {proforma.status !== "converted" && (<Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setConvertModal({ proforma, warehouseId: "" })}><ShoppingCart className="h-3.5 w-3.5 text-emerald-600" /></Button>)}
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDeleteConfirmId(proforma.id); setDeleteType("proforma"); }}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

            {/* === Colonne gauche: Historique === */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <Card className="border shadow-sm">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-sm font-semibold mb-2">Historique</h3>
                  {savedDocuments.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs bg-background" />
                    </div>
                  )}
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredSavedDocs.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground">Aucun document généré</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredSavedDocs.map((doc) => (
                        <div key={doc.id} className="px-4 py-3 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-medium">{doc.type === "quote" ? "Devis" : "Facture"}</Badge>
                              <span className="text-sm font-medium">{doc.number}</span>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(doc.total)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{doc.clientName} · {formatDate(doc.createdAt)}</p>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDownloadDoc(doc)} disabled={downloadingDoc === doc.id} title="Télécharger">
                                {downloadingDoc === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handlePreviewDoc(doc)} title="Aperçu">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteFromHistory(doc.id)} title="Supprimer">
                                <Trash2 className="h-3 w-3 text-rose-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* === Colonne droite: Formulaire === */}
            <div className="space-y-4">
              {/* Type de document */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4">Nouveau document</h3>
                <div className="flex gap-2 mb-4">
                  {([{ type: "quote" as DocumentType, label: "Devis" }, { type: "invoice" as DocumentType, label: "Facture" }]).map(({ type, label }) => (
                    <button key={type} onClick={() => setDocumentType(type)} className={cn("flex-1 py-2.5 rounded-md border text-sm font-medium transition-all", documentType === type ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:text-foreground hover:border-foreground/40")}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Numéro</label>
                    <div className="flex gap-2">
                      <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="flex-1 h-9 text-sm" />
                      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={generateNumber}>Auto</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                    <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className="h-9 text-sm" />
                  </div>
                </div>
              </Card>

              {/* Client */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4">Client</h3>
                <div className="grid gap-3">
                  <div ref={clientRef} className="relative">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Nom *</label>
                    <Input
                      value={clientName}
                      onChange={(e) => { setClientName(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Tapez pour rechercher ou saisir un nouveau client"
                      className="h-9 text-sm"
                    />
                    {showClientDropdown && clientName.length > 0 && filteredCustomers.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {filteredCustomers.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                            onClick={() => selectCustomer(c)}
                          >
                            <div>
                              <span className="font-medium">{c.name}</span>
                              {c.phone && <span className="text-xs text-muted-foreground ml-2">{c.phone}</span>}
                            </div>
                            {c.email && <span className="text-xs text-muted-foreground truncate ml-2 max-w-[120px]">{c.email}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                      <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Téléphone</label>
                      <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Articles */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Articles ({items.length})</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { loadProducts(); setShowProductSearch(true); }}><Search className="mr-1.5 h-3 w-3" />Catalogue</Button>
                    <Button size="sm" className="h-8 text-xs" onClick={addManualItem}><Plus className="mr-1.5 h-3 w-3" />Ligne</Button>
                  </div>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-md">
                    <Package className="h-5 w-5 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Ajoutez des articles depuis le catalogue ou manuellement</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex gap-2 items-start p-3 rounded-md border bg-background">
                        <span className="text-[10px] text-muted-foreground/60 w-4 pt-2 text-center">{idx + 1}</span>
                        <div className="flex-1 grid gap-1.5">
                          <Input placeholder="Désignation" value={item.product_name} onChange={(e) => updateItem(item.id, "product_name", e.target.value)} className="h-8 text-sm" />
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-0.5 block">Qté</label>
                              <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-0.5 block">Prix unitaire</label>
                              <Input type="number" min={0} value={item.unit_price} onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-0.5 block">Total</label>
                              <div className="h-8 flex items-center justify-end text-sm font-medium px-2 border rounded-md bg-muted/30">{formatCurrency(item.quantity * item.unit_price)}</div>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Options & Totaux */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4">Options</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Remise (%)</label>
                    <Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">TVA (%)</label>
                    <Input type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Notes</label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>

                {/* Récapitulatif */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span>{formatCurrency(subtotal)}</span></div>
                  {discountPercent > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Remise ({discountPercent}%)</span><span>-{formatCurrency(discountAmount)}</span></div>}
                  {taxPercent > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA ({taxPercent}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t"><span>Total</span><span>{formatCurrency(invoiceTotal)}</span></div>
                </div>
              </Card>

              <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generating || items.length === 0 || !clientName || !documentNumber}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Générer et télécharger le PDF
              </Button>
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
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", previewDoc.type === "quote" ? "bg-blue-100 text-foreground" : "bg-green-100 text-green-600")}>
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
   </Can>
  );
}
