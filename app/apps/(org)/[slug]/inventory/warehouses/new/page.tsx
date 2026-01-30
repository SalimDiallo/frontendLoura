"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { createWarehouse } from "@/lib/services/inventory";
import type { WarehouseCreate } from "@/lib/types/inventory";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";

// Fonction utilitaire pour générer un code à partir du nom et de la date
function generateCode(name: string, city: string) {
  // Code: WH-[ville]-[AAAAMMJJ]-[3lettres du nom]
  const today = new Date();
  const dateStr = today
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, ""); // YYYYMMDD
  // 3 premières lettres non-accentuées du nom sans espaces
  const cleanedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
  const code =
    "WH-" +
    (city ? city.toUpperCase().slice(0, 3) : "XXX") +
    "-" +
    dateStr +
    "-" +
    (cleanedName.length >= 3 ? cleanedName.toUpperCase().slice(0, 3) : "NEW");
  return code;
}

export default function NewWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WarehouseCreate>({
    name: "",
    code: "",
    address: "",
    city: "",
    country: "Guinée",
    manager_name: "",
    phone: "",
    email: "",
    is_active: true,
  });

  // Auto-met à jour le code à la saisie du nom, de la ville ou à l'initialisation
  useEffect(() => {
    // Ne change le code que si l'utilisateur n'a pas manuellement modifié
    setFormData((prev) => {
      // Si le code était vide ou auto-généré avant, on met à jour
      const autoCode = generateCode(prev.name, prev.city ?? prev.country ?? "");
      // Si le code en cours est manuellement édité, on ne touche pas
      if (
        prev.code === "" ||
        prev.code.startsWith("WH-") // suppose que si le code suit ce format, il est auto, sinon c'est manuel
      ) {
        return { ...prev, code: autoCode };
      }
      // Cas où l'utilisateur a déjà écrit un code, on n'écrase pas
      return prev;
    });
    // eslint-disable-next-line
  }, [formData.name, formData.city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createWarehouse(formData);
      router.push(`/apps/${slug}/inventory/warehouses`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'entrepôt");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof WarehouseCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/warehouses`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouvel entrepôt</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau lieu de stockage
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Informations de base */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Informations de base</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom de l'entrepôt <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="Ex: Entrepôt principal Conakry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  required
                  placeholder="Généré automatiquement, mais modifiable"
                  // Explication à l'utilisateur
                  autoComplete="off"
                />
                <div className="text-xs text-muted-foreground">
                  Ce code est généré automatiquement à partir du nom, de la ville et de la date.
                  Vous pouvez le modifier si besoin.
                </div>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Localisation</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Adresse complète..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Ex: Conakry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="Ex: Guinée"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Responsable</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="manager_name">Nom du responsable</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => handleChange("manager_name", e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Ex: +224 xxx xx xx xx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Ex: responsable@example.com"
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Entrepôt actif
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Création..." : "Créer l'entrepôt"}
            </Button>
            <Link href={`/apps/${slug}/inventory/warehouses`}>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
