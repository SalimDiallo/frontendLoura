"use client";

import {
  Card,
  Badge
} from "@/components/ui";
import { EmploymentStatusBadge } from "@/components/hr";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineIdentification,

} from "react-icons/hi2";


export function EmployeeAvatarAndIdentity({ employee }: { employee: Employee }) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-3xl">
            {employee.first_name?.[0]}
            {employee.last_name?.[0]}
          </div>
        </div>

        {/* Basic Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {employee.role?.name || employee.role_name || "Aucun rôle"} •{" "}
              {employee.department_name || "Aucun département"}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <HiOutlineEnvelope className="size-4 text-muted-foreground" />
              <a href={`mailto:${employee.email}`} className="hover:underline">
                {employee.email}
              </a>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm">
                <HiOutlinePhone className="size-4 text-muted-foreground" />
                <a href={`tel:${employee.phone}`} className="hover:underline">
                  {employee.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <HiOutlineIdentification className="size-4 text-muted-foreground" />
              <span>Matricule: {employee.employee_id || "Non renseigné"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <EmploymentStatusBadge status={employee.employment_status} />
            {employee.is_active ? (
              <Badge variant="success">Actif</Badge>
            ) : (
              <Badge variant="outline">Inactif</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}


