"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getCategories, deleteCategory } from "@/lib/services/inventory";
import type { Category } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Tag,
  AlertTriangle,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, [slug]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories({ is_active: true });
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`)) {
      return;
    }

    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const filteredCategories = categories.filter((category) =>
    searchTerm === ""
      ? true
      : category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group categories by hierarchy
  const rootCategories = filteredCategories.filter(c => !c.parent);
  const getCategoryChildren = (parentId: string) =>
    filteredCategories.filter(c => c.parent === parentId);

  // Flatten categories for keyboard navigation
  const flattenedCategories = useMemo(() => {
    const result: Category[] = [];
    const addWithChildren = (category: Category) => {
      result.push(category);
      const children = getCategoryChildren(category.id);
      children.forEach(addWithChildren);
    };
    rootCategories.forEach(addWithChildren);
    return result;
  }, [filteredCategories, rootCategories]);

  // Définir les raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/inventory/categories/new`)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchTerm("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, flattenedCategories.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && flattenedCategories[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/categories/${flattenedCategories[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && flattenedCategories[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/categories/${flattenedCategories[selectedIndex].id}/edit`);
      }
    }, description: "Éditer la catégorie sélectionnée" },
  ], [slug, router, showShortcuts, selectedIndex, flattenedCategories]);

  useKeyboardShortcuts({ shortcuts });

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getCategoryChildren(category.id);
    const hasChildren = children.length > 0;
    const categoryIndex = flattenedCategories.findIndex(c => c.id === category.id);
    const isSelected = categoryIndex === selectedIndex;

    return (
      <div key={category.id}>
        <Card
          className={cn(
            "p-4 mb-3 hover:shadow-md transition-all cursor-pointer",
            isSelected && "ring-2 ring-primary bg-primary/5"
          )}
          style={{ marginLeft: `${level * 2}rem` }}
          onClick={() => setSelectedIndex(categoryIndex)}
          onDoubleClick={() => router.push(`/apps/${slug}/inventory/categories/${category.id}`)}
          tabIndex={0}
          role="row"
          aria-selected={isSelected}
        >
          <div className="flex items-center justify-between">
            <Link
              href={`/apps/${slug}/inventory/categories/${category.id}`}
              className="flex items-center gap-3 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.code && (
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">
                      {category.code}
                    </code>
                  )}
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {hasChildren && (
                    <Badge variant="outline">
                      {children.length} sous-catégorie{children.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{category.product_count || 0} produit(s)</span>
                  {category.parent_name && (
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      <span>Parent: {category.parent_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/apps/${slug}/inventory/categories/${category.id}/edit`}>
                <Button variant="outline" size="sm" aria-label={`Éditer ${category.name}`}>
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(category.id, category.name);
                }}
                aria-label={`Supprimer ${category.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
        {hasChildren && (
          <div>
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Catégories"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catégories de produits</h1>
          <p className="text-muted-foreground mt-1">
            Organisez vos produits par catégories hiérarchiques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/categories/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
              <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher par nom ou code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-20"
            aria-label="Rechercher des catégories"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Erreur" role="alert">
          {error}
        </Alert>
      )}

      {/* Categories List */}
      <div role="grid" aria-label="Liste des catégories">
        {filteredCategories.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucune catégorie trouvée</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer une nouvelle catégorie
            </p>
          </Card>
        ) : rootCategories.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Aucune catégorie racine ne correspond à votre recherche
            </p>
          </Card>
        ) : (
          rootCategories.map(category => renderCategory(category))
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Total: {filteredCategories.length} catégorie(s)</p>
        <div className="flex gap-4">
          <span>{rootCategories.length} racine(s)</span>
          <span>{filteredCategories.filter(c => c.parent).length} sous-catégorie(s)</span>
        </div>
      </div>

      {/* Hint */}
      <KeyboardHint />
    </div>
  );
}
