"use client";

import { Button } from "@/components/ui";
import {
    HiOutlineTrash
} from "react-icons/hi2";



export function ContractFooterActions({
  updatedAt,
  canDelete,
  handleDelete,
  deleting,
}: {
  updatedAt: string;
  canDelete: boolean;
  handleDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <div className="text-xs text-muted-foreground">
        Dernière modification : {new Date(updatedAt).toLocaleDateString('fr-FR')} à {new Date(updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <HiOutlineTrash className="size-4 mr-2" />
          {deleting ? "Suppression..." : "Supprimer ce contrat"}
        </Button>
      )}
    </div>
  );
}