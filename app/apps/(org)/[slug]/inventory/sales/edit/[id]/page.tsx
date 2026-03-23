"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { usePermissions } from "@/lib/hooks";
import { getSale, updateSale } from "@/lib/services/inventory";
import type { Sale } from "@/lib/types/inventory";
import { INVENTORY_PERMISSIONS } from "@/lib/types/permissions";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit,
  Info,
  Save,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const saleId = params.id as string;

  const { hasPermission } = usePermissions();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formulaire
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSale(saleId);
      setSale(data);
      setItems(data.items || []);
      setNotes(data.notes || "");
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la vente");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Préparer les données
      const updateData = {
        items: items.map(item => ({
          id: item.id,
          product: item.product,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_type: item.discount_type || "fixed",
          discount_value: parseFloat((item.discount_value || 0).toString()),
        })),
        notes,
      };

      await updateSale(saleId, updateData);
      setSuccess(true);

      // Rediriger après 1.5 secondes
      setTimeout(() => {
        router.push(`/apps/${slug}/inventory/sales/${saleId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, quantity);
    setItems(newItems);
  };

  const handleItemPriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].unit_price = Math.max(0, price);
    setItems(newItems);
  };

  const handleItemDiscountChange = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].discount_value = Math.max(0, value);
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Calculer le nouveau total estimé
  const calculateNewTotal = () => {
    let subtotal = 0;
    items.forEach((item) => {
      const itemTotal = item.quantity * item.unit_price - (item.discount_value || 0);
      subtotal += itemTotal;
    });
    // Simplification: on ne prend pas en compte les remises globales et la TVA pour l'estimation
    return subtotal;
  };

  const newTotal = calculateNewTotal();
  const oldTotal = sale?.total_amount || 0;
  const totalPaid = sale?.paid_amount || 0;
  const willAdjustPayments = newTotal < totalPaid;

  // Vérifier les permissions
  const canModify =
    (sale?.payment_status === "pending" &&
      hasPermission(INVENTORY_PERMISSIONS.UPDATE_SALES)) ||
    ((sale?.payment_status === "partial" || sale?.payment_status === "paid") &&
      hasPermission(INVENTORY_PERMISSIONS.MODIFY_PAID_SALES));

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

  if (!canModify) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <strong>Accès refusé</strong>
            <p className="text-sm mt-1">
              Vous n'avez pas la permission de modifier cette vente.
              {sale?.payment_status !== "pending" &&
                " Les ventes payées nécessitent la permission spéciale 'Modifier des ventes payées'."}
            </p>
          </div>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/apps/${slug}/inventory/sales/${saleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/inventory/sales/${saleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Modifier la vente {sale?.sale_number}
            </h1>
            {sale?.payment_status && (
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                Statut:{" "}
                <Badge
                  variant={
                    sale.payment_status === "paid"
                      ? "success"
                      : sale.payment_status === "partial"
                      ? "warning"
                      : "default"
                  }
                  size="sm"
                >
                  {sale.payment_status_display}
                </Badge>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/apps/${slug}/inventory/sales/${saleId}`)}
            disabled={saving}
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || items.length === 0}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <strong>Erreur</strong>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <strong>Succès</strong>
            <p className="text-sm mt-1">La vente a été modifiée avec succès. Redirection...</p>
          </div>
        </Alert>
      )}

      {/* Avertissement pour ventes payées */}
      {(sale?.payment_status === "partial" || sale?.payment_status === "paid") && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <strong>Attention : Vente déjà payée</strong>
            <p className="text-sm mt-1">
              Cette vente a déjà reçu des paiements ({formatCurrency(sale.paid_amount || 0)}).
            </p>
            <div className="mt-2 text-sm space-y-1">
              <p><strong>Gestion automatique des paiements :</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Si le total diminue :</strong> Les derniers paiements seront supprimés ou ajustés automatiquement pour correspondre au nouveau total.</li>
                <li><strong>Si le total augmente :</strong> Le montant restant à payer augmentera automatiquement.</li>
                <li>Vous recevrez une notification détaillant les ajustements effectués.</li>
              </ul>
            </div>
          </div>
        </Alert>
      )}

      {/* Information sur le stock disponible */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <div>
          <strong>Stock disponible pour modification</strong>
          <p className="text-sm mt-1">
            Le stock disponible affiché inclut la quantité déjà vendue dans cette vente.
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            <strong>Exemple :</strong> Si le stock actuel est de 90 unités et que vous avez vendu 10 unités,
            vous pouvez augmenter la quantité jusqu'à 100 unités maximum (90 + 10).
          </p>
        </div>
      </Alert>

      {/* Articles */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Articles de la vente</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez les quantités, prix ou supprimez des articles
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Produit</th>
                <th className="text-center p-4 font-medium">Quantité</th>
                <th className="text-right p-4 font-medium">Prix unitaire</th>
                <th className="text-right p-4 font-medium">Remise</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const subtotal =
                  item.quantity * item.unit_price - (item.discount_value || 0);
                return (
                  <tr key={item.id || index} className="border-b">
                    <td className="p-4">
                      <p className="font-medium">{item.product_name}</p>
                      <code className="text-xs bg-muted px-1 rounded">
                        {item.product_sku}
                      </code>
                      {item.stock_available !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Stock disponible: {item.stock_available} unités
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemQuantityChange(index, parseFloat(e.target.value) || 1)
                        }
                        className="w-20 text-center h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                      {item.stock_available !== undefined && item.quantity > item.stock_available && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠ Dépasse le stock
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemPriceChange(index, parseFloat(e.target.value) || 0)
                        }
                        className="w-32 text-right h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount_value || 0}
                        onChange={(e) =>
                          handleItemDiscountChange(index, parseFloat(e.target.value) || 0)
                        }
                        className="w-32 text-right h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatCurrency(subtotal)}
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        title={items.length === 1 ? "Impossible de supprimer le dernier article" : "Supprimer"}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Résumé des modifications */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Résumé des modifications
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Total actuel :</span>
            <span className="font-semibold">{formatCurrency(oldTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Nouveau total (estimé) :</span>
            <span className={`font-bold ${newTotal !== oldTotal ? "text-orange-600" : ""}`}>
              {formatCurrency(newTotal)}
            </span>
          </div>
          {newTotal !== oldTotal && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Différence :</span>
              <span className={`font-bold ${newTotal > oldTotal ? "text-green-600" : "text-red-600"}`}>
                {newTotal > oldTotal ? "+" : ""}{formatCurrency(newTotal - oldTotal)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Paiements existants */}
      {sale?.payments && sale.payments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Paiements existants ({sale.payments.length})</h3>

          {/* Alerte si ajustement nécessaire */}
          {willAdjustPayments && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <strong>Ajustement automatique des paiements</strong>
                <p className="text-sm mt-1">
                  Le nouveau total ({formatCurrency(newTotal)}) est inférieur au montant payé ({formatCurrency(totalPaid)}).
                  Les paiements les plus récents seront ajustés ou supprimés pour un excès de {formatCurrency(totalPaid - newTotal)}.
                </p>
              </div>
            </Alert>
          )}

          <div className="space-y-2 mb-4">
            {sale.payments.map((payment, index) => (
              <div
                key={payment.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  willAdjustPayments && index >= sale.payments.length - Math.ceil((totalPaid - newTotal) / payment.amount)
                    ? "bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800"
                    : "bg-muted/50"
                }`}
              >
                <div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString("fr-FR")} •{" "}
                    {payment.payment_method_display} • {payment.receipt_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">
                    Paiement #{index + 1}
                  </Badge>
                  {willAdjustPayments && index >= sale.payments.length - Math.ceil((totalPaid - newTotal) / payment.amount) && (
                    <Badge variant="error" size="sm">
                      Sera ajusté
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total payé :</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(sale.paid_amount || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ℹ Les paiements sont ajustés automatiquement si le total diminue (ordre LIFO - dernier entré, premier sorti).
            </p>
          </div>
        </Card>
      )}

      {/* Notes */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter des notes sur cette vente..."
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </Card>
    </div>
  );
}
