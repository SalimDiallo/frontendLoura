"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Alert, Card, Input, Badge } from "@/components/ui";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { createStockCount, getWarehouses, generateStockCountItems, getCategories } from "@/lib/services/inventory";
import type { Warehouse, Category } from "@/lib/types/inventory";
import type { GenerateItemsOptions } from "@/lib/services/inventory/stock-count.service";
import {
  ArrowLeft,
  Save,
  Loader2,
  Clipboard,
  Calendar,
  Archive,
  Zap,
  Info,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stockCountSchema = z.object({
  warehouse_id: z.string().min(1, "L'entrepôt est requis"),
  count_number: z.string().min(1, "Le numéro d'inventaire est requis"),
  count_date: z.string().min(1, "La date est requise"),
  notes: z.string().optional(),
});

type StockCountFormData = z.infer<typeof stockCountSchema>;

export default function NewStockCountPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Options d'auto-génération
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generateOptions, setGenerateOptions] = useState<GenerateItemsOptions>({
    include_zero_stock: false,
    overwrite: false,
  });

  const form = useForm<StockCountFormData>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: {
      warehouse_id: "",
      count_number: "",
      count_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [warehousesData, categoriesData] = await Promise.all([
        getWarehouses({ is_active: true }),
        getCategories(),
      ]);
      setWarehouses(warehousesData);
      setCategories(categoriesData);
      
      // Générer un numéro d'inventaire automatique
      const today = new Date();
      const countNumber = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      form.setValue("count_number", countNumber);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StockCountFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Créer l'inventaire
      const newStockCount = await createStockCount(data);
      
      // Si auto-génération activée, générer les articles
      if (autoGenerate) {
        try {
          await generateStockCountItems(newStockCount.id, generateOptions);
        } catch (genErr: any) {
          console.warn("Erreur lors de la génération automatique:", genErr);
          // On continue même si la génération échoue
        }
      }
      
      // Rediriger vers la page de détail
      router.push(`/apps/${slug}/inventory/stock-counts/${newStockCount.id}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'inventaire");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === form.watch("warehouse_id"));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild aria-label="Retour à la liste">
          <Link href={`/apps/${slug}/inventory/stock-counts`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clipboard className="h-8 w-8" aria-hidden="true" />
            Nouvel inventaire
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez un nouvel inventaire physique avec génération automatique des articles
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Warehouse */}
            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Entrepôt *
                  </FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-required="true"
                    >
                      <option value="">Sélectionner un entrepôt</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code}) - {warehouse.product_count || 0} produits
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                  {selectedWarehouse && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {selectedWarehouse.product_count || 0} produits
                      </Badge>
                      {selectedWarehouse.city && (
                        <Badge variant="outline">{selectedWarehouse.city}</Badge>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Count Number */}
            <FormField
              control={form.control}
              name="count_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clipboard className="h-4 w-4" aria-hidden="true" />
                    Numéro d'inventaire *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="INV-YYYYMMDD-XXX" aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Count Date */}
            <FormField
              control={form.control}
              name="count_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Date de l'inventaire *
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Notes ou observations..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section Auto-génération */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Génération automatique</h3>
              </div>
              
              <div className={cn(
                "p-4 rounded-lg border-2 transition-colors",
                autoGenerate 
                  ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700" 
                  : "bg-muted/50 border-muted"
              )}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto_generate"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="mt-1 rounded border-input"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto_generate" className="font-medium cursor-pointer">
                      Générer automatiquement les articles à partir du stock
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tous les produits présents dans l'entrepôt sélectionné seront ajoutés automatiquement avec leurs quantités actuelles comme quantité attendue.
                    </p>
                  </div>
                </div>

                {autoGenerate && (
                  <div className="mt-4 pl-7 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="include_zero"
                        checked={generateOptions.include_zero_stock}
                        onChange={(e) => setGenerateOptions({ ...generateOptions, include_zero_stock: e.target.checked })}
                        className="rounded border-input"
                      />
                      <label htmlFor="include_zero" className="text-sm">
                        Inclure les produits avec stock = 0
                      </label>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Filtrer par catégorie (optionnel)</label>
                      <select
                        value={generateOptions.category_id || ""}
                        onChange={(e) => setGenerateOptions({ ...generateOptions, category_id: e.target.value || undefined })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href={`/apps/${slug}/inventory/stock-counts`}>
                  Annuler
                </Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {autoGenerate ? "Création et génération..." : "Création..."}
                  </>
                ) : (
                  <>
                    {autoGenerate ? (
                      <>
                        <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                        Créer et générer les articles
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                        Créer l'inventaire
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Help */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">💡 Comment ça fonctionne</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Génération automatique :</strong> Les articles sont créés à partir du stock actuel de l'entrepôt avec la quantité système comme quantité attendue.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Comptage rapide :</strong> Il vous suffit ensuite de saisir uniquement les quantités comptées physiquement.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Détection des écarts :</strong> Le système calcule automatiquement les différences entre le stock système et le stock physique.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Validation :</strong> Après validation, les ajustements de stock sont appliqués automatiquement.</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Workflow */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">📋 Workflow de l'inventaire</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Badge variant="outline" className="gap-1">
            1. Création
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="gap-1">
            2. Génération articles
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="warning" className="gap-1">
            3. Comptage physique
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="info" className="gap-1">
            4. Complétion
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="success" className="gap-1">
            5. Validation
          </Badge>
        </div>
      </Card>
    </div>
  );
}
