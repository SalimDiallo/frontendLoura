"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { getCustomer, updateCustomer } from "@/lib/services/inventory";
import type { Customer } from "@/lib/types/inventory";
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
import { generateCodeFromName } from "@/lib/utils/code-generator";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const customerId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Customer | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setFetching(true);
        setError(null);
        const data = await getCustomer(customerId);
        setFormData(data);
      } catch (err: any) {
        setError(
          err?.message || "Erreur lors du chargement des données du client."
        );
      } finally {
        setFetching(false);
      }
    }
    fetchCustomer();
  }, [customerId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "number" ? parseFloat(value) || 0 : value,
          }
        : prev
    );
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!formData) return;
    const { name, checked } = e.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: checked,
          }
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (!formData.name.trim()) {
      setError("Le nom du client est requis");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let code = formData?.code?.trim();
      if (!code) {
        code = `CLT-${generateCodeFromName(formData.name, 3)}`;
      }

      const dataToSubmit = { ...formData, code };

      await updateCustomer(customerId, dataToSubmit);
      router.push(`/apps/${slug}/inventory/customers/${customerId}`);
    } catch (err: any) {
      setError(
        err?.message || "Erreur lors de la mise à jour du client"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !formData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded bg-neutral-100 dark:bg-neutral-900 w-2/5 mb-2" />
          <div className="h-10 rounded bg-neutral-100 dark:bg-neutral-900 mb-2" />
          <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Modification client</h1>
          <p className="text-muted-foreground">
            Modifiez les informations du client sélectionné
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
          {/* Informations générales */}
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
                  Enregistrement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Mettre à jour
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
