'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Badge, Input } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDepartment, deleteDepartment, activateDepartment, deactivateDepartment } from '@/lib/services/hr/department.service';
import { getEmployees, patchEmployee } from '@/lib/services/hr/employee.service';
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
  HiOutlinePlusCircle,
  HiOutlineMinusCircle,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { MinusCircle, Plus, PlusCircle } from 'lucide-react';

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

  // État pour la modale de gestion des employés
  const [showManageModal, setShowManageModal] = useState(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([]);
  const [loadingAllEmployees, setLoadingAllEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingEmployee, setUpdatingEmployee] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

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
      console.log(data);
      
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

  const loadAllEmployees = async () => {
    try {
      setLoadingAllEmployees(true);
      // Charger tous les employés de l'organisation
      const data = await getEmployees(slug, { is_active: true });
      setAllEmployees(data.results || []);
    } catch (err: any) {
      console.error('Error loading all employees:', err);
    } finally {
      setLoadingAllEmployees(false);
    }
  };

  const openManageModal = async () => {
    setShowManageModal(true);
    setSearchQuery('');
    setModalError(null);
    await loadAllEmployees();
  };

  const closeManageModal = () => {
    setShowManageModal(false);
    setSearchQuery('');
    setModalError(null);
  };

  const handleAddEmployee = async (employeeId: string) => {
    try {
      setUpdatingEmployee(employeeId);
      setModalError(null);
      console.log('[handleAddEmployee] Ajout employé', employeeId, 'au département', departmentId);
      const result = await patchEmployee(employeeId, { department: departmentId });
      console.log('[handleAddEmployee] Résultat:', result);
      // Recharger les données
      await Promise.all([loadDepartmentEmployees(), loadAllEmployees()]);
      console.log('[handleAddEmployee] Données rechargées');
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setModalError('Erreur lors de l\'ajout de l\'employé');
    } finally {
      setUpdatingEmployee(null);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    try {
      setUpdatingEmployee(employeeId);
      setModalError(null);
      console.log('[handleRemoveEmployee] Retrait employé', employeeId, 'du département');
      const result = await patchEmployee(employeeId, { department: null });
      console.log('[handleRemoveEmployee] Résultat:', result);
      // Recharger les données
      await Promise.all([loadDepartmentEmployees(), loadAllEmployees()]);
      console.log('[handleRemoveEmployee] Données rechargées');
    } catch (err: any) {
      console.error('Error removing employee:', err);
      setModalError('Erreur lors du retrait de l\'employé');
    } finally {
      setUpdatingEmployee(null);
    }
  };

  // Filtrer les employés pour la modale
  const filteredAllEmployees = allEmployees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.full_name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(searchLower))
    );
  });

  // Séparer les employés du département et les autres
  const employeesInDepartment = filteredAllEmployees.filter(
    (emp) => emp.department === departmentId
  );
  const employeesNotInDepartment = filteredAllEmployees.filter(
    (emp) => emp.department !== departmentId
  );

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
              <HiOutlineUsers className="size-6 text-foreground dark:text-blue-400" />
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
          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
            <Button size="sm" onClick={openManageModal}>
              <HiOutlineUsers className="size-4 mr-2" />
              Gérer les employés
            </Button>
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
            <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS}>
              <Button variant="outline" size="sm" className="mt-4" onClick={openManageModal}>
                Ajouter des employés
              </Button>
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

    {/* Modale de gestion des employés */}
    {showManageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header de la modale */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-semibold">Gérer les employés</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Département: {department?.name}
              </p>
            </div>
            <button
              onClick={closeManageModal}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <HiOutlineXMark className="size-5" />
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="p-4 border-b">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {modalError && (
            <div className="px-4 pt-4">
              <Alert variant="error" onClose={() => setModalError(null)}>
                {modalError}
              </Alert>
            </div>
          )}

          {/* Contenu de la modale */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loadingAllEmployees ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                <p className="mt-2 text-sm text-muted-foreground">Chargement des employés...</p>
              </div>
            ) : (
              <>
                {/* Employés dans le département */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <HiOutlineUsers className="size-4" />
                    Dans ce département ({employeesInDepartment.length})
                  </h4>
                  {employeesInDepartment.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Aucun employé dans ce département
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {employeesInDepartment.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{emp.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                            {emp.employee_id && (
                              <p className="text-xs text-muted-foreground">
                                Matricule: {emp.employee_id}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-14 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 ml-3"
                            onClick={() => handleRemoveEmployee(emp.id)}
                            disabled={updatingEmployee === emp.id}
                          >
                            {updatingEmployee === emp.id ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            ) : (
                              <MinusCircle className='w-40 4-30' />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Employés disponibles */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <HiOutlineUserGroup className="size-4" />
                    Employés disponibles ({employeesNotInDepartment.length})
                  </h4>
                  {employeesNotInDepartment.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {searchQuery ? 'Aucun employé trouvé' : 'Tous les employés sont déjà dans ce département'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {employeesNotInDepartment.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{emp.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {emp.employee_id && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {emp.employee_id}
                                </span>
                              )}
                              {emp.department_name && (
                                <span className="text-xs text-muted-foreground">
                                  Actuel: {emp.department_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-14 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 ml-3"
                            onClick={() => handleAddEmployee(emp.id)}
                            disabled={updatingEmployee === emp.id}
                          >
                            {updatingEmployee === emp.id ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            ) : (
                              <PlusCircle className="w-40 h-40" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer de la modale */}
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={closeManageModal}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    )}
    </Can>
  );
}
