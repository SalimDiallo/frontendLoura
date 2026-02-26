'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, Button, Alert, Badge, Input } from '@/components/ui';
import { getDepartment, deleteDepartment, activateDepartment, deactivateDepartment } from '@/lib/services/hr/department.service';
import { getEmployees, patchEmployee } from '@/lib/services/hr/employee.service';
import type { Department, EmployeeListItem } from '@/lib/types/hr';
import {
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/permissions';
import { DepartmentStats } from '@/components/hr/departements/departement/DepartmentStats';
import { DepartmentDetailsSection } from '@/components/hr/departements/departement/DepartmentDetailsSection';
import { EmployeesTable } from '@/components/hr/departements/departement/EmployeesTable';
import { ManageEmployeeModal } from '@/components/hr/departements/departement/ManageEmployeeModal';
import { DepartmentHeader } from '@/components/hr/departements/departement/DepartmentHeader';
import { usePermissions } from '@/lib/hooks';



export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);
  const {hasPermission} = usePermissions()

  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([]);
  const [loadingAllEmployees, setLoadingAllEmployees] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingEmployee, setUpdatingEmployee] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartmentDetails();
    loadDepartmentEmployees();
    // eslint-disable-next-line
  }, [departmentId]);

  const loadDepartmentDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartment(departmentId);
      setDepartment(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du département');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentEmployees = async (): Promise<void> => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees(slug, { department: departmentId });
      setEmployees(data.results || []);
    } catch (err: any) {
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadAllEmployees = async (): Promise<void> => {
    try {
      setLoadingAllEmployees(true);
      const data = await getEmployees(slug, { is_active: true });
      setAllEmployees(data.results || []);
    } catch (err: any) {
    } finally {
      setLoadingAllEmployees(false);
    }
  };

  const openManageModal = async (): Promise<void> => {
    setShowManageModal(true);
    setSearchQuery('');
    setModalError(null);
    await loadAllEmployees();
  };

  const closeManageModal = (): void => {
    setShowManageModal(false);
    setSearchQuery('');
    setModalError(null);
  };

  const handleAddEmployee = async (employeeId: string): Promise<void> => {
    try {
      setUpdatingEmployee(employeeId);
      setModalError(null);
      await patchEmployee(employeeId, { department: departmentId });
      await Promise.all([loadDepartmentEmployees(), loadAllEmployees()]);
    } catch (err: any) {
      setModalError('Erreur lors de l\'ajout de l\'employé');
    } finally {
      setUpdatingEmployee(null);
    }
  };

  const handleRemoveEmployee = async (employeeId: string): Promise<void> => {
    try {
      setUpdatingEmployee(employeeId);
      setModalError(null);
      await patchEmployee(employeeId, { department: null });
      await Promise.all([loadDepartmentEmployees(), loadAllEmployees()]);
    } catch (err: any) {
      setModalError('Erreur lors du retrait de l\'employé');
    } finally {
      setUpdatingEmployee(null);
    }
  };

  // Recherche et séparations pour modale
  const filteredAllEmployees = allEmployees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.full_name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(searchLower))
    );
  });
  const employeesInDepartment = filteredAllEmployees.filter(
    (emp) => emp.department === departmentId
  );
  const employeesNotInDepartment = filteredAllEmployees.filter(
    (emp) => emp.department !== departmentId
  );

  const handleDelete = async (): Promise<void> => {
    if (!department) return;
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le département "${department.name}" ?\n\nCette action est irréversible.`
    );
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteDepartment(departmentId);
      router.push(`/apps/${slug}/hr/departments`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (): Promise<void> => {
    if (!department) return;
    try {
      setToggling(true);
      if (department.is_active) {
        await deactivateDepartment(departmentId);
      } else {
        await activateDepartment(departmentId);
      }
      await loadDepartmentDetails();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setToggling(false);
    }
  };

  // Handle Permission
  const canEdit: boolean = hasPermission(COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS); // delegue à votre gestion de permissions
  const canDelete: boolean = hasPermission(COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS);;
  const canUpdate: boolean = hasPermission(COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS);;

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Can>
    );
  }

  if (error && !department) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
          <Button onClick={() => router.back()} variant="outline">
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour
          </Button>
        </div>
      </Can>
    );
  }

  if (!department) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
        <div className="max-w-4xl mx-auto">
          <Alert variant="error">
            Département introuvable
          </Alert>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour
          </Button>
        </div>
      </Can>
    );
  }

  const activeEmployees = employees.filter(e => e.is_active && e.employment_status === 'active');
  const inactiveEmployees = employees.filter(e => !e.is_active || e.employment_status !== 'active');

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS} showMessage={true}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <DepartmentHeader
          department={department}
          employeesCount={employees.length}
          isActive={department.is_active}
          toggling={toggling}
          handleToggleStatus={handleToggleStatus}
          handleDelete={handleDelete}
          deleting={deleting}
          onEdit={() => router.push(`/apps/${slug}/hr/departments/${departmentId}/edit`)}
          canEdit={canEdit}
          canDelete={canDelete}
          canUpdate={canUpdate}
          router={router}
          slug={slug}
          departmentId={departmentId}
          error={error}
          setError={setError}
        />

        {/* Stats */}
        <DepartmentStats
          activeCount={activeEmployees.length}
          inactiveCount={inactiveEmployees.length}
          totalCount={employees.length}
        />

        {/* Détails */}
        <DepartmentDetailsSection department={department}  orgSlug={slug}/>

        {/* Liste des employés */}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <EmployeesTable
            employees={employees}
            slug={slug}
            loadingEmployees={loadingEmployees}
            openManageModal={openManageModal}
            canUpdate={canUpdate}
          />
        </Can>
      </div>

      {/* Modale de gestion des employés */}
      <ManageEmployeeModal
        show={showManageModal}
        onClose={closeManageModal}
        employeesInDepartment={employeesInDepartment}
        employeesNotInDepartment={employeesNotInDepartment}
        loadingAllEmployees={loadingAllEmployees}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleAddEmployee={handleAddEmployee}
        handleRemoveEmployee={handleRemoveEmployee}
        updatingEmployee={updatingEmployee}
        modalError={modalError}
        setModalError={setModalError}
        departmentName={department?.name}
      />
    </Can>
  );
}
