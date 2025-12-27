"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineEllipsisVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { getPayrollPeriods, createPayrollPeriod, updatePayrollPeriod, deletePayrollPeriod } from "@/lib/services/hr";
import type { PayrollPeriod, PayrollPeriodCreate } from "@/lib/types/hr";
import { Can } from "@/components/apps/common";
import { ResourceType, PermissionAction } from "@/lib/types/shared";

export default function PayrollPeriodsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PayrollPeriodCreate>({
    name: "",
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  useEffect(() => {
    loadPeriods();
  }, [slug]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayrollPeriods(slug, { page_size: 100 });
      setPeriods(data.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (period?: PayrollPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setFormData({
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        payment_date: period.payment_date || "",
      });
    } else {
      setEditingPeriod(null);
      // Générer automatiquement le nom pour le mois en cours
      const now = new Date();
      const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setFormData({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0],
        payment_date: "",
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingPeriod(null);
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      payment_date: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      if (editingPeriod) {
        await updatePayrollPeriod(editingPeriod.id, formData);
      } else {
        await createPayrollPeriod(slug, formData);
      }

      await loadPeriods();
      handleCloseDialog();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(errorMessage);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette période de paie ? Cette action est irréversible.")) {
      return;
    }

    try {
      setProcessingId(id);
      await deletePayrollPeriod(id);
      await loadPeriods();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "default" as const },
      processing: { label: "En cours", variant: "warning" as const },
      approved: { label: "Approuvé", variant: "info" as const },
      paid: { label: "Payé", variant: "success" as const },
      closed: { label: "Clôturé", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const generateQuickPeriod = (type: 'current' | 'next' | 'previous') => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (type === 'next') {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    } else if (type === 'previous') {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }

    const date = new Date(year, month, 1);
    const monthName = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    setFormData({
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      payment_date: "",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/payroll`}>
              <HiOutlineArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineCalendar className="size-7" />
              Périodes de paie
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les périodes de paie mensuelles
            </p>
          </div>
        </div>
        <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.CREATE}`}>
          <Button onClick={() => handleOpenDialog()}>
            <HiOutlinePlusCircle className="size-4 mr-2" />
            Nouvelle période
          </Button>
        </Can>
      </div>

      {/* Periods Table */}
      <Card className="border-0 shadow-sm">
        <div className="border-b px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold">Toutes les périodes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {periods.length} période{periods.length > 1 ? 's' : ''} créée{periods.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6">
          {periods.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineCalendar className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucune période de paie</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre première période de paie pour commencer
                  </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Créer une période
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Date de paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fiches de paie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {new Date(period.start_date).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-muted-foreground">
                          → {new Date(period.end_date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {period.payment_date
                        ? new Date(period.payment_date).toLocaleDateString("fr-FR")
                        : <span className="text-muted-foreground">Non définie</span>
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {period.payslip_count || 0} fiche{(period.payslip_count || 0) > 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={processingId === period.id}
                          >
                            <HiOutlineEllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
                            <DropdownMenuItem onClick={() => handleOpenDialog(period)}>
                              <HiOutlinePencil className="size-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.DELETE}`}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(period.id)}
                              disabled={period.status === 'paid' || period.status === 'closed'}
                            >
                              <HiOutlineTrash className="size-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </Can>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? "Modifier la période" : "Nouvelle période de paie"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Period Buttons */}
            {!editingPeriod && (
              <div className="space-y-2">
                <Label>Raccourcis</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickPeriod('previous')}
                  >
                    Mois précédent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickPeriod('current')}
                  >
                    Mois en cours
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickPeriod('next')}
                  >
                    Mois prochain
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de la période <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Janvier 2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Date de début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">
                  Date de fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Date de paiement prévue (optionnel)</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                La date à laquelle les salaires seront versés
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingPeriod ? "Modification..." : "Création..."
                  : editingPeriod ? "Modifier" : "Créer"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
