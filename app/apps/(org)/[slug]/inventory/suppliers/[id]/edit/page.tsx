"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { getSupplier, updateSupplier } from "@/lib/services/inventory";
import type { SupplierUpdate } from "@/lib/types/inventory";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { generateSupplierCode } from "@/lib/utils/code-generator";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supplierId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SupplierUpdate>({
    name: "",
    code: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    website: "",
    tax_id: "",
    payment_terms: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    loadSupplier();
  }, [supplierId]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplier(supplierId);

      setFormData({
        name: data.name,
        code: data.code,
        contact_person: data.contact_person || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        postal_code: data.postal_code || "",
        country: data.country || "",
        website: data.website || "",
        tax_id: data.tax_id || "",
        payment_terms: data.payment_terms || "",
        notes: data.notes || "",
        is_active: data.is_active,
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du fournisseur");
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
    const code = generateSupplierCode(formData.name);
    if (code) {
      setFormData(prev => ({ ...prev, code }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      await updateSupplier(supplierId, formData);
      router.push(`/apps/${slug}/inventory/suppliers/${supplierId}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du fournisseur");
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
        <Link href={`/apps/${slug}/inventory/suppliers/${supplierId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Modifier le fournisseur</h1>
          <p className="text-muted-foreground mt-1">
            Mettez à jour les informations du fournisseur
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
                Nom du fournisseur <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: ACME Corporation"
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
                  placeholder="Ex: SUPP-ACME-001"
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
                Généré automatiquement à partir du nom
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations de contact</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Personne de contact</label>
                <Input
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: contact@acme.com"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex: +224 123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Site web</label>
                <Input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="Ex: https://www.acme.com"
                />
              </div>
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

        {/* Business Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations commerciales</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Numéro fiscal</label>
                <Input
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="Ex: GN-123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conditions de paiement</label>
                <Input
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  placeholder="Ex: Net 30 jours"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Notes additionnelles sur le fournisseur..."
              />
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
              Fournisseur actif
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
          <Link href={`/apps/${slug}/inventory/suppliers/${supplierId}`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
