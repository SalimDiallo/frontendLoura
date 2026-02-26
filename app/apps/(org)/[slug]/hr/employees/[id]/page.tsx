"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Alert,
  Badge
} from "@/components/ui";
import { getEmployee, deleteEmployee, activateEmployee, deactivateEmployee } from "@/lib/services/hr/employee.service";
import { contractService, getPayrolls } from "@/lib/services/hr";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { EmployeeHeader } from "@/components/hr/employees/employee/EmployeeHeader";
import { EmployeeAvatarAndIdentity } from "@/components/hr/employees/employee/EmployeeAvatarAndIdentity";
import { EmployeeOverviewTab } from "@/components/hr/employees/employee/EmployeeOverviewTab";
import { EmployeeEmploymentTab } from "@/components/hr/employees/employee/EmployeeEmploymentTab";
import { EmployeePermissionsTab } from "@/components/hr/employees/employee/EmployeePermissionsTab";
import { EmployeeContractsTab } from "@/components/hr/employees/employee/EmployeeContractsTab";
import { EmployeeDocumentsTab } from "@/components/hr/employees/employee/EmployeeDocumentsTab";
import { EmployeePayrollTab } from "@/components/hr/employees/employee/EmployeePayrollTab";



// === PAGE PRINCIPALE ===
export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);

  useEffect(() => {
    loadEmployee();
    loadContracts();
    loadPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de l'employé");
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const data = await contractService.getEmployeeContracts(slug, id);
      setContracts(data);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const loadPayslips = async () => {
    try {
      setLoadingPayslips(true);
      const data = await getPayrolls(slug, { employee: id, page_size: 50 });
      setPayslips(data.results);
    } catch (err) {
      console.error('Error loading payslips:', err);
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;
    try {
      setDeleting(true);
      await deleteEmployee(id);
      router.push(`/apps/${slug}/hr/employees`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!employee) return;

    try {
      setToggling(true);
      if (employee.is_active) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
      await loadEmployee();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setToggling(false);
    }
  };

  const getGenderLabel = (gender?: string) => {
    const labels: Record<string, string> = {
      male: "Homme",
      female: "Femme",
      other: "Autre",
    };
    return gender ? labels[gender] || gender : "-";
  };

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  if (error || !employee) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-6">
          <Alert variant="error">{error || "Employé non trouvé"}</Alert>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/employees`}>
              <HiOutlineArrowLeft className="size-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <div className="space-y-6">
        <EmployeeHeader
          employee={employee}
          slug={slug}
          id={id}
          handleToggleStatus={handleToggleStatus}
          toggling={toggling}
          handleDelete={handleDelete}
          deleting={deleting}
        />
        <EmployeeAvatarAndIdentity employee={employee} />
        {/* Tabs with Details */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="employment">Emploi</TabsTrigger>
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
              <TabsTrigger value="contracts">
                Contrats
                {contracts.length > 0 && (
                  <Badge className="ml-2 bg-primary/10 text-primary">{contracts.length}</Badge>
                )}
              </TabsTrigger>
            </Can>
            <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
              <TabsTrigger value="permissions">Rôles & Permissions</TabsTrigger>
            </Can>
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
              <TabsTrigger value="payroll">
                Paie
                {payslips.length > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-700">{payslips.length}</Badge>
                )}
              </TabsTrigger>
            </Can>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <EmployeeOverviewTab employee={employee} getGenderLabel={getGenderLabel} />

          {/* Employment Tab */}
          <EmployeeEmploymentTab employee={employee} />

          {/* Permissions Tab */}
          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
            <EmployeePermissionsTab employee={employee} slug={slug} id={id} />
          </Can>

          {/* Contracts Tab */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
            <EmployeeContractsTab
              contracts={contracts}
              slug={slug}
              id={id}
              loadingContracts={loadingContracts}
              loadContracts={loadContracts}
            />
          </Can>

          {/* Documents Tab */}
          <EmployeeDocumentsTab />

          {/* Payroll Tab */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
            <EmployeePayrollTab
              payslips={payslips}
              loadingPayslips={loadingPayslips}
              slug={slug}
              id={id}
            />
          </Can>
        </Tabs>
      </div>
    </Can>
  );
}