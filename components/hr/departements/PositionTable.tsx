"use client";

import { useEffect, useState, useRef, useMemo, Dispatch, SetStateAction } from "react";
import { useParams, useRouter, useRouter as UseRouterType } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, Button, Card, Input, Badge } from "@/components/ui";
import type { Position } from "@/lib/types/hr";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";

// Import the DeleteConfirmation dialog
import { DeleteConfirmation } from "@/components/common/confirmation-dialog";

// -----------------------------
// Typage pour PositionsTable
type PositionsTableProps = {
  positions: Position[];
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  openPositionModal: (position?: Position) => void;
  handleDeletePosition: (id: string) => void;
  deleting: string | null;
};

// Composant PositionsTable
export function PositionsTable({
  positions,
  selectedIndex,
  setSelectedIndex,
  openPositionModal,
  handleDeletePosition,
  deleting,
}: PositionsTableProps) {
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);

  // Find the "to be deleted" position for dialog label.
  const positionBeingDeleted = positions.find((p) => p.id === deleteDialogOpenId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base p-4">Titre</TableHead>
            <TableHead className="text-base p-4">Description</TableHead>
            <TableHead className="text-base p-4">Statut</TableHead>
            <TableHead className="text-base p-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions?.map((position, index) => (
            <TableRow
              key={position.id}
              className={cn(
                "cursor-pointer transition-colors text-lg",
                selectedIndex === index && "bg-primary/10 ring-2 ring-primary"
              )}
              style={{ minHeight: "52px" }}
              onClick={() => setSelectedIndex(index)}
              tabIndex={0}
              role="row"
              aria-selected={selectedIndex === index}
            >
              <TableCell className="font-medium text-base p-4">{position.title}</TableCell>
              <TableCell className="p-4">
                <span className="text-base text-muted-foreground">
                  {position.description || "-"}
                </span>
              </TableCell>
              <TableCell className="p-4">
                <Badge variant={position.is_active ? "success" : "outline"} className="text-sm px-3 py-1">
                  {position.is_active ? "Actif" : "Inactif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right p-4">
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center justify-end gap-2">
                    <Can permission={COMMON_PERMISSIONS.HR.UPDATE_POSITIONS}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="default"
                            className="size-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPositionModal(position);
                            }}
                          >
                            <HiOutlinePencil className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-base p-2 px-3">Modifier</TooltipContent>
                      </Tooltip>
                    </Can>
                    <Can permission={COMMON_PERMISSIONS.HR.DELETE_POSITIONS}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="default"
                            className="size-9 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogOpenId(position.id);
                            }}
                            disabled={deleting === position.id}
                          >
                            <HiOutlineTrash className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-base p-2 px-3">Supprimer</TooltipContent>
                      </Tooltip>
                    </Can>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        open={!!deleteDialogOpenId}
        onOpenChange={(open) => setDeleteDialogOpenId(open ? deleteDialogOpenId : null)}
        itemName={positionBeingDeleted?.title}
        onConfirm={() => {
          if (deleteDialogOpenId) {
            handleDeletePosition(deleteDialogOpenId);
          }
        }}
        loading={deleting === deleteDialogOpenId}
      />
    </>
  );
}

// -----------------------------
// Typage pour ModalPosition
type ModalPositionProps = {
  isOpen: boolean;
  closePositionModal: () => void;
  editingPosition: Position | null;
  positionTitle: string;
  setPositionTitle: Dispatch<SetStateAction<string>>;
  positionDescription: string;
  setPositionDescription: Dispatch<SetStateAction<string>>;
  handleSavePosition: () => void;
  savingPosition: boolean;
};

// Composant ModalPosition
export function ModalPosition({
  isOpen,
  closePositionModal,
  editingPosition,
  positionTitle,
  setPositionTitle,
  positionDescription,
  setPositionDescription,
  handleSavePosition,
  savingPosition,
}: ModalPositionProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-2 p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">
            {editingPosition ? "Modifier le poste" : "Créer un poste"}
          </h3>
          <button onClick={closePositionModal} className="p-1.5 hover:bg-muted rounded">
            <HiOutlineXMark className="size-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium mb-2">Titre du poste *</label>
            <input
              type="text"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              placeholder="ex: Développeur Senior"
              className="w-full h-12 rounded-md border border-input bg-background px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-base font-medium mb-2">Description</label>
            <textarea
              value={positionDescription}
              onChange={(e) => setPositionDescription(e.target.value)}
              placeholder="Description du poste..."
              rows={4}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="h-10 px-4 py-2 text-base"
              onClick={closePositionModal}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="default"
              className="h-10 px-4 py-2 text-base"
              disabled={!positionTitle.trim() || savingPosition}
              onClick={handleSavePosition}
            >
              {savingPosition ? "Enregistrement..." : (editingPosition ? "Modifier" : "Créer")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
