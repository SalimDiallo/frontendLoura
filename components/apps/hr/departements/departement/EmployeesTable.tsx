'use client';
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
import type { Department, EmployeeListItem } from '@/lib/types/hr';
import {
  HiOutlineUsers,
} from 'react-icons/hi2';
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/permissions';


type EmployeesTableProps = {
  employees: EmployeeListItem[];
  slug: string;
  loadingEmployees: boolean;
  openManageModal: () => void;
  canUpdate: boolean;
};

export function EmployeesTable({
  employees,
  slug,
  loadingEmployees,
  openManageModal,
  canUpdate,
}: EmployeesTableProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Employés du Département</h2>
        {canUpdate && (
          <Button size="sm" onClick={openManageModal}>
            <HiOutlineUsers className="size-4 mr-2" />
            Gérer les employés
          </Button>
        )}
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
          {canUpdate && (
            <Button variant="outline" size="sm" className="mt-4" onClick={openManageModal}>
              Ajouter des employés
            </Button>
          )}
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
  );
}
