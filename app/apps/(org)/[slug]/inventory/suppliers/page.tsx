"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getSuppliers, deleteSupplier } from "@/lib/services/inventory";
import type { Supplier } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Truck,
  Phone,
  Mail,
  MapPin,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";

export default function SuppliersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSuppliers();
  }, [slug]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers({ is_active: true });
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${name}" ?`)) {
      return;
    }

    try {
      await deleteSupplier(id);
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    searchTerm === ""
      ? true
      : supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Définir les raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/inventory/suppliers/new`)),
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
      setSelectedIndex((prev) => Math.min(prev + 1, filteredSuppliers.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredSuppliers[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/suppliers/${filteredSuppliers[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredSuppliers[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/suppliers/${filteredSuppliers[selectedIndex].id}/edit`);
      }
    }, description: "Éditer le fournisseur sélectionné" },
  ], [slug, router, showShortcuts, selectedIndex, filteredSuppliers]);

  useKeyboardShortcuts({ shortcuts });

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
        title="Raccourcis clavier - Fournisseurs"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos fournisseurs et partenaires
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
            <Link href={`/apps/${slug}/inventory/suppliers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau fournisseur
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
            placeholder="Rechercher par nom, code ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-20"
            aria-label="Rechercher des fournisseurs"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" role="alert">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Suppliers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="grid" aria-label="Liste des fournisseurs">
        {filteredSuppliers.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
            <p className="text-muted-foreground">Aucun fournisseur trouvé</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer un nouveau fournisseur
            </p>
          </Card>
        ) : (
          filteredSuppliers.map((supplier, index) => (
            <Card
              key={supplier.id}
              className={cn(
                "p-6 hover:shadow-lg transition-all cursor-pointer",
                selectedIndex === index && "ring-2 ring-primary bg-primary/5"
              )}
              onClick={() => setSelectedIndex(index)}
              onDoubleClick={() => router.push(`/apps/${slug}/inventory/suppliers/${supplier.id}`)}
              tabIndex={0}
              role="row"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{supplier.code}</code>
                    </p>
                  </div>
                </div>
                <Badge variant={supplier.is_active ? "default" : "secondary"}>
                  {supplier.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {supplier.contact_person && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Contact:</span>{" "}
                    <span className="font-medium">{supplier.contact_person}</span>
                  </p>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{supplier.phone}</span>
                  </div>
                )}
                {supplier.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{supplier.city}{supplier.country && `, ${supplier.country}`}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                  <p className="text-lg font-bold">{supplier.order_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('fr-FR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(supplier.total_orders_amount || 0)} GNF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/apps/${slug}/inventory/suppliers/${supplier.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </Link>
                <Link href={`/apps/${slug}/inventory/suppliers/${supplier.id}/edit`}>
                  <Button variant="ghost" size="sm" aria-label={`Éditer ${supplier.name}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(supplier.id, supplier.name);
                  }}
                  aria-label={`Supprimer ${supplier.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Total: {filteredSuppliers.length} fournisseur(s)
      </div>

      {/* Hint */}
      <KeyboardHint />
    </div>
  );
}
