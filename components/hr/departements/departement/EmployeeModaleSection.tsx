'use client';

import { Card, Button, Alert, Badge, Input } from '@/components/ui';

import type { Department, EmployeeListItem } from '@/lib/types/hr';

import { ReactNode, SetStateAction, Dispatch } from 'react';


// Les sections dans la modale pour chaque liste d'employés

type EmployeeModaleSectionProps = {
  title: string;
  icon: ReactNode;
  employees: EmployeeListItem[];
  onAction: (id: string) => void | Promise<void>;
  updatingEmployee: string | null;
  actionLabel: string;
  actionColor: string;
  actionIcon: ReactNode;
  isRemove: boolean;
};

export function EmployeeModaleSection({
  title,
  icon,
  employees,
  onAction,
  updatingEmployee,
  actionLabel,
  actionColor,
  actionIcon,
  isRemove,
}: EmployeeModaleSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        {icon}
        {title} ({employees.length})
      </h4>
      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {isRemove
            ? 'Aucun employé dans ce département'
            : 'Tous les employés sont déjà dans ce département'}
        </p>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`flex items-center justify-between p-3 ${isRemove ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : 'bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors'
                } rounded-lg`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{emp.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                {(emp.employee_id || emp.department_name) && (
                  <div className="flex items-center gap-2 mt-1">
                    {emp.employee_id && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {emp.employee_id}
                      </span>
                    )}
                    {!isRemove && emp.department_name && (
                      <span className="text-xs text-muted-foreground">
                        Actuel: {emp.department_name}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`size-14 ${actionColor} ml-3`}
                onClick={() => onAction(emp.id)}
                disabled={updatingEmployee === emp.id}
                title={actionLabel}
              >
                {updatingEmployee === emp.id ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" />
                ) : (
                  actionIcon
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
