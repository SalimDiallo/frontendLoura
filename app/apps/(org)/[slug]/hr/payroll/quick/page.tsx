"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
} from "react-icons/hi2";
import {
  getEmployees,
  getPayrollPeriods,
  getPayrollAdvances,
  generateBulkPayslips,
} from "@/lib/services/hr";
import type { EmployeeListItem, PayrollPeriod, PayrollAdvance } from "@/lib/types/hr";

export default function QuickPayrollPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [pendingAdvances, setPendingAdvances] = useState<PayrollAdvance[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    employeesWithPayslip: 0,
    pendingAdvancesCount: 0,
    pendingAdvancesAmount: 0,
  });

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données en parallèle
      const [employeesData, periodsData, advancesData] = await Promise.all([
        getEmployees(slug, { employment_status: 'active', page_size: 1000 }),
        getPayrollPeriods(slug, { status: 'draft', page_size: 1 }),
        getPayrollAdvances({ organization_subdomain: slug, status: 'pending' }),
      ]);

      setEmployees(employeesData.results);
      setCurrentPeriod(periodsData.results[0] || null);
      setPendingAdvances(advancesData);

      // Calculer les stats
      setStats({
        totalEmployees: employeesData.results.length,
        employeesWithPayslip: 0, // TODO: récupérer du backend
        pendingAdvancesCount: advancesData.length,
        pendingAdvancesAmount: advancesData.reduce((sum, adv) => sum + adv.amount, 0),
      });

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllPayslips = async () => {
    if (!currentPeriod) {
      setError("Aucune période de paie active. Veuillez d'abord créer une période.");
      return;
    }

    const confirmMessage = `Générer les fiches de paie pour ${employees.length} employés pour la période "${currentPeriod.name}" ?\n\n✨ Le système va automatiquement :\n• Récupérer les salaires depuis les contrats\n• Déduire les avances payées\n• Appliquer les déductions standards (CNPS, impôts)\n• Calculer les salaires nets`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const result = await generateBulkPayslips(currentPeriod.id, {
        auto_deduct_advances: true,
      });

      console.log('Bulk generation result:', result);

      let successMessage = `✅ ${result.created} fiche(s) de paie créée(s) avec succès !`;

      if (result.advances_deducted > 0) {
        successMessage += `\n✨ ${result.advances_deducted} avance(s) déduite(s) automatiquement`;
      }

      if (result.skipped > 0) {
        successMessage += `\nℹ️ ${result.skipped} fiche(s) déjà existante(s)`;
      }

      if (result.errors.length > 0) {
        successMessage += `\n⚠️ ${result.errors.length} erreur(s) : ${result.errors.slice(0, 3).join(', ')}`;
      }

      setSuccess(successMessage);
      loadData();
    } catch (err: any) {
      console.error('Error generating payslips:', err);
      setError(err?.data?.error || err?.message || "Erreur lors de la génération des fiches de paie");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HiOutlineSparkles className="size-8 text-primary" />
          Gestion Rapide des Paies
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos paies et avances en quelques clics
        </p>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="flex items-center justify-between bg-green-50 border-green-200">
          <span className="text-green-800">{success}</span>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Employés Actifs</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <HiOutlineUsers className="size-6 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Fiches Générées</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {stats.employeesWithPayslip}/{stats.totalEmployees}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <HiOutlineCheckCircle className="size-6 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Avances en Attente</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pendingAdvancesCount}</p>
            </div>
            <div className="bg-amber-200 p-3 rounded-full">
              <HiOutlineClock className="size-6 text-amber-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Montant Avances</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {(stats.pendingAdvancesAmount / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-full">
              <HiOutlineCurrencyDollar className="size-6 text-purple-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Période Actuelle */}
      {currentPeriod ? (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HiOutlineBolt className="size-5 text-primary" />
                Période Actuelle
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-bold">{currentPeriod.name}</p>
                <p className="text-sm text-muted-foreground">
                  Du {new Date(currentPeriod.start_date).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(currentPeriod.end_date).toLocaleDateString('fr-FR')}
                </p>
                {currentPeriod.payment_date && (
                  <p className="text-sm text-muted-foreground">
                    Paiement prévu le {new Date(currentPeriod.payment_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="default" className="px-4 py-2">
              {currentPeriod.status === 'draft' ? 'Brouillon' : currentPeriod.status}
            </Badge>
          </div>
        </Card>
      ) : (
        <Alert variant="warning">
          <HiOutlineExclamationTriangle className="size-5" />
          <div className="ml-3">
            <p className="font-semibold">Aucune période de paie active</p>
            <p className="text-sm mt-1">
              Veuillez créer une période de paie avant de générer les fiches de paie.
            </p>
            <Button variant="default" size="sm" className="mt-3">
              Créer une Période
            </Button>
          </div>
        </Alert>
      )}

      {/* Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Génération Automatique */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl">
              <HiOutlineSparkles className="size-8 text-green-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Génération Automatique</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Générez toutes les fiches de paie en un clic. Le système :
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="size-4 text-green-600" />
                  Récupère les salaires depuis les contrats
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="size-4 text-green-600" />
                  Déduit automatiquement les avances payées
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="size-4 text-green-600" />
                  Applique les déductions standards (CNPS, impôts)
                </li>
                <li className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="size-4 text-green-600" />
                  Calcule les salaires nets
                </li>
              </ul>
              <Button
                size="lg"
                className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                onClick={handleGenerateAllPayslips}
                disabled={!currentPeriod || processing}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="size-5 mr-2" />
                    Générer Toutes les Paies ({stats.totalEmployees})
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Avances en Attente */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-xl">
              <HiOutlineCurrencyDollar className="size-8 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Avances en Attente</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.pendingAdvancesCount} demande(s) d'avance à traiter
              </p>

              {pendingAdvances.length === 0 ? (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <HiOutlineCheckCircle className="size-4" />
                    Aucune avance en attente !
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {pendingAdvances.slice(0, 5).map((advance) => (
                    <div
                      key={advance.id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <div>
                        <p className="font-medium text-sm">{advance.employee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {advance.amount.toLocaleString()} GNF
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Approuver
                      </Button>
                    </div>
                  ))}
                  {pendingAdvances.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{pendingAdvances.length - 5} autre(s)...
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="lg"
                className="mt-4 w-full"
                onClick={() => window.location.href = `/apps/${slug}/hr/payroll/advances`}
              >
                Gérer les Avances
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Guide Rapide */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-bold mb-4">🚀 Guide Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="bg-blue-100 text-blue-900 rounded-full size-8 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-semibold">Gérer les Avances</h4>
            <p className="text-sm text-muted-foreground">
              Approuvez les demandes d'avances en attente (bouton "Approuver & Payer")
            </p>
          </div>
          <div className="space-y-2">
            <div className="bg-blue-100 text-blue-900 rounded-full size-8 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-semibold">Générer les Paies</h4>
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Générer Toutes les Paies" pour créer automatiquement toutes les fiches
            </p>
          </div>
          <div className="space-y-2">
            <div className="bg-blue-100 text-blue-900 rounded-full size-8 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-semibold">Valider & Payer</h4>
            <p className="text-sm text-muted-foreground">
              Vérifiez les fiches générées et marquez-les comme payées
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
