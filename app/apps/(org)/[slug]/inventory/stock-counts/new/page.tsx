"use client";

import { Can } from "@/components/apps/common";
import { Alert, Button, Card, Input, QuickSelect } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createStockCount, generateStockCountItems, getCategories, getWarehouses } from "@/lib/services/inventory";
import type { GenerateItemsOptions } from "@/lib/services/inventory/stock-count.service";
import type { Category, Warehouse } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_STOCK_COUNTS} showMessage>
        <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild aria-label="Retour à la liste">
            <Link href={`/apps/${slug}/inventory/stock-counts`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              Nouvel inventaire
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Créez un nouvel inventaire physique
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
        <Card className="p-6 bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Warehouse */}
              <FormField
                control={form.control}
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrepôt *</FormLabel>
                    <FormControl>
                      <div>
                        <QuickSelect
                          label="Entrepôt"
                          items={warehouses.map((w) => ({
                            id: w.id,
                            name: w.name,
                            subtitle: w.code ? `Code: ${w.code}` : undefined,
                          }))}
                          selectedId={field.value}
                          onSelect={field.onChange}
                          placeholder="Sélectionner un entrepôt"
                          accentColor="primary"
                          required
                          canCreate={false}
                          disabled={field.disabled}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {selectedWarehouse ? (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {selectedWarehouse.product_count || 0} produits disponibles
                        {selectedWarehouse.city && ` • ${selectedWarehouse.city}`}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Sélectionnez l'entrepôt à inventorier
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Count Date */}
              <FormField
                control={form.control}
                name="count_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de l'inventaire *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} aria-required="true" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Count Number */}
            <FormField
              control={form.control}
              name="count_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro d'inventaire *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="INV-YYYYMMDD-XXX" aria-required="true" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Ce numéro a été généré automatiquement
                  </p>
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
                  <FormLabel>Notes et observations</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Ajoutez des notes ou observations (optionnel)..."
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Précisez le contexte, les participants, ou toute information utile
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section Auto-génération */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-semibold mb-4">Options de génération</h3>

              <div className="p-5 rounded-lg border bg-background">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto_generate"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto_generate" className="text-sm font-medium cursor-pointer block">
                      Générer automatiquement les articles à partir du stock
                    </label>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      Les lignes d'inventaire seront créées automatiquement pour tous les produits présents dans l'entrepôt sélectionné
                    </p>
                  </div>
                </div>

                {autoGenerate ? (
                  <div className="mt-5 pt-5 border-t space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="include_zero"
                        checked={generateOptions.include_zero_stock}
                        onChange={(e) => setGenerateOptions({ ...generateOptions, include_zero_stock: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-input cursor-pointer"
                      />
                      <label htmlFor="include_zero" className="text-sm cursor-pointer flex-1">
                        Inclure les produits avec stock à zéro
                      </label>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Filtrer par catégorie</label>
                      <select
                        value={generateOptions.category_id || ""}
                        onChange={(e) => setGenerateOptions({ ...generateOptions, category_id: e.target.value || undefined })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Optionnel : sélectionnez une catégorie pour limiter la génération
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Vous devrez ajouter manuellement les articles à inventorier après la création
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t mt-6">
              <p className="text-xs text-muted-foreground">
                * Champs obligatoires
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" asChild disabled={submitting}>
                  <Link href={`/apps/${slug}/inventory/stock-counts`}>
                    Annuler
                  </Link>
                </Button>
                <Button type="submit" disabled={submitting || !form.watch("warehouse_id")}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Création en cours...
                    </>
                  ) : (
                    "Créer l'inventaire"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </Card>

        {/* Informations */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Processus */}
          <Card className="p-5 bg-background">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Processus d'inventaire</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground font-medium min-w-[22px]">1.</span>
                <span className="text-muted-foreground leading-relaxed">Création de l'inventaire</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground font-medium min-w-[22px]">2.</span>
                <span className="text-muted-foreground leading-relaxed">Génération automatique des articles</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground font-medium min-w-[22px]">3.</span>
                <span className="text-muted-foreground leading-relaxed">Saisie des quantités comptées</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground font-medium min-w-[22px]">4.</span>
                <span className="text-muted-foreground leading-relaxed">Vérification et complétion</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground font-medium min-w-[22px]">5.</span>
                <span className="text-muted-foreground leading-relaxed">Validation et ajustement du stock</span>
              </div>
            </div>
          </Card>

          {/* Fonctionnement */}
          <Card className="p-5 bg-background">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Fonctionnement</h3>
            <div className="space-y-3.5 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Génération automatique</p>
                <p className="text-muted-foreground leading-relaxed">Les articles sont créés à partir du stock actuel de l'entrepôt avec la quantité système comme référence.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Détection des écarts</p>
                <p className="text-muted-foreground leading-relaxed">Le système calcule automatiquement les différences entre le stock système et le stock physique compté.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Ajustement automatique</p>
                <p className="text-muted-foreground leading-relaxed">Après validation, les ajustements de stock sont appliqués automatiquement dans le système.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </Can>
  );
}
