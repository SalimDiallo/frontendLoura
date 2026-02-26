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
import { EmploymentStatusBadge } from "@/components/hr";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlineUserCircle,
  HiOutlineExclamationCircle,

} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeOverviewTab({
  employee,
  getGenderLabel
}: {
  employee: Employee;
  getGenderLabel: (gender?: string) => string;
}) {
  return (
    <TabsContent value="overview" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiOutlineUserCircle className="size-5 text-primary" />
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Date de naissance</div>
              <div className="text-sm font-medium">
                {employee.date_of_birth
                  ? new Date(employee.date_of_birth).toLocaleDateString("fr-FR")
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Genre</div>
              <div className="text-sm font-medium">
                {getGenderLabel(employee.gender)}
              </div>
            </div>
            {employee.address && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <HiOutlineMapPin className="size-4" />
                  Adresse
                </div>
                <div className="text-sm font-medium">
                  {employee.address}
                  {employee.city && `, ${employee.city}`}
                  {employee.country && `, ${employee.country}`}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Employment Information */}
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiOutlineBriefcase className="size-5 text-primary" />
            Informations d'emploi
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Date d'embauche</div>
              <div className="text-sm font-medium flex items-center gap-1">
                <HiOutlineCalendar className="size-4" />
                {employee.hire_date
                  ? new Date(employee.hire_date).toLocaleDateString("fr-FR")
                  : "Non renseignée"} 
              </div>
            </div>
            {employee.manager_name && (
              <div>
                <div className="text-sm text-muted-foreground">Manager</div>
                <div className="text-sm font-medium">
                  {employee.manager_name}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Position</div>
              <div className="text-sm font-medium">
                {employee.position_title || "Non renseignée"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Statut</div>
              <div className="mt-1">
                <EmploymentStatusBadge status={employee.employment_status} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Emergency Contact */}
      {employee.emergency_contact && (
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiOutlineExclamationCircle className="size-5 text-primary" />
            Contact d'urgence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nom</div>
              <div className="text-sm font-medium">
                {employee.emergency_contact.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Téléphone</div>
              <div className="text-sm font-medium">
                {employee.emergency_contact.phone}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Relation</div>
              <div className="text-sm font-medium">
                {employee.emergency_contact.relationship}
              </div>
            </div>
          </div>
        </Card>
      )}
    </TabsContent>
  );
}
