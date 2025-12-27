'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Badge } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDepartment, deleteDepartment, activateDepartment, deactivateDepartment } from '@/lib/services/hr/department.service';
import { getEmployees } from '@/lib/services/hr/employee.service';
import type { Department, EmployeeListItem } from '@/lib/types/hr';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCog,
} from 'react-icons/hi2';
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadDepartmentDetails();
    loadDepartmentEmployees();
  }, [departmentId]);

  const loadDepartmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartment(departmentId);
      setDepartment(data);
    } catch (err: any) {
      console.error('Error loading department:', err);
      setError(err.message || 'Erreur lors du chargement du département');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentEmployees = async () => {
    try {
      setLoadingEmployees(true);
      // Charger les employés du département
      const data = await getEmployees(slug, { department: departmentId });
      setEmployees(data.results || []);
    } catch (err: any) {
      console.error('Error loading employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleDelete = async () => {
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
      console.error('Error deleting department:', err);
      setError(err.message || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
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
      console.error('Error toggling status:', err);
      setError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setToggling(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <HiOutlineArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <HiOutlineBriefcase className="size-8 text-primary" />
              {department.name}
            </h1>
            <p className="text-muted-foreground mt-1">Code: {department.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={department.is_active ? 'success' : 'outline'}>
            {department.is_active ? (
              <>
                <HiOutlineCheckCircle className="size-4 mr-1" />
                Actif
              </>
            ) : (
              <>
                <HiOutlineXCircle className="size-4 mr-1" />
                Inactif
              </>
            )}
          </Badge>

          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
            <Button
              onClick={handleToggleStatus}
              variant="outline"
              size="sm"
              disabled={toggling}
            >
              <HiOutlineCog className="size-4 mr-2" />
              {toggling ? 'Chargement...' : department.is_active ? 'Désactiver' : 'Activer'}
            </Button>
          </Can>

          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
            <Link href={`/apps/${slug}/hr/departments/${departmentId}/edit`}>
              <Button variant="outline" size="sm">
                <HiOutlinePencil className="size-4 mr-2" />
                Modifier
              </Button>
            </Link>
          </Can>

          <Can permission={COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS}>
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
              disabled={deleting || employees.length > 0}
              title={employees.length > 0 ? 'Impossible de supprimer un département avec des employés' : ''}
            >
              <HiOutlineTrash className="size-4 mr-2" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </Can>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <HiOutlineUsers className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employés Actifs</p>
              <p className="text-2xl font-bold">{activeEmployees.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
              <HiOutlineUserGroup className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employés</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
              <HiOutlineXCircle className="size-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactifs</p>
              <p className="text-2xl font-bold">{inactiveEmployees.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Détails */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Informations du Département</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nom</label>
            <p className="text-lg mt-1">{department.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Code</label>
            <p className="text-lg mt-1">{department.code}</p>
          </div>

          {department.description && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-lg mt-1">{department.description}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Statut</label>
            <div className="mt-1">
              <Badge variant={department.is_active ? 'success' : 'outline'}>
                {department.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Date de création</label>
            <p className="text-lg mt-1">
              {new Date(department.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Liste des employés */}
     <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
       <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Employés du Département</h2>
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
            <Link href={`/apps/${slug}/hr/employees/create?department=${departmentId}`}>
              <Button size="sm">
                <HiOutlineUsers className="size-4 mr-2" />
                Ajouter un employé
              </Button>
            </Link>
          </Can>
        </div>

        {loadingEmployees ? (
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Chargement des employés...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineUsers className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun employé dans ce département</p>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
              <Link href={`/apps/${slug}/hr/employees/create?department=${departmentId}`}>
                <Button variant="outline" size="sm" className="mt-4">
                  Ajouter le premier employé
                </Button>
              </Link>
            </Can>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Statut Emploi</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.full_name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position_title || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.employment_status === 'active'
                            ? 'success'
                            : employee.employment_status === 'on_leave'
                            ? 'warning'
                            : 'outline'
                        }
                      >
                        {employee.employment_status === 'active' && 'Actif'}
                        {employee.employment_status === 'on_leave' && 'En congé'}
                        {employee.employment_status === 'suspended' && 'Suspendu'}
                        {employee.employment_status === 'terminated' && 'Terminé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? 'success' : 'outline'}>
                        {employee.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
                        <Link href={`/apps/${slug}/hr/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            Voir
                          </Button>
                        </Link>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
     </Can>
    </div>
    </Can>
  );
}
