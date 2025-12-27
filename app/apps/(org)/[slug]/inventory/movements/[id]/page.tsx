"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getMovement, deleteMovement } from "@/lib/services/inventory";
import type { Movement, MovementType } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Trash2,
  Package,
  Calendar,
  FileText,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Building,
} from "lucide-react";
import Link from "next/link";

const movementTypeConfig: Record<MovementType, { label: string; icon: any; variant: "default" | "success" | "warning" | "error" }> = {
  in: { label: "Entrée", icon: ArrowDown, variant: "success" },
  out: { label: "Sortie", icon: ArrowUp, variant: "error" },
  transfer: { label: "Transfert", icon: ArrowRight, variant: "default" },
  adjustment: { label: "Ajustement", icon: RefreshCw, variant: "warning" },
};

export default function MovementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const movementId = params.id as string;

  const [movement, setMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMovementDetails();
  }, [movementId]);

  const loadMovementDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const movementData = await getMovement(movementId);
      setMovement(movementData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du mouvement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!movement) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce mouvement ?`)) {
      return;
    }

    try {
      await deleteMovement(movementId);
      router.push(`/apps/${slug}/inventory/movements`);
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

  if (error || !movement) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error || "Mouvement introuvable"}
        </Alert>
      </div>
    );
  }

  const typeInfo = movementTypeConfig[movement.movement_type];
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/movements`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">Mouvement de stock</h1>
              <Badge variant={typeInfo.variant} className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                {typeInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {movement.reference && (
                <>
                  Référence: <code className="bg-muted px-2 py-1 rounded text-sm">{movement.reference}</code>
                </>
              )}
              {!movement.reference && "Aucune référence"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Movement Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Produit et quantité
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Produit</p>
              <Link
                href={`/apps/${slug}/inventory/products/${movement.product}`}
                className="font-medium hover:text-primary"
              >
                {movement.product_name || movement.product}
              </Link>
            </div>
            {movement.product_sku && (
              <div>
                <p className="text-muted-foreground text-xs">SKU</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {movement.product_sku}
                </code>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">Quantité</p>
              <p className="text-2xl font-bold">
                {movement.movement_type === 'out' && '-'}
                {movement.movement_type === 'in' && '+'}
                {movement.quantity}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-green-600" />
            Entrepôt(s)
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">
                {movement.movement_type === 'transfer' ? 'Entrepôt source' : 'Entrepôt'}
              </p>
              <Link
                href={`/apps/${slug}/inventory/warehouses/${movement.warehouse}`}
                className="font-medium hover:text-primary"
              >
                {movement.warehouse_name || movement.warehouse}
              </Link>
            </div>
            {movement.movement_type === 'transfer' && movement.destination_warehouse && (
              <div>
                <p className="text-muted-foreground text-xs">Entrepôt destination</p>
                <Link
                  href={`/apps/${slug}/inventory/warehouses/${movement.destination_warehouse}`}
                  className="font-medium hover:text-primary"
                >
                  {movement.destination_warehouse_name || movement.destination_warehouse}
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Date Information */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Date du mouvement
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Date du mouvement</p>
            <p className="font-medium">
              {new Date(movement.movement_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date de création</p>
            <p className="text-sm text-muted-foreground">
              {new Date(movement.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
          {movement.updated_at !== movement.created_at && (
            <div>
              <p className="text-muted-foreground text-xs">Dernière modification</p>
              <p className="text-sm text-muted-foreground">
                {new Date(movement.updated_at).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      {movement.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{movement.notes}</p>
        </Card>
      )}
    </div>
  );
}
