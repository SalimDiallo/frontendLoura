"use client";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  generateBulkPayslips,
  getEmployees,
  getPayrollAdvances,
  getPayrollPeriods,
} from "@/lib/services/hr";
import type { EmployeeListItem, PayrollAdvance, PayrollPeriod } from "@/lib/types/hr";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function QuickPayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [pendingAdvances, setPendingAdvances] = useState<PayrollAdvance[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesData, periodsData, advancesData] = await Promise.all([
        getEmployees(slug, { employment_status: "active", page_size: 1000 }),
        getPayrollPeriods(slug, { status: "draft", page_size: 1 }),
        getPayrollAdvances({ organization_subdomain: slug, status: "pending" }).catch(() => []),
      ]);

      setEmployees(employeesData.results);
      setCurrentPeriod(periodsData.results[0] || null);
      setPendingAdvances(advancesData || []);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const totalAdvancesAmount = pendingAdvances.reduce((sum, adv) => sum + adv.amount, 0);

  const handleGenerate = async () => {
    if (!currentPeriod) {
      setError("Aucune période de paie active. Créez-en une d'abord.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const result = await generateBulkPayslips(currentPeriod.id, { auto_deduct_advances: true });

      let message = `${result.created} fiche(s) créée(s)`;
      if (result.advances_deducted > 0) message += ` • ${result.advances_deducted} avance(s) déduite(s)`;
      if (result.skipped > 0) message += ` • ${result.skipped} ignorée(s)`;
      if (result.errors.length > 0) message += ` • ${result.errors.length} erreur(s)`;

      setSuccess(message);
      await loadData();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Erreur lors de la génération");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <HiOutlineArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Génération Rapide</h1>
          <p className="text-sm text-muted-foreground">
            Générez les fiches de paie en un clic
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="error" className="flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          <span>{success}</span>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HiOutlineUsers className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Employés</p>
              <p className="text-xl font-bold">{employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HiOutlineBanknotes className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Avances</p>
              <p className="text-xl font-bold">{pendingAdvances.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 col-span-2">
          <div className="flex items-center gap-3">
            <HiOutlineCurrencyDollar className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Montant avances</p>
              <p className="text-xl font-bold">{formatCurrency(totalAdvancesAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Période actuelle */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineCalendar className="size-5 text-muted-foreground" />
              <h3 className="font-semibold">Période de paie</h3>
            </div>
            {currentPeriod ? (
              <div>
                <p className="text-lg font-bold">{currentPeriod.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentPeriod.start_date).toLocaleDateString("fr-FR")} → {new Date(currentPeriod.end_date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Aucune période active</p>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href={`/apps/${slug}/hr/payroll/periods`}>Créer une période →</Link>
                </Button>
              </div>
            )}
          </div>
          {currentPeriod && (
            <Badge variant="default">{currentPeriod.status === "draft" ? "Brouillon" : currentPeriod.status}</Badge>
          )}
        </div>
      </Card>

      {/* Action principale */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Génération automatique</h3>
        <div className="space-y-3 text-sm text-muted-foreground mb-6">
          <p className="flex items-center gap-2">
            <HiOutlineCheckCircle className="size-4" />
            Récupère les salaires depuis les contrats
          </p>
          <p className="flex items-center gap-2">
            <HiOutlineCheckCircle className="size-4" />
            Déduit automatiquement les avances payées
          </p>
          <p className="flex items-center gap-2">
            <HiOutlineCheckCircle className="size-4" />
            Applique les déductions (CNPS, impôts)
          </p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={handleGenerate}
          disabled={!currentPeriod || processing}
        >
          {processing ? (
            <>
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Génération...
            </>
          ) : (
            <>Générer {employees.length} fiche(s) de paie</>
          )}
        </Button>
      </Card>

      {/* Avances en attente */}
      {pendingAdvances.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Avances en attente ({pendingAdvances.length})</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/payroll/advances`}>Gérer</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {pendingAdvances.slice(0, 5).map((advance) => (
              <div key={advance.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{advance.employee_name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(advance.amount)}</p>
                </div>
                <Badge variant="default">En attente</Badge>
              </div>
            ))}
            {pendingAdvances.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                +{pendingAdvances.length - 5} autre(s)
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Liens rapides */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link href={`/apps/${slug}/hr/payroll`}>← Retour aux fiches</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/apps/${slug}/hr/payroll/periods`}>Périodes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/apps/${slug}/hr/payroll/advances`}>Avances</Link>
        </Button>
      </div>
    </div>
  );
}
