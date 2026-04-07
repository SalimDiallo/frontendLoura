'use client';

import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Alert, Badge } from '@/components/ui';

import type { Department } from '@/lib/types/hr';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCog,
} from 'react-icons/hi2';
import { SetStateAction, Dispatch, useState } from 'react';
import { DeleteConfirmation, ActionConfirmation } from '@/components/common/confirmation-dialog';


type DepartmentHeaderProps = {
  department: Department;
  employeesCount: number;
  isActive: boolean;
  toggling: boolean;
  handleToggleStatus: () => Promise<void> | void;
  handleDelete: () => Promise<void> | void;
  deleting: boolean;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  router: ReturnType<typeof useRouter>;
  slug: string;
  departmentId: string;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function DepartmentHeader({
  department,
  employeesCount,
  isActive,
  toggling,
  handleToggleStatus,
  handleDelete,
  deleting,
  onEdit,
  canEdit,
  canDelete,
  canUpdate,
  router,
  slug,
  departmentId,
  error,
  setError,
}: DepartmentHeaderProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  return (
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
        <Badge variant={isActive ? 'success' : 'outline'}>
          {isActive ? (
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

        {canUpdate && (
          <>
            <Button
              onClick={() => setToggleDialogOpen(true)}
              variant="outline"
              size="sm"
              disabled={toggling}
            >
              <HiOutlineCog className="size-4 mr-2" />
              {toggling ? 'Chargement...' : isActive ? 'Désactiver' : 'Activer'}
            </Button>
            <ActionConfirmation
              open={toggleDialogOpen}
              onOpenChange={setToggleDialogOpen}
              action={{
                label: isActive ? 'Désactiver' : 'Activer',
                variant: isActive ? 'destructive' : 'default',
                icon: isActive ? 'warning' : 'success'
              }}
              target={department.name}
              description={
                isActive
                  ? `Êtes-vous sûr de vouloir désactiver le département "${department.name}" ?`
                  : `Êtes-vous sûr de vouloir activer le département "${department.name}" ?`
              }
              onConfirm={handleToggleStatus}
              loading={toggling}
            />
          </>
        )}

        {canUpdate && (
          <Link href={`/apps/${slug}/hr/departments/${departmentId}/edit`}>
            <Button variant="outline" size="sm">
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Button>
          </Link>
        )}

        {canDelete && (
          <>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
              size="sm"
              disabled={deleting || employeesCount > 0}
              title={employeesCount > 0 ? 'Impossible de supprimer un département avec des employés' : ''}
            >
              <HiOutlineTrash className="size-4 mr-2" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
            <DeleteConfirmation
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              itemName={department.name}
              onConfirm={handleDelete}
              loading={deleting}
              description={
                employeesCount > 0
                  ? `Impossible de supprimer le département "${department.name}" car il contient des employés.`
                  : undefined
              }
              // Optionally disable confirm if not possible
              // Would require adjusting DeleteConfirmation; for now, just disables button above.
            />
          </>
        )}
      </div>
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </div>
  );
}
