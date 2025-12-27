"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineCalendar,
} from "react-icons/hi2";
import { getEmployeePayrolls, getEmployee, downloadPayrollPDF } from "@/lib/services/hr";
import type { Payroll, Employee, PayrollStatus } from "@/lib/types/hr";
import { formatCurrency } from "@/lib/utils";

export default function EmployeePayrollHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [employeeId, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeeData, payrollsData] = await Promise.all([
        getEmployee(employeeId),
        getEmployeePayrolls(slug, employeeId, { year: selectedYear }),
      ]);

      setEmployee(employeeData);
      setPayrolls(payrollsData.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (payrollId: string) => {
    try {
      setDownloading(payrollId);
      await downloadPayrollPDF(payrollId, employee?.full_name || 'Employe');
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
      console.error(err);
    } finally {
      setDownloading(null);
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

  // Calculer les statistiques
  const totalGross = payrolls.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalNet = payrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;

  // Générer la liste des années disponibles
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/hr/employees/${employeeId}`}>
            <HiOutlineArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineBanknotes className="size-7" />
            Historique des paies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {employee?.full_name || 'N/A'} ({employee?.employee_id || 'N/A'})
          </p>
        </div>
      </div>

      {/* Year Filter */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center gap-4">
          <HiOutlineCalendar className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">Année :</span>
          <div className="flex gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Total brut ({selectedYear})</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totalGross)}</div>
        </Card>
        <Card className="p-6 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Total net ({selectedYear})</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalNet)}</div>
        </Card>
        <Card className="p-6 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Fiches payées</div>
          <div className="text-2xl font-bold mt-1">{paidCount} / {payrolls.length}</div>
        </Card>
      </div>

      {/* Payrolls Table */}
      <Card className="border-0 shadow-sm">
        <div className="border-b px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold">Fiches de paie</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les fiches de paie pour {selectedYear}
          </p>
        </div>

        <div className="p-6">
          {payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineBanknotes className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucune fiche de paie</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aucune fiche de paie trouvée pour {selectedYear}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Salaire de base</TableHead>
                  <TableHead>Salaire brut</TableHead>
                  <TableHead>Salaire net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(payroll.period_start).toLocaleDateString("fr-FR", {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(payroll.period_start).toLocaleDateString("fr-FR")} → {new Date(payroll.period_end).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatCurrency(payroll.base_salary)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatCurrency(payroll.gross_salary)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(payroll.net_salary)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/hr/payroll/${payroll.id}`}>
                            <HiOutlineEye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(payroll.id)}
                          disabled={downloading === payroll.id}
                        >
                          <HiOutlineArrowDownTray className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
