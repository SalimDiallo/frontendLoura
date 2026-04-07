'use client';
import { Card, Badge } from '@/components/ui';
import type { Department } from '@/lib/types/hr';
import { formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';

type DepartmentDetailsSectionProps = {
  department: Department;
  orgSlug:string
};

// Affiche le manager avec le lien pour voir sa fiche quand c'est un employé

export function DepartmentDetailsSection({ department,orgSlug }: DepartmentDetailsSectionProps) {
  // On suppose que l'ID du manager employé se trouve dans department.head_id
  // et que le slug de l'organisation est dans department.organization_subdomain
  const managerIsEmployee =
    department.head_type === 'employee'

  return (
    <Card className="p-0 overflow-hidden shadow-md border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 px-6 py-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground mb-0.5">Manager</label>
          {department.head_name ? (
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-full w-9 h-9 flex items-center justify-center shrink-0 font-bold text-primary text-base">
                {getInitials(department.head_name)}
              </div>
              <div>
                {managerIsEmployee ? (
                  <Link
                    href={`/apps/${orgSlug}/hr/employees/${department.manager}`}
                    className="text-base font-medium underline hover:text-primary transition-colors"
                    title="Voir la fiche du manager"
                  >
                    {department.head_name}
                  </Link>
                ) : (
                  <span className="text-base font-medium">{department.head_name}</span>
                )}
                {department.head_type && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground capitalize">
                    {department.head_type === "employee" ? "Employé" : "Admin"}
                  </span>
                )}
              </div>
            </div>
          ) : department.manager ? (
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-full w-9 h-9 flex items-center justify-center shrink-0 font-semibold text-primary text-base">
                {getInitials(department.manager)}
              </div>
              <span className="text-base">{department.manager}</span>
            </div>
          ) : (
            <span className="italic text-muted-foreground">Aucun manager assigné</span>
          )}
        </div>

        {/* Parent département styled */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground mb-0.5">Département parent</label>
          {department.parent_department ? (
            <Link href={`/apps/${orgSlug}/hr/departments/${department.parent_department}`}>
             <span className="text-base font-mono underline hover:text-primary">{department.parent_department_name}</span>
            </Link>
           
          ) : (
            <span className="italic text-muted-foreground">Aucun</span>
          )}
        </div>

        {/* Nb. employés UX */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground mb-0.5">Nombre d'employés</label>
          {'employee_count' in department && department.employee_count !== undefined ? (
            <span className="text-base">{department.employee_count}</span>
          ) : (
            <span className="italic text-muted-foreground">Non renseigné</span>
          )}
        </div>

        {/* Dates avec icones */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground mb-0.5">Créé le</label>
          <span className="text-base">
            {formatDate(department.created_at)}
          </span>

          <label className="text-xs font-medium text-muted-foreground mt-2 mb-0.5">Dernière modification</label>
          <span className="text-base">
            {formatDate(department.updated_at)}
          </span>
        </div>

        {/* Description en grand, col-span si présente */}
        {department.description && (
          <div className="md:col-span-2 mt-2">
            <label className="text-xs font-medium text-muted-foreground mb-0.5">Description</label>
            <p className="rounded bg-muted/75 p-3 my-1 text-base leading-relaxed">{department.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
