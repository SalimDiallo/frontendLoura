"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { createCustomer } from "@/lib/services/inventory";
import type { CustomerCreate } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerCreate>({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Guinée",
    credit_limit: 0,
    notes: "",
    tax_id: "",
    is_active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Le nom du client est requis");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createCustomer(formData);
      router.push(`/apps/${slug}/inventory/customers`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/customers`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau client</h1>
          <p className="text-muted-foreground">
            Créez un nouveau client dans votre base
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Informations de base */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations générales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du client *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom complet ou raison sociale"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code client</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="CLT-001 (optionnel, auto-généré si vide)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Numéro fiscal (NIF)</Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="Numéro d'identification fiscale"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active">Client actif</Label>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemple.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+224 XXX XXX XXX"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Adresse */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rue, quartier, commune..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Conakry"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Guinée"
                />
              </div>
            </div>
          </Card>

          {/* Finances */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Crédit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite de crédit (GNF)</Label>
                <Input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Montant maximum de crédit autorisé pour ce client
                </p>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Informations complémentaires sur ce client..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/inventory/customers`}>Annuler</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Création...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Créer le client
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
