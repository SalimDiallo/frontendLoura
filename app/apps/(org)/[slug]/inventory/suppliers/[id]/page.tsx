"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getSupplier, deleteSupplier, getSupplierOrders } from "@/lib/services/inventory";
import type { Supplier, OrderList } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Building,
  FileText,
  Calendar,
  Package,
  DollarSign,
  Clock,
  ShoppingCart,
  Eye,
} from "lucide-react";
import Link from "next/link";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierDetails();
    loadSupplierOrders();
  }, [supplierId]);

  const loadSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const supplierData = await getSupplier(supplierId);
      setSupplier(supplierData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du fournisseur");
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierOrders = async () => {
    try {
      setOrdersLoading(true);
      const ordersData = await getSupplierOrders(supplierId);
      setOrders(ordersData);
    } catch (err: any) {
      console.error("Erreur lors du chargement des commandes:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" ?`)) {
      return;
    }

    try {
      await deleteSupplier(supplierId);
      router.push(`/apps/${slug}/inventory/suppliers`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      confirmed: { variant: "default", label: "Confirmée" },
      received: { variant: "default", label: "Reçue" },
      cancelled: { variant: "destructive", label: "Annulée" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  if (error || !supplier) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error || "Fournisseur introuvable"}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/suppliers`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <Badge variant={supplier.is_active ? "default" : "secondary"}>
                {supplier.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Code: <code className="bg-muted px-2 py-1 rounded text-sm">{supplier.code}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${slug}/inventory/suppliers/${supplierId}/edit`}>
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commandes</p>
              <p className="text-2xl font-bold">{supplier.order_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-2xl font-bold">{formatCurrency(supplier.total_orders_amount || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créé le</p>
              <p className="text-lg font-semibold">{formatDate(supplier.created_at)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modifié le</p>
              <p className="text-lg font-semibold">{formatDate(supplier.updated_at)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contact & Address Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Informations de contact
          </h3>
          <div className="space-y-3 text-sm">
            {supplier.contact_person && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Personne de contact</p>
                  <p className="font-medium">{supplier.contact_person}</p>
                </div>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <a href={`mailto:${supplier.email}`} className="font-medium hover:text-primary">
                    {supplier.email}
                  </a>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Téléphone</p>
                  <a href={`tel:${supplier.phone}`} className="font-medium hover:text-primary">
                    {supplier.phone}
                  </a>
                </div>
              </div>
            )}
            {!supplier.contact_person && !supplier.email && !supplier.phone && (
              <p className="text-muted-foreground italic">Aucune information de contact</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Adresse
          </h3>
          <div className="text-sm text-muted-foreground space-y-1">
            {supplier.address && <p>{supplier.address}</p>}
            {supplier.city && <p>{supplier.city}</p>}
            {supplier.country && <p>{supplier.country}</p>}
            {!supplier.address && !supplier.city && !supplier.country && (
              <p className="italic">Aucune adresse renseignée</p>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Informations fiscales
          </h3>
          <div className="space-y-2 text-sm">
            {supplier.tax_id ? (
              <div>
                <p className="text-muted-foreground text-xs">Numéro fiscal</p>
                <p className="font-medium">{supplier.tax_id}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Aucun numéro fiscal</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-orange-600" />
            Conditions de paiement
          </h3>
          <div className="space-y-2 text-sm">
            {supplier.payment_terms ? (
              <p className="text-muted-foreground">{supplier.payment_terms}</p>
            ) : (
              <p className="text-muted-foreground italic">Aucune condition de paiement</p>
            )}
          </div>
        </Card>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
        </Card>
      )}

      {/* Orders List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            Commandes du fournisseur
          </h3>
          <Link href={`/apps/${slug}/inventory/orders/new?supplier=${supplierId}`}>
            <Button size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle commande
            </Button>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune commande pour ce fournisseur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">N° Commande</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Entrepôt</th>
                  <th className="pb-3 font-medium text-muted-foreground">Articles</th>
                  <th className="pb-3 font-medium text-muted-foreground">Montant</th>
                  <th className="pb-3 font-medium text-muted-foreground">Statut</th>
                  <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{order.order_number}</code>
                    </td>
                    <td className="py-3 text-sm">{formatDate(order.order_date)}</td>
                    <td className="py-3 text-sm">{order.warehouse_name || "-"}</td>
                    <td className="py-3 text-sm">{order.item_count || 0}</td>
                    <td className="py-3 text-sm font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="py-3">{getStatusBadge(order.status)}</td>
                    <td className="py-3">
                      <Link href={`/apps/${slug}/inventory/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
