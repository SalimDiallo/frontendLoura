"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { createSupplier } from "@/lib/services/inventory";
import type { SupplierCreate } from "@/lib/types/inventory";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function NewSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SupplierCreate>({
    name: "",
    code: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    notes: "",
    is_active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createSupplier(formData);
      router.push(`/apps/${slug}/inventory/suppliers`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du fournisseur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/suppliers`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau fournisseur</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau fournisseur à votre inventaire
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
                placeholder="Ex: Fournisseur ABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Code <span className="text-destructive">*</span>
              </label>
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="Ex: SUPP-001"
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations de contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Personne de contact
              </label>
              <Input
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Nom du contact"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@fournisseur.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+224 XXX XXX XXX"
              />
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Adresse</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Adresse</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rue, numéro, bâtiment..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">Ville</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Conakry"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Code postal
                </label>
                <Input
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="00000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Guinée"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations complémentaires</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Informations supplémentaires sur le fournisseur..."
              />
            </div>
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
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Création en cours..." : "Créer le fournisseur"}
          </Button>
          <Link href={`/apps/${slug}/inventory/suppliers`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
