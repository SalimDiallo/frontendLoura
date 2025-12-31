"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button, Alert, Card, Input, Badge } from "@/components/ui";
import { 
  getExpenseCategories, 
  createExpenseCategory, 
  updateExpenseCategory, 
  deleteExpenseCategory 
} from "@/lib/services/inventory";
import type { ExpenseCategory } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Tag,
  Save,
  X,
  Loader2,
  Search,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ExpenseCategoriesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit/Create state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Create new
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    try {
      setSaving(true);
      const newCat = await createExpenseCategory({
        name: newName.trim(),
        description: newDescription.trim(),
        is_active: true,
      });
      setCategories(prev => [...prev, newCat]);
      setCreating(false);
      setNewName("");
      setNewDescription("");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditActive(cat.is_active);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    
    try {
      setSaving(true);
      const updated = await updateExpenseCategory(editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
        is_active: editActive,
      });
      setCategories(prev => prev.map(c => c.id === editingId ? updated : c));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setDeleting(true);
      await deleteExpenseCategory(deleteId);
      setCategories(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = categories.filter(c => c.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir supprimer cette catégorie ? 
              Les dépenses associées ne seront pas supprimées mais n'auront plus de catégorie.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}/inventory/expenses`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Catégories de dépenses
            </h1>
            <p className="text-muted-foreground">
              {activeCount} catégorie{activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Create Form */}
      {creating && (
        <Card className="p-4 border-primary">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Transport, Fournitures, Marketing..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description optionnelle..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCreating(false); setNewName(""); setNewDescription(""); }}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Créer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories List */}
      <Card className="divide-y">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune catégorie trouvée</p>
            {!creating && (
              <Button variant="outline" className="mt-4" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            )}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className={cn("p-4", !cat.is_active && "opacity-60 bg-muted/30")}>
              {editingId === cat.id ? (
                // Edit mode
                <div className="grid gap-3">
                  <div className="flex gap-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nom de la catégorie"
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      Active
                    </label>
                  </div>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Annuler
                    </Button>
                    <Button size="sm" onClick={handleUpdate} disabled={!editName.trim() || saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      cat.is_active ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"
                    )}>
                      <Tag className={cn("h-5 w-5", cat.is_active ? "text-orange-600" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cat.name}</p>
                        {!cat.is_active && (
                          <Badge variant="default" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      )}
                      {cat.expense_count !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat.expense_count} dépense{cat.expense_count > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteId(cat.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </Card>

      {/* Stats */}
      <div className="text-sm text-muted-foreground text-center">
        {categories.length} catégorie{categories.length > 1 ? "s" : ""} au total •
        {activeCount} active{activeCount > 1 ? "s" : ""} •
        {categories.length - activeCount} inactive{categories.length - activeCount > 1 ? "s" : ""}
      </div>
    </div>
  );
}
