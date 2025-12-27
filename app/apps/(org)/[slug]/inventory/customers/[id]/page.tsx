"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getCustomer, getCustomerSalesHistory, getCustomerCreditHistory } from "@/lib/services/inventory";
import type { Customer, SaleList, CreditSale } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Edit,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Clock,
  User,
  Building,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesHistory, setSalesHistory] = useState<SaleList[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "sales" | "credit">("info");

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [customerData, salesData, creditData] = await Promise.all([
        getCustomer(customerId),
        getCustomerSalesHistory(customerId).catch(() => []),
        getCustomerCreditHistory(customerId).catch(() => []),
      ]);
      setCustomer(customerData);
      setSalesHistory(salesData);
      setCreditHistory(creditData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du client");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
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

  if (error || !customer) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error || "Client non trouvé"}</p>
          </div>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href={`/apps/${slug}/inventory/customers`}>Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const creditUsagePercent = customer.credit_limit > 0
    ? Math.min(((customer.total_debt || 0) / customer.credit_limit) * 100, 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/inventory/customers`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-2xl text-primary">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Badge variant={customer.is_active ? "success" : "default"}>
                  {customer.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
              {customer.code && (
                <code className="text-sm bg-muted px-2 py-0.5 rounded">
                  {customer.code}
                </code>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/apps/${slug}/inventory/customers/${customerId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total ventes</p>
              <p className="text-xl font-bold">{customer.total_sales || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CA total</p>
              <p className="text-lg font-bold">{formatCurrency(customer.total_purchases || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dette actuelle</p>
              <p className={cn(
                "text-lg font-bold",
                (customer.total_debt || 0) > customer.credit_limit && "text-red-600"
              )}>
                {formatCurrency(customer.total_debt || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Limite crédit</p>
              <p className="text-lg font-bold">{formatCurrency(customer.credit_limit)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Usage Bar */}
      {customer.credit_limit > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Utilisation du crédit</span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(customer.total_debt || 0)} / {formatCurrency(customer.credit_limit)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={cn(
                "h-3 rounded-full transition-all",
                creditUsagePercent < 70 && "bg-green-500",
                creditUsagePercent >= 70 && creditUsagePercent < 90 && "bg-orange-500",
                creditUsagePercent >= 90 && "bg-red-500"
              )}
              style={{ width: `${creditUsagePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {creditUsagePercent.toFixed(0)}% utilisé
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "info" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("info")}
        >
          <User className="mr-2 h-4 w-4" />
          Informations
        </Button>
        <Button
          variant={activeTab === "sales" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sales")}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Historique ventes ({salesHistory.length})
        </Button>
        <Button
          variant={activeTab === "credit" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("credit")}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Crédits ({creditHistory.length})
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{customer.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{customer.phone || "-"}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Adresse</dt>
                <dd className="font-medium">{customer.address || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Ville</dt>
                <dd className="font-medium">{customer.city || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Pays</dt>
                <dd className="font-medium">{customer.country || "-"}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-6 md:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Informations complémentaires
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">NIF</dt>
                <dd className="font-medium">{customer.tax_id || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Créé le</dt>
                <dd className="font-medium">
                  {new Date(customer.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Modifié le</dt>
                <dd className="font-medium">
                  {new Date(customer.updated_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-2">Notes</dt>
                <dd className="text-sm whitespace-pre-wrap">{customer.notes}</dd>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "sales" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">N° Vente</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-right p-4 font-medium">Montant</th>
                  <th className="text-right p-4 font-medium">Payé</th>
                  <th className="text-center p-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      Aucune vente enregistrée
                    </td>
                  </tr>
                ) : (
                  salesHistory.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/apps/${slug}/inventory/sales/${sale.id}`)}
                    >
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {sale.sale_number}
                        </code>
                      </td>
                      <td className="p-4">
                        {new Date(sale.sale_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4 text-right font-bold">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="p-4 text-right text-green-600">
                        {formatCurrency(sale.paid_amount)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={sale.payment_status === "paid" ? "success" : "warning"}>
                          {sale.payment_status_display}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "credit" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Vente</th>
                  <th className="text-left p-4 font-medium">Échéance</th>
                  <th className="text-right p-4 font-medium">Total</th>
                  <th className="text-right p-4 font-medium">Reste</th>
                  <th className="text-center p-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {creditHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      Aucun crédit en cours
                    </td>
                  </tr>
                ) : (
                  creditHistory.map((credit) => (
                    <tr
                      key={credit.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/apps/${slug}/inventory/credit-sales/${credit.id}`)}
                    >
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {credit.sale_number}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className={credit.is_overdue ? "text-red-600 font-bold" : ""}>
                          {new Date(credit.due_date).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold">
                        {formatCurrency(credit.total_amount)}
                      </td>
                      <td className="p-4 text-right text-orange-600">
                        {formatCurrency(credit.remaining_amount)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={credit.is_overdue ? "error" : "warning"}>
                          {credit.is_overdue ? "En retard" : credit.status_display}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
