"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getCategory, deleteCategory, getProducts } from "@/lib/services/inventory";
import type { Category, Product } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Tag,
  ChevronRight,
  Package,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoryData, productsData] = await Promise.all([
        getCategory(categoryId),
        getProducts({ category: categoryId }),
      ]);
      setCategory(categoryData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      router.push(`/apps/${slug}/inventory/categories`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
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

  if (error || !category) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="error" title="Erreur">
          {error || "Catégorie introuvable"}
        </Alert>
        <Link href={`/apps/${slug}/inventory/categories`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux catégories
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/categories`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <Badge variant={category.is_active ? "default" : "secondary"}>
                {category.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">
                {category.code}
              </code>
              {category.parent_name && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-sm">Sous-catégorie de: {category.parent_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${slug}/inventory/categories/${categoryId}/edit`}>
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

      {/* Category Information */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produits</p>
              <p className="text-2xl font-bold">{category.product_count || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valeur totale</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(
                  products.reduce((sum, p) => sum + (p.total_stock || 0) * p.purchase_price, 0)
                )} GNF
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créée le</p>
              <p className="text-lg font-semibold">
                {new Date(category.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      {category.description && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-muted-foreground">{category.description}</p>
        </Card>
      )}

      {/* Products in this category */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Produits dans cette catégorie</h2>
          <Link href={`/apps/${slug}/inventory/products/new?category=${categoryId}`}>
            <Button variant="outline" size="sm">
              <Package className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Produit</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-right p-4 font-medium">Stock</th>
                  <th className="text-right p-4 font-medium">Prix d'achat</th>
                  <th className="text-right p-4 font-medium">Prix de vente</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {product.sku}
                      </code>
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant={product.is_low_stock ? "destructive" : "default"}>
                        {product.total_stock || 0}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'GNF',
                        maximumFractionDigits: 0,
                      }).format(product.purchase_price)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'GNF',
                        maximumFractionDigits: 0,
                      }).format(product.selling_price)}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/apps/${slug}/inventory/products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
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
