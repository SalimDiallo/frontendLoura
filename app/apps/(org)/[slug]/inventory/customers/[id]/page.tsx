"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { getCustomer, getCustomerCreditHistory, getCustomerSalesHistory } from "@/lib/services/inventory";
import type { CreditSale, Customer, SaleList } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Edit,
  FileText,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [customerId]);

  // Auto-refresh when user comes back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && customer) {
        console.log('🔄 Page visible, refreshing customer data...');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [customer]);

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
      if (isManualRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleManualRefresh = () => {
    loadData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-8">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error || "Client non trouvé"}</p>
          </div>
        </Alert>
        <Button className="mt-4" variant="outline" asChild>
          <Link href={`/apps/${slug}/inventory/customers`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  const creditUsagePercent = customer.credit_limit > 0
    ? Math.min(((customer.total_debt || 0) / customer.credit_limit) * 100, 100)
    : 0;

  const totalSalesAmount = customer.total_purchases || 0;
  const totalSalesCount = customer.total_sales || 0;

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS} showMessage>
      <div className="min-h-screen bg-muted/10">
        {/* Header Section */}
        <div className="border-b bg-background">
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link
                href={`/apps/${slug}/inventory/customers`}
                className="hover:text-foreground transition-colors"
              >
                Clients
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{customer.name}</span>
            </div>

            {/* Header Content */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center">
                  <span className="font-bold text-2xl text-primary">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                    <Badge variant={customer.is_active ? "success" : "default"} size="sm">
                      {customer.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  {customer.code && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      <code className="font-mono">{customer.code}</code>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Actualisation..." : "Actualiser"}
                </Button>
                <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_CUSTOMERS}>
                  <Button variant="outline" asChild>
                    <Link href={`/apps/${slug}/inventory/customers/${customerId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </Button>
                </Can>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Ventes</p>
                  <p className="text-xl font-bold">{totalSalesCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/50 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Chiffre d'affaires</p>
                  <p className="text-base font-bold break-words">{formatCurrency(totalSalesAmount)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Dette actuelle</p>
                  <p className={cn(
                    "text-base font-bold break-words",
                    (customer.total_debt || 0) > customer.credit_limit && "text-red-600"
                  )}>
                    {formatCurrency(customer.total_debt || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Limite crédit</p>
                  <p className="text-base font-bold break-words">{formatCurrency(customer.credit_limit)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Credit Usage */}
          {customer.credit_limit > 0 && (
            <Card className="p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Utilisation du crédit</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {creditUsagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="relative w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      creditUsagePercent < 70 && "bg-green-500",
                      creditUsagePercent >= 70 && creditUsagePercent < 90 && "bg-orange-500",
                      creditUsagePercent >= 90 && "bg-red-500"
                    )}
                    style={{ width: `${creditUsagePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(customer.total_debt || 0)} utilisé</span>
                  <span>{formatCurrency(customer.credit_limit)} limite</span>
                </div>
              </div>
            </Card>
          )}

          {/* Tabs Navigation */}
          <div className="border-b">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("info")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium transition-colors relative",
                  activeTab === "info"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations
                </div>
                {activeTab === "info" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("sales")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium transition-colors relative",
                  activeTab === "sales"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ventes
                  <Badge variant="outline" size="sm">{salesHistory.length}</Badge>
                </div>
                {activeTab === "sales" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("credit")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium transition-colors relative",
                  activeTab === "credit"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Crédits
                  <Badge variant="outline" size="sm">{creditHistory.length}</Badge>
                </div>
                {activeTab === "credit" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Contact
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email</span>
                    </div>
                    <p className="text-sm font-medium pl-5">
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`} className="hover:text-primary transition-colors">
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Non renseigné</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>Téléphone principal</span>
                    </div>
                    <p className="text-sm font-medium pl-5">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-primary transition-colors">
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Non renseigné</span>
                      )}
                    </p>
                  </div>
                  {customer.secondary_phone && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>Téléphone secondaire</span>
                      </div>
                      <p className="text-sm font-medium pl-5">
                        <a href={`tel:${customer.secondary_phone}`} className="hover:text-primary transition-colors">
                          {customer.secondary_phone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Address Information */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Localisation
                </h3>
                <div className="space-y-4">
                  {customer.address && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Adresse</span>
                      </div>
                      <p className="text-sm font-medium pl-5">{customer.address}</p>
                    </div>
                  )}
                  {customer.city && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="h-3.5 w-3.5" />
                        <span>Ville</span>
                      </div>
                      <p className="text-sm font-medium pl-5">{customer.city}</p>
                    </div>
                  )}
                  {customer.country && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Pays</span>
                      </div>
                      <p className="text-sm font-medium pl-5">{customer.country}</p>
                    </div>
                  )}
                  {!customer.address && !customer.city && !customer.country && (
                    <p className="text-sm text-muted-foreground">Aucune adresse renseignée</p>
                  )}
                </div>
              </Card>

              {/* Additional Information */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Informations complémentaires
                </h3>
                <div className="space-y-4">
                  {customer.tax_id && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span>NIF / ID Fiscal</span>
                      </div>
                      <p className="text-sm font-medium pl-5 font-mono">{customer.tax_id}</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Client depuis</span>
                    </div>
                    <p className="text-sm font-medium pl-5">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Dernière modification</span>
                    </div>
                    <p className="text-sm font-medium pl-5">
                      {formatDate(customer.updated_at)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Notes - Full Width */}
              {customer.notes && (
                <Card className="p-5 lg:col-span-3">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {customer.notes}
                  </p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "sales" && (
            <Card className="overflow-hidden">
              {salesHistory.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium mb-1">Aucune vente enregistrée</h3>
                  <p className="text-sm text-muted-foreground">
                    Les ventes de ce client apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          N° Vente
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Articles
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Montant total
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Montant payé
                        </th>
                        <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesHistory.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => router.push(`/apps/${slug}/inventory/sales/${sale.id}`)}
                        >
                          <td className="px-5 py-3.5">
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {sale.sale_number}
                            </code>
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            {formatDate(sale.sale_date)}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">
                            {sale.item_count || 0} article(s)
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-right">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-medium text-right text-green-600">
                            {formatCurrency(sale.paid_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge
                              size="sm"
                              variant={
                                sale.payment_status === "paid"
                                  ? "success"
                                  : sale.payment_status === "pending"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {sale.payment_status_display}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {salesHistory.length > 0 && (
                <div className="px-5 py-3 bg-muted/10 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{salesHistory.length} vente(s) au total</span>
                    <span className="font-medium">
                      Total: {formatCurrency(salesHistory.reduce((acc, sale) => acc + sale.total_amount, 0))}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === "credit" && (
            <Card className="overflow-hidden">
              {creditHistory.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium mb-1">Aucun crédit en cours</h3>
                  <p className="text-sm text-muted-foreground">
                    Les crédits de ce client apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Vente
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Date d'échéance
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Montant total
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Payé
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Reste à payer
                        </th>
                        <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditHistory.map((credit) => (
                        <tr
                          key={credit.id}
                          className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => router.push(`/apps/${slug}/inventory/credit-sales/${credit.id}`)}
                        >
                          <td className="px-5 py-3.5">
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {credit.sale_number}
                            </code>
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            {credit.due_date ? (
                              <span className={cn(
                                credit.is_overdue && "text-red-600 font-semibold"
                              )}>
                                {formatDate(credit.due_date)}
                                {credit.is_overdue && (
                                  <span className="ml-2 text-xs">(En retard)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Aucun délai</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-right">
                            {formatCurrency(credit.total_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-medium text-right text-green-600">
                            {formatCurrency(credit.paid_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-right text-orange-600">
                            {formatCurrency(credit.remaining_amount)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge
                              size="sm"
                              variant={credit.is_overdue ? "error" : "warning"}
                            >
                              {credit.status_display}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {creditHistory.length > 0 && (
                <div className="px-5 py-3 bg-muted/10 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{creditHistory.length} crédit(s) en cours</span>
                    <span className="font-medium text-orange-600">
                      Reste à payer: {formatCurrency(creditHistory.reduce((acc, credit) => acc + (credit.remaining_amount || 0), 0))}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Can>
  );
}
