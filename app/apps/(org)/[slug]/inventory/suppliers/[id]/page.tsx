"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getSupplier, deleteSupplier } from "@/lib/services/inventory";
import type { Supplier } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Building,
  FileText,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSupplierDetails();
  }, [supplierId]);

  const loadSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const supplierData = await getSupplier(supplierId);
      setSupplier(supplierData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du fournisseur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" ?`)) {
      return;
    }

    try {
      await deleteSupplier(supplierId);
      router.push(`/apps/${slug}/inventory/suppliers`);
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

  if (error || !supplier) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error || "Fournisseur introuvable"}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/suppliers`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <Badge variant={supplier.is_active ? "default" : "secondary"}>
                {supplier.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Code: <code className="bg-muted px-2 py-1 rounded text-sm">{supplier.code}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${slug}/inventory/suppliers/${supplierId}/edit`}>
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

      {/* Contact Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Informations de contact
          </h3>
          <div className="space-y-3 text-sm">
            {supplier.contact_person && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Personne de contact</p>
                  <p className="font-medium">{supplier.contact_person}</p>
                </div>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <a href={`mailto:${supplier.email}`} className="font-medium hover:text-primary">
                    {supplier.email}
                  </a>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Téléphone</p>
                  <a href={`tel:${supplier.phone}`} className="font-medium hover:text-primary">
                    {supplier.phone}
                  </a>
                </div>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Site web</p>
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-primary"
                  >
                    {supplier.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Adresse
          </h3>
          <div className="text-sm text-muted-foreground space-y-1">
            {supplier.address && <p>{supplier.address}</p>}
            <p>
              {supplier.city && <span>{supplier.city}</span>}
              {supplier.postal_code && <span>, {supplier.postal_code}</span>}
            </p>
            {supplier.country && <p>{supplier.country}</p>}
            {!supplier.address && !supplier.city && !supplier.country && (
              <p className="italic">Aucune adresse renseignée</p>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {supplier.tax_id && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Informations fiscales
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Numéro fiscal</p>
                <p className="font-medium">{supplier.tax_id}</p>
              </div>
            </div>
          </Card>
        )}

        {supplier.payment_terms && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-600" />
              Conditions de paiement
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{supplier.payment_terms}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Notes */}
      {supplier.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
        </Card>
      )}
    </div>
  );
}
