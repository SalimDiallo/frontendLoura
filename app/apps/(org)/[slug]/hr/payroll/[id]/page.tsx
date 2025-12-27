"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineUserCircle,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import { getPayroll, markPayrollAsPaid, deletePayroll, downloadPayrollPDF } from "@/lib/services/hr";
import type { Payroll, PayrollStatus } from "@/lib/types/hr";
import { formatCurrency } from "@/lib/utils";
import { Can } from "@/components/apps/common";
import { ResourceType, PermissionAction } from "@/lib/types/shared";

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayroll();
  }, [id]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayroll(id);
      setPayroll(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Êtes-vous sûr de vouloir marquer cette fiche de paie comme payée ?")) return;

    try {
      setProcessing(true);
      await markPayrollAsPaid(id);
      await loadPayroll();
    } catch (err) {
      alert("Erreur lors de la mise à jour");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette fiche de paie ? Cette action est irréversible.")) return;

    try {
      setProcessing(true);
      await deletePayroll(id);
      router.push(`/apps/${slug}/hr/payroll`);
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!payroll) return;

    try {
      setProcessing(true);
      await downloadPayrollPDF(id, payroll.employee_details?.full_name || 'Employe');
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "default" as const },
      pending: { label: "En attente", variant: "warning" as const },
      paid: { label: "Payé", variant: "success" as const },
      cancelled: { label: "Annulé", variant: "error" as const },
    };

    const config = statusConfig[status] || { label: status, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  if (error || !payroll) {
    return (
      <div className="space-y-6">
        <Alert variant="error">{error || "Fiche de paie introuvable"}</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/payroll`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/payroll`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HiOutlineBanknotes className="size-7" />
                Fiche de paie
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Détails de la fiche de paie
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={processing}
            >
              <HiOutlineArrowDownTray className="size-4 mr-2" />
              Télécharger PDF
            </Button>
            {(payroll.status === "pending" || payroll.status === "draft") && (
              <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
                <Button
                  variant="outline"
                  onClick={handleMarkAsPaid}
                  disabled={processing}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Marquer comme payé
                </Button>
              </Can>
            )}
            <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
              <Button variant="outline" asChild disabled={payroll.status === "paid"}>
                <Link href={`/apps/${slug}/hr/payroll/${id}/edit`}>
                  <HiOutlinePencil className="size-4 mr-2" />
                  Modifier
                </Link>
              </Button>
            </Can>
            <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.DELETE}`}>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={processing || payroll.status === "paid"}
              >
                <HiOutlineTrash className="size-4 mr-2" />
                Supprimer
              </Button>
            </Can>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {getStatusBadge(payroll.status)}
        </div>

        {/* Employee Info */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiOutlineUserCircle className="size-5" />
            Informations de l'employé
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nom complet</div>
              <div className="font-medium mt-1">
                {payroll.employee_details?.full_name || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Matricule</div>
              <div className="font-medium mt-1">
                {payroll.employee_details?.employee_id || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium mt-1">
                {payroll.employee_details?.email || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Département</div>
              <div className="font-medium mt-1">
                {payroll.employee_details?.department_name || 'N/A'}
              </div>
            </div>
          </div>
        </Card>

        {/* Period Info */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiOutlineCalendar className="size-5" />
            Période et paiement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Date de début</div>
              <div className="font-medium mt-1">
                {payroll.start_date ? new Date(payroll.start_date).toLocaleDateString("fr-FR") : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Date de fin</div>
              <div className="font-medium mt-1">
                {payroll.end_date ? new Date(payroll.end_date).toLocaleDateString("fr-FR") : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Méthode de paiement</div>
              <div className="font-medium mt-1 flex items-center gap-2">
                <HiOutlineCreditCard className="size-4" />
                {payroll.payment_method || 'N/A'}
              </div>
            </div>
          </div>
          {payroll.payment_date && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">Date de paiement</div>
              <div className="font-medium mt-1">
                {new Date(payroll.payment_date).toLocaleDateString("fr-FR")}
              </div>
            </div>
          )}
        </Card>

        {/* Salary Breakdown */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Détails du salaire</h2>

          <div className="space-y-4">
            {/* Base Salary */}
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-medium">Salaire de base</span>
              <span className="font-semibold">{formatCurrency(payroll.base_salary)}</span>
            </div>

            {/* Allowances */}
            {payroll.allowances && payroll.allowances.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-600">Primes et indemnités</div>
                {payroll.allowances.map((allowance, index) => (
                  <div key={index} className="flex justify-between items-center pl-4">
                    <span className="text-sm text-muted-foreground">{allowance.name}</span>
                    <span className="text-sm text-green-600">
                      +{formatCurrency(allowance.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Gross Salary */}
            <div className="flex justify-between items-center py-3 border-y bg-muted/30">
              <span className="font-semibold">Salaire brut</span>
              <span className="font-bold text-lg">{formatCurrency(payroll.gross_salary)}</span>
            </div>

            {/* Deductions */}
            {payroll.deductions && payroll.deductions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Déductions</div>
                {payroll.deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between items-center pl-4">
                    <span className="text-sm text-muted-foreground">{deduction.name}</span>
                    <span className="text-sm text-red-600">
                      -{formatCurrency(deduction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Net Salary */}
            <div className="flex justify-between items-center pt-4 border-t-2">
              <span className="text-lg font-bold">Salaire net</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(payroll.net_salary)}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {payroll.notes && (
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {payroll.notes}
            </p>
          </Card>
        )}

        {/* Metadata */}
        <Card className="p-6 border-0 shadow-sm bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Créé le : </span>
              <span className="font-medium">
                {payroll.created_at ? new Date(payroll.created_at).toLocaleString("fr-FR") : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Modifié le : </span>
              <span className="font-medium">
                {payroll.updated_at ? new Date(payroll.updated_at).toLocaleString("fr-FR") : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
    </div>
  );
}
