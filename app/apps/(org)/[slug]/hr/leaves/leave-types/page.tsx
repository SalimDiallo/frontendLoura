"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { Button, Card } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  getLeaveTypes,
  deleteLeaveType,
  createLeaveType,
  updateLeaveType,
} from "@/lib/services/hr/leave-type.service";
import type { LeaveType } from "@/lib/types/hr";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// -- Formulaire création/édition (presque inchangé, on harmonise juste le style)
function LeaveTypeForm({
  initial,
  onSuccess,
  onCancel,
  mode,
}: {
  initial?: Partial<LeaveType>;
  onSuccess: (lt: LeaveType) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result: LeaveType;
      if (mode === "create") {
        result = await createLeaveType({ name: name.trim(), description: description.trim() });
      } else if (initial?.id) {
        result = await updateLeaveType(initial.id, { name: name.trim(), description: description.trim() });
      } else {
        throw new Error("Type de congé non trouvé");
      }
      onSuccess(result);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xs w-full">
      <Input
        type="text"
        required
        placeholder="Nom*"
        value={name}
        maxLength={60}
        autoFocus
        onChange={e => setName(e.target.value)}
        className={error ? "border-red-600 bg-red-50" : ""}
        disabled={loading}
      />
      <Textarea
        placeholder="Description"
        rows={2}
        value={description}
        maxLength={200}
        onChange={e => setDescription(e.target.value)}
        disabled={loading}
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-3 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading || !name.trim()}>
          {mode === "create" ? "Créer" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: LeaveType | null;
  }>({ open: false, mode: "create", data: null });
  const [message, setMessage] = useState<string | null>(null);

  // Permissions : harmonisation à la page principale, pouvoir faire le check à terme
  const perms = COMMON_PERMISSIONS?.HR || {};

  // Chargement des types de congés (fonctions inspirées/rewrite)
  const reloadLeaveTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getLeaveTypes();
      setLeaveTypes(raw ?? []);
    } catch (e: any) {
      setError(e?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadLeaveTypes();
  }, [reloadLeaveTypes]);

  const filteredTypes = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return leaveTypes;
    return leaveTypes.filter((type) => (type.name || "").toLowerCase().includes(q));
  }, [leaveTypes, searchQuery]);

  // Ouverture des modals
  const openCreateModal = () => {
    setModalState({ open: true, mode: "create", data: null });
    setMessage(null);
  };
  const openEditModal = (item: LeaveType) => {
    setModalState({ open: true, mode: "edit", data: item });
    setMessage(null);
  };
  const closeModal = () => {
    setModalState({ open: false, mode: "create", data: null });
  };

  // A la réussite d'une création/modification
  const handleModalSuccess = async () => {
    closeModal();
    await reloadLeaveTypes();
    setMessage(
      modalState.mode === "create"
        ? "Type créé !"
        : "Type modifié !"
    );
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setMessage(null);
    try {
      await deleteLeaveType(deleteId);
      setMessage("Type supprimé !");
      await reloadLeaveTypes();
      setDeleteId(null);
    } catch (e: any) {
      setMessage(e?.message || "Erreur lors de la suppression");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS} showMessage>
      <div className="max-w-2xl mx-auto mt-12 px-2 py-3">
        <Card>
          <div className="flex items-center justify-between mb-6 gap-3 px-4 pt-4">
            <div>
              <h1 className="text-xl font-bold">Types de congé</h1>
              <div className="text-sm text-gray-500 mt-1">
                Gérer les types de congés de l’organisation
              </div>
            </div>
            <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
              <Button onClick={openCreateModal}>Nouveau</Button>
            </Can>
          </div>

          {(error || message) && (
            <div className={`mx-4 mb-4 rounded px-3 py-2 text-sm font-medium border ${error ? "bg-red-100 border-red-300 text-red-700" : "bg-green-100 border-green-300 text-green-800"}`}>{error || message}</div>
          )}

          <div className="mx-4 mb-5">
            <Input
              type="search"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              spellCheck={false}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left text-sm font-semibold">Nom</TableHead>
                  <TableHead className="text-left text-sm font-semibold">Description</TableHead>
                  <TableHead className="text-center w-24 text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                      Aucun type trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell>
                        <span className="bg-indigo-100 text-indigo-800 rounded px-2 py-0.5 text-xs font-medium">
                          {lt.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lt.description || <span className="text-gray-400">–</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Modifier"
                              className="px-2"
                              onClick={() => openEditModal(lt)}
                            >
                              <Pencil size={16} />
                            </Button>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Supprimer"
                              className="px-2 text-red-700 hover:bg-red-100"
                              onClick={() => setDeleteId(lt.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* CRUD modals using Dialog */}
        <Dialog open={modalState.open} onOpenChange={(open) => { if (!open) closeModal(); }}>
          <DialogContent
            onInteractOutside={closeModal}
          >
            <DialogHeader>
              <DialogTitle>
                {modalState.mode === "create"
                  ? "Créer un type de congé"
                  : "Modifier le type"}
              </DialogTitle>
            </DialogHeader>
            <LeaveTypeForm
              mode={modalState.mode}
              initial={modalState.data || undefined}
              onCancel={closeModal}
              onSuccess={handleModalSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <DialogContent
            onInteractOutside={() => setDeleteId(null)}
          >
            <DialogHeader>
              <DialogTitle>Supprimer ce type&nbsp;?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Supprimer définitivement ce type&nbsp;?
            </DialogDescription>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteId(null)}
                disabled={deleteLoading}
                type="button"
                className="min-w-[90px]"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                type="button"
                className="min-w-[110px]"
              >
                {deleteLoading ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Can>
  );
}
