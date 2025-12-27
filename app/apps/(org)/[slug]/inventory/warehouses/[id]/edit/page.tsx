"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { getWarehouse, updateWarehouse } from "@/lib/services/inventory";
import type { WarehouseUpdate } from "@/lib/types/inventory";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { generateWarehouseCode } from "@/lib/utils/code-generator";

export default function EditWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const warehouseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<WarehouseUpdate>({
    name: "",
    code: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    is_active: true,
  });

  useEffect(() => {
    loadWarehouse();
  }, [warehouseId]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWarehouse(warehouseId);

      setFormData({
        name: data.name,
        code: data.code,
        address: data.address || "",
        city: data.city || "",
        postal_code: data.postal_code || "",
        country: data.country || "",
        is_active: data.is_active,
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'entrepôt");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleGenerateCode = () => {
    const code = generateWarehouseCode(formData.name, formData.city);
    if (code) {
      setFormData(prev => ({ ...prev, code }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      await updateWarehouse(warehouseId, formData);
      router.push(`/apps/${slug}/inventory/warehouses/${warehouseId}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de l'entrepôt");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/warehouses/${warehouseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Modifier l'entrepôt</h1>
          <p className="text-muted-foreground mt-1">
            Mettez à jour les informations de l'entrepôt
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom de l'entrepôt <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Entrepôt Central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Code <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="Ex: WH-CNK-001"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={!formData.name}
                  title="Générer automatiquement le code"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Généré à partir du nom et de la ville
              </p>
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Adresse</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Adresse complète</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ex: 123 Avenue de la République"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">Ville</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ex: Conakry"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Code postal</label>
                <Input
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="Ex: 00000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Ex: Guinée"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              id="is_active"
              className="h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Entrepôt actif
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
          <Link href={`/apps/${slug}/inventory/warehouses/${warehouseId}`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
