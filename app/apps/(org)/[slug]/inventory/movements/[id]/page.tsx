"use client";

import { Badge, Button, Card } from "@/components/ui";
import { deleteMovement, getMovement } from "@/lib/services/inventory";
import type { Movement, MovementType } from "@/lib/types/inventory";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building,
  Calendar,
  FileText,
  Package,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// IMPORTANT: import DeleteConfirmation dialog
import { Can } from "@/components/apps/common";
import { DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatDate } from "@/lib/utils";

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

  // For delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMovementDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    setDeleting(true);
    try {
      await deleteMovement(movementId);
      router.push(`/apps/${slug}/inventory/movements`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
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

 

  const typeInfo = movement?.movement_type ? movementTypeConfig[movement.movement_type] : movementTypeConfig["in"];
  const TypeIcon = typeInfo.icon;

  return (
 <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK} showMessage>
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
              {movement?.reference && (
                <>
                  Référence: <code className="bg-muted px-2 py-1 rounded text-sm">{movement?.reference}</code>
                </>
              )}
              {!movement?.reference && "Aucune référence"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK}>
        <Button
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <DeleteConfirmation
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            itemName={
              "du mouvement" +
              (movement?.reference ? ` "${movement?.reference}"` : "")
            }
            onConfirm={handleDelete}
            loading={deleting}
          />
        </Can>
        </div>
      </div>

      {/* Movement Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-foreground" />
            Produit et quantité
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Produit</p>
              <Link
                href={`/apps/${slug}/inventory/products/${movement?.product}`}
                className="font-medium hover:text-primary"
              >
                {movement?.product_name || movement?.product}
              </Link>
            </div>
            {movement?.product_sku && (
              <div>
                <p className="text-muted-foreground text-xs">SKU</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {movement?.product_sku}
                </code>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">Quantité</p>
              <p className="text-2xl font-bold">
                {movement?.movement_type === "out" && "-"}
                {movement?.movement_type === "in" && "+"}
                {movement?.quantity}
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
                {movement?.movement_type === "transfer"
                  ? "Entrepôt source"
                  : "Entrepôt"}
              </p>
              <Link
                href={`/apps/${slug}/inventory/warehouses/${movement?.warehouse}`}
                className="font-medium hover:text-primary"
              >
                {movement?.warehouse_name || movement?.warehouse}
              </Link>
            </div>
            {movement?.movement_type === "transfer" && movement?.destination_warehouse && (
              <div>
                <p className="text-muted-foreground text-xs">Entrepôt destination</p>
                <Link
                  href={`/apps/${slug}/inventory/warehouses/${movement?.destination_warehouse}`}
                  className="font-medium hover:text-primary"
                >
                  {movement?.destination_warehouse_name || movement?.destination_warehouse}
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
              {movement?.movement_date
                ? formatDate(movement.movement_date, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date de création</p>
            <p className="text-sm text-muted-foreground">
              {movement?.created_at
                ? formatDate(movement.created_at)
                : ""}
            </p>
          </div>
          {movement?.updated_at !== movement?.created_at && (
            <div>
              <p className="text-muted-foreground text-xs">Dernière modification</p>
              <p className="text-sm text-muted-foreground">
                {movement?.updated_at
                  ? formatDate(movement.updated_at, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      {movement?.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{movement?.notes}</p>
        </Card>
      )}
    </div>
 </Can>
  );
}
