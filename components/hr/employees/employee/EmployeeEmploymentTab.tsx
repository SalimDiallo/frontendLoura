"use client";


import {
  Card,

  Badge
} from "@/components/ui";
import { EmploymentStatusBadge } from "@/components/hr";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeEmploymentTab({ employee }: { employee: Employee }) {
  return (
    <TabsContent value="employment" className="space-y-4">
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Détails d'emploi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Matricule</div>
            <div className="text-base font-medium">
              {employee.employee_id || "Non renseigné"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Département</div>
            <div className="text-base font-medium">
              {employee.department_name || "Non renseigné"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Position</div>
            <div className="text-base font-medium">
              {employee.position_title || "Non renseignée"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Manager</div>
            <div className="text-base font-medium">
              {employee.manager_name || "Aucun"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Date d'embauche</div>
            <div className="text-base font-medium">
              {employee.hire_date
                ? new Date(employee.hire_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Non renseignée"}
            </div>
          </div>
          {employee.termination_date && (
            <div>
              <div className="text-sm text-muted-foreground">Date de fin</div>
              <div className="text-base font-medium">
                {new Date(employee.termination_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          )}
          <div>
            <div className="text-sm text-muted-foreground">Statut d'emploi</div>
            <div className="mt-1">
              <EmploymentStatusBadge status={employee.employment_status} />
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Statut du compte</div>
            <div className="mt-1">
              {employee.is_active ? (
                <Badge variant="success">Actif</Badge>
              ) : (
                <Badge variant="outline">Inactif</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
